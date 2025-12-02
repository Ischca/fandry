import {
  publicProcedure,
  protectedProcedure,
  router,
  z,
  sql,
  eq,
  getDb,
  media,
  ErrorMessages,
  assertDb,
  throwBadRequest,
} from "./_shared";
import {
  generatePresignedUploadUrl,
  validateFileType,
  isR2Configured,
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "../upload";

export const uploadRouter = router({
  getConfig: publicProcedure.query(() => ({
    isConfigured: isR2Configured(),
    allowedTypes: ALLOWED_MIME_TYPES,
    maxImageSize: MAX_IMAGE_SIZE,
    maxVideoSize: MAX_VIDEO_SIZE,
  })),

  getPresignedUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      contentType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await generatePresignedUploadUrl(
        ctx.user.id,
        input.fileName,
        input.contentType,
        input.fileSize
      );

      if ("error" in result) {
        throwBadRequest(result.error);
      }

      return result;
    }),

  confirmUpload: protectedProcedure
    .input(z.object({
      key: z.string(),
      url: z.string(),
      mimeType: z.string(),
      size: z.number(),
      width: z.number().optional(),
      height: z.number().optional(),
      duration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const typeInfo = validateFileType(input.mimeType);
      if (!typeInfo.valid || !typeInfo.type) {
        throwBadRequest(ErrorMessages.INVALID_FILE_TYPE);
      }

      const db = await getDb();
      assertDb(db);

      const [inserted] = await db.insert(media).values({
        userId: ctx.user.id,
        key: input.key,
        url: input.url,
        type: typeInfo.type,
        mimeType: input.mimeType,
        size: input.size,
        width: input.width,
        height: input.height,
        duration: input.duration,
      }).returning();

      return inserted;
    }),

  getMyMedia: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select()
        .from(media)
        .where(eq(media.userId, ctx.user.id))
        .orderBy(sql`${media.createdAt} DESC`)
        .limit(input.limit || 50);
    }),
});
