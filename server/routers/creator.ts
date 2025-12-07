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

// Validate skill tags JSON
function validateSkillTags(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error("Skill tags must be an array");
  }

  if (parsed.length > 10) {
    throw new Error("Maximum 10 skill tags allowed");
  }

  const sanitized = parsed
    .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    .map(tag => tag.trim().slice(0, 32));

  return JSON.stringify(sanitized);
}

// Validate featured post IDs JSON
function validateFeaturedPostIds(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error("Featured post IDs must be an array");
  }

  if (parsed.length > 3) {
    throw new Error("Maximum 3 featured posts allowed");
  }

  const sanitized = parsed
    .filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0);

  return JSON.stringify(sanitized);
}

// Valid creator status values
const VALID_STATUSES = ["available", "busy", "closed", "custom"] as const;

// Validate and sanitize profile links JSON (litlink-style custom links)
function validateProfileLinks(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error("Profile links must be an array");
  }

  if (parsed.length > 10) {
    throw new Error("Maximum 10 profile links allowed");
  }

  const sanitized = parsed.map((link, index) => {
    if (!link.id || typeof link.id !== "string") {
      throw new Error(`Link ${index + 1}: missing id`);
    }
    if (!link.title || typeof link.title !== "string") {
      throw new Error(`Link ${index + 1}: missing title`);
    }
    if (!link.url || typeof link.url !== "string") {
      throw new Error(`Link ${index + 1}: missing url`);
    }
    if (!isValidUrl(link.url)) {
      throw new Error(`Link ${index + 1}: invalid URL (must be http or https)`);
    }

    return {
      id: link.id.slice(0, 64),
      title: link.title.slice(0, 50),
      url: link.url.slice(0, 500),
      icon: typeof link.icon === "string" ? link.icon.slice(0, 32) : "link",
      color: typeof link.color === "string" ? link.color.slice(0, 16) : undefined,
    };
  });

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
      socialLinks: z.string().optional().nullable(),
      profileLinks: z.string().optional().nullable(),
      showStats: z.number().min(0).max(1).optional(),
      showPosts: z.number().min(0).max(1).optional(),
      // Creator identity fields
      creatorTitle: z.string().max(64).optional().nullable(),
      skillTags: z.string().optional().nullable(), // JSON array
      creatorStatus: z.enum(["available", "busy", "closed", "custom"]).optional().nullable(),
      statusMessage: z.string().max(100).optional().nullable(),
      featuredPostIds: z.string().optional().nullable(), // JSON array of post IDs
      accentColor: z.string().max(16).optional().nullable(),
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

      // Validate and sanitize profile links if provided
      if (input.profileLinks) {
        try {
          sanitizedInput.profileLinks = validateProfileLinks(input.profileLinks);
        } catch (error) {
          throwBadRequest(error instanceof Error ? error.message : "Invalid profile links");
        }
      }

      // Validate skill tags if provided
      if (input.skillTags) {
        try {
          sanitizedInput.skillTags = validateSkillTags(input.skillTags);
        } catch (error) {
          throwBadRequest(error instanceof Error ? error.message : "Invalid skill tags");
        }
      }

      // Validate featured post IDs if provided
      if (input.featuredPostIds) {
        try {
          sanitizedInput.featuredPostIds = validateFeaturedPostIds(input.featuredPostIds);
        } catch (error) {
          throwBadRequest(error instanceof Error ? error.message : "Invalid featured posts");
        }
      }

      await updateCreator(creator[0].id, sanitizedInput);
      return { success: true };
    }),
});
