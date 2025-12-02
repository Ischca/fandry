import {
  publicProcedure,
  router,
  z,
} from "./_shared";
import { getAllCreators, searchCreators, getCreatorsByCategory } from "../db";

export const discoverRouter = router({
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
});
