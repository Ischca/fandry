export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Amount limits (in JPY)
// Max safe integer for JavaScript number precision: 9,007,199,254,740,991
// We use 1 billion (10億円) as a practical limit
export const MAX_AMOUNT_JPY = 1_000_000_000;
export const MIN_TIP_AMOUNT = 100;
export const MIN_POST_PRICE = 100;
export const MAX_POST_PRICE = 1_000_000;
export const MIN_WITHDRAWAL_AMOUNT = 1000;

// Creator categories
export const CREATOR_CATEGORIES = [
  { value: "illustration", label: "イラスト" },
  { value: "manga", label: "漫画" },
  { value: "cosplay", label: "コスプレ" },
  { value: "photo", label: "写真" },
  { value: "video", label: "動画" },
  { value: "music", label: "音楽" },
  { value: "vtuber", label: "VTuber" },
  { value: "game", label: "ゲーム" },
  { value: "other", label: "その他" },
] as const;

export type CreatorCategory = typeof CREATOR_CATEGORIES[number]["value"];
