import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

export default {
  // vike-reactの拡張を使用
  extends: vikeReact,

  // SSR有効化
  ssr: true,

  // ストリーミングSSR
  stream: true,

  // プリレンダリングは無効
  prerender: false,

  // デフォルトのtitle
  title: "Fandry - クリエイター支援プラットフォーム",

  // デフォルトのdescription
  description: "クリエイターとファンをつなぐパトロン型支援プラットフォーム。投げ銭、有料コンテンツ、月額支援で好きなクリエイターを応援しよう。",

  // サーバーからクライアントに渡すデータ
  passToClient: ["routeParams", "user", "clerkInitialState"],
} satisfies Config;
