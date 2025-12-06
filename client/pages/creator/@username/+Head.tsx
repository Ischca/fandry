import { useData } from "vike-react/useData";
import type { CreatorPageData } from "./+data";

export function Head() {
  const { creator } = useData<CreatorPageData>();

  if (!creator) {
    return (
      <>
        <title>クリエイターが見つかりません | Fandry</title>
        <meta name="robots" content="noindex" />
      </>
    );
  }

  const title = `${creator.displayName} (@${creator.username}) | Fandry`;
  const description = creator.bio
    ? creator.bio.substring(0, 160)
    : `${creator.displayName}さんのクリエイターページ。Fandryで応援しよう！`;
  const imageUrl = creator.avatarUrl || "https://fndry.app/og-default.png";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="profile" />
      <meta property="og:url" content={`https://fndry.app/creator/${creator.username}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <link rel="canonical" href={`https://fndry.app/creator/${creator.username}`} />
    </>
  );
}
