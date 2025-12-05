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
} from "./_shared";
import {
  getCreatorByUsername,
  createCreator,
  updateCreator,
} from "../db";

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
      await updateCreator(creator[0].id, input);
      return { success: true };
    }),
});
