import { useData } from "vike-react/useData";
import type { PostPageData } from "./+data";

export function Head() {
  const { post } = useData<PostPageData>();

  if (!post) {
    return (
      <>
        <title>投稿が見つかりません | Fandry</title>
        <meta name="robots" content="noindex" />
      </>
    );
  }

  const title = post.title
    ? `${post.title} | ${post.creatorDisplayName} | Fandry`
    : `${post.creatorDisplayName}の投稿 | Fandry`;

  // For paid/membership posts, show a teaser description
  let description: string;
  if (post.type === "free" && post.content) {
    description = post.content.substring(0, 160);
  } else if (post.type === "paid") {
    description = `${post.creatorDisplayName}による有料コンテンツ（¥${post.price?.toLocaleString()}）`;
  } else if (post.type === "membership") {
    description = `${post.creatorDisplayName}による会員限定コンテンツ`;
  } else {
    description = `${post.creatorDisplayName}さんの投稿をFandryでチェック`;
  }

  // Try to get first image from mediaUrls for OGP
  let imageUrl = "https://fndry.app/og-default.png";
  if (post.mediaUrls && post.type === "free") {
    try {
      const urls = JSON.parse(post.mediaUrls);
      if (urls.length > 0 && !urls[0].match(/\.(mp4|webm|ogg|mov)$/i)) {
        imageUrl = urls[0];
      }
    } catch {
      // Use default image
    }
  } else if (post.creatorAvatarUrl) {
    imageUrl = post.creatorAvatarUrl;
  }

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={`https://fndry.app/post/${post.id}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <link rel="canonical" href={`https://fndry.app/post/${post.id}`} />
      <meta property="article:author" content={post.creatorDisplayName || ""} />
      <meta property="article:published_time" content={post.createdAt?.toString() || ""} />
    </>
  );
}
