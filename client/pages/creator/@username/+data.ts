import type { PageContextServer } from "vike/types";
import { getCreatorByUsername, getPostsByCreatorId, getSubscriptionPlansByCreatorId } from "../../../../server/db";

export type CreatorPageData = {
  creator: Awaited<ReturnType<typeof getCreatorByUsername>>;
  posts: Awaited<ReturnType<typeof getPostsByCreatorId>>;
  plans: Awaited<ReturnType<typeof getSubscriptionPlansByCreatorId>>;
};

export async function data(pageContext: PageContextServer): Promise<CreatorPageData> {
  const { username } = pageContext.routeParams;

  const creator = await getCreatorByUsername(username);

  if (!creator) {
    return {
      creator: undefined,
      posts: [],
      plans: [],
    };
  }

  const [posts, plans] = await Promise.all([
    getPostsByCreatorId(creator.id, 20),
    getSubscriptionPlansByCreatorId(creator.id),
  ]);

  return {
    creator,
    posts,
    plans,
  };
}
