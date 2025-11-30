import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import {
  getCreatorByUsername,
  createCreator,
  updateCreator,
  getPostsByCreatorId,
  getPostById,
  getPostWithAccess,
  createPost,
  createTip,
  getTipsByCreatorId,
  followCreator,
  unfollowCreator,
  isFollowing,
  getCommentsByPostId,
  createComment,
  likePost,
  unlikePost,
  hasLiked,
  getDb,
  getFollowingPosts,
  getAllCreators,
  searchCreators,
  getCreatorsByCategory,
} from "./db";
import { creators } from "../drizzle/schema";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Creator router
  creator: router({
    getByUsername: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        const creator = await getCreatorByUsername(input.username);
        if (!creator) throw new TRPCError({ code: 'NOT_FOUND', message: 'Creator not found' });
        return creator;
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
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Username already taken' });
        
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
        if (!creator || creator.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Creator profile not found' });
        }
        await updateCreator(creator[0].id, input);
        return { success: true };
      }),
  }),

  // Post router
  post: router({
    getByCreatorUsername: publicProcedure
      .input(z.object({ username: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const creator = await getCreatorByUsername(input.username);
        if (!creator) return [];
        return getPostsByCreatorId(creator.id, input.limit);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id;
        const post = await getPostWithAccess(input.id, userId);
        if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        return post;
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().max(256).optional(),
        content: z.string(),
        type: z.enum(['free', 'paid', 'membership']),
        price: z.number().optional(),
        membershipTier: z.number().optional(),
        mediaUrls: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getDb().then(db => 
          db?.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1)
        );
        if (!creator || creator.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You must be a creator to post' });
        }
        await createPost({
          creatorId: creator[0].id,
          title: input.title,
          content: input.content,
          type: input.type,
          price: input.price,
          membershipTier: input.membershipTier,
          mediaUrls: input.mediaUrls,
        });
        return { success: true };
      }),
  }),

  // Tip router
  tip: router({
    create: protectedProcedure
      .input(z.object({
        creatorId: z.number(),
        amount: z.number().min(100),
        message: z.string().optional(),
        isRecurring: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createTip({
          userId: ctx.user.id,
          creatorId: input.creatorId,
          amount: input.amount,
          message: input.message,
          isRecurring: input.isRecurring ? 1 : 0,
        });
        
        // Update creator's total support
        const db = await getDb();
        if (db) {
          await db.update(creators)
            .set({ totalSupport: sql`${creators.totalSupport} + ${input.amount}` })
            .where(eq(creators.id, input.creatorId));
        }
        
        return { success: true };
      }),
    
    getByCreatorId: publicProcedure
      .input(z.object({ creatorId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getTipsByCreatorId(input.creatorId, input.limit);
      }),
  }),

  // Follow router
  follow: router({
    toggle: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const following = await isFollowing(ctx.user.id, input.creatorId);
        if (following) {
          await unfollowCreator(ctx.user.id, input.creatorId);
          return { following: false };
        } else {
          await followCreator(ctx.user.id, input.creatorId);
          return { following: true };
        }
      }),
    
    check: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ ctx, input }) => {
        return { following: await isFollowing(ctx.user.id, input.creatorId) };
      }),
  }),

  // Comment router
  comment: router({
    getByPostId: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return getCommentsByPostId(input.postId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        await createComment({
          userId: ctx.user.id,
          postId: input.postId,
          content: input.content,
        });
        return { success: true };
      }),
  }),

  // Feed router
  feed: router({
    getFollowingPosts: protectedProcedure.query(async ({ ctx }) => {
      return await getFollowingPosts(ctx.user.id);
    }),
  }),

  // Discover router
  discover: router({
    getAllCreators: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllCreators(input?.limit);
      }),
    
    searchCreators: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await searchCreators(input.query, input.limit);
      }),
    
    getByCategory: publicProcedure
      .input(z.object({ category: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await getCreatorsByCategory(input.category, input.limit);
      }),
  }),

  // Like router
  like: router({
    toggle: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await hasLiked(ctx.user.id, input.postId);
        if (liked) {
          await unlikePost(ctx.user.id, input.postId);
          return { liked: false };
        } else {
          await likePost(ctx.user.id, input.postId);
          return { liked: true };
        }
      }),
    
    check: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ ctx, input }) => {
        return { liked: await hasLiked(ctx.user.id, input.postId) };
      }),
  }),
});

export type AppRouter = typeof appRouter;
