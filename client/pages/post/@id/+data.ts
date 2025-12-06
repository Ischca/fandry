import type { PageContextServer } from "vike/types";
import { getPostWithAccess, getSubscriptionPlansByCreatorId } from "../../../../server/db";

export type PostPageData = {
  post: Awaited<ReturnType<typeof getPostWithAccess>>;
  plans: Awaited<ReturnType<typeof getSubscriptionPlansByCreatorId>>;
};

export async function data(pageContext: PageContextServer): Promise<PostPageData> {
  const { id } = pageContext.routeParams;
  const postId = parseInt(id || "0");

  if (!postId) {
    return {
      post: null,
      plans: [],
    };
  }

  // Fetch post without user context for SSR (no access check)
  const post = await getPostWithAccess(postId);

  if (!post) {
    return {
      post: null,
      plans: [],
    };
  }

  // Fetch plans for membership posts
  let plans: Awaited<ReturnType<typeof getSubscriptionPlansByCreatorId>> = [];
  if (post.type === "membership") {
    plans = await getSubscriptionPlansByCreatorId(post.creatorId);
  }

  return {
    post,
    plans,
  };
}
