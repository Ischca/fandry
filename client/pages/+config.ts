import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

export default {
  // SSRを有効化
  ssr: true,

  // プリレンダリングは無効
  prerender: false,

  // vike-reactの拡張を使用
  extends: [vikeReact],

  // デフォルトのtitle
  title: "Fandry - クリエイター支援プラットフォーム",

  // デフォルトのdescription
  description: "クリエイターとファンをつなぐパトロン型支援プラットフォーム。投げ銭、有料コンテンツ、月額支援で好きなクリエイターを応援しよう。",

  // パス別名設定（Vikeがpath aliasを解決できるように）
  passToClient: ["routeParams", "user"],
} satisfies Config;
