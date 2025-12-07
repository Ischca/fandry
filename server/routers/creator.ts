import {
  publicProcedure,
  protectedProcedure,
  router,
  z,
  eq,
  getDb,
  creators,
  ErrorMessages,
  assertFound,
  throwConflict,
  throwBadRequest,
} from "./_shared";
import {
  getCreatorByUsername,
  createCreator,
  updateCreator,
} from "../db";

// Validate URL to only allow http/https protocols
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Validate and sanitize social links JSON
function validateSocialLinks(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  const sanitized: Record<string, string> = {};

  const allowedKeys = ["twitter", "instagram", "youtube", "website"];

  for (const key of allowedKeys) {
    if (parsed[key] && typeof parsed[key] === "string") {
      const url = parsed[key].trim();
      if (url && !isValidUrl(url)) {
        throw new Error(`Invalid URL for ${key}: must be http or https`);
      }
      if (url) {
        sanitized[key] = url;
      }
    }
  }

  return JSON.stringify(sanitized);
}

export const creatorRouter = router({
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const creator = await getCreatorByUsername(input.username);
      assertFound(creator, ErrorMessages.CREATOR_NOT_FOUND);
      return creator;
    }),

  // Get current user's creator profile
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const result = await db
      ?.select()
      .from(creators)
      .where(eq(creators.userId, ctx.user.id))
      .limit(1);
    return result?.[0] ?? null;
  }),

  create: protectedProcedure
    .input(z.object({
      username: z.string().min(3).max(64),
      displayName: z.string().min(1).max(128),
      bio: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getCreatorByUsername(input.username);
      if (existing) {
        throwConflict(ErrorMessages.USERNAME_TAKEN);
      }

      await createCreator({
        userId: ctx.user.id,
        username: input.username,
        displayName: input.displayName,
        bio: input.bio,
        category: input.category,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      displayName: z.string().min(1).max(128).optional(),
      bio: z.string().optional(),
      avatarUrl: z.string().optional(),
      coverUrl: z.string().optional(),
      category: z.string().optional(),
      socialLinks: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const creator = await getDb().then(db =>
        db?.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1)
      );
      assertFound(creator?.[0], ErrorMessages.CREATOR_NOT_FOUND);

      // Validate and sanitize social links if provided
      const sanitizedInput = { ...input };
      if (input.socialLinks) {
        try {
          sanitizedInput.socialLinks = validateSocialLinks(input.socialLinks);
        } catch (error) {
          throwBadRequest(error instanceof Error ? error.message : "Invalid social links");
        }
      }

      await updateCreator(creator[0].id, sanitizedInput);
      return { success: true };
    }),
});
