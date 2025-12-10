// SSR-safe Clerk UI コンポーネント
// vike-reactのclientOnly()を使用して、SSR時はレンダリングせずクライアントでのみ表示

import { clientOnly } from "vike-react/clientOnly";
import type { SignInButtonProps, UserButtonProps } from "@clerk/clerk-react";

// SignInButton - クライアントでのみレンダリング
export const ClientSignInButton = clientOnly(
  async () => {
    const { SignInButton } = await import("@clerk/clerk-react");
    return { default: SignInButton };
  },
  {
    // SSR時のフォールバック（ローディング表示）
    fallback: (
      <button
        disabled
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary/50 text-primary-foreground opacity-50"
      >
        ログイン
      </button>
    ),
  }
);

// UserButton - クライアントでのみレンダリング
export const ClientUserButton = clientOnly(
  async () => {
    const { UserButton } = await import("@clerk/clerk-react");
    return { default: UserButton };
  },
  {
    // SSR時のフォールバック（アバタープレースホルダー）
    fallback: (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    ),
  }
);

// SignUpButton - クライアントでのみレンダリング
export const ClientSignUpButton = clientOnly(
  async () => {
    const { SignUpButton } = await import("@clerk/clerk-react");
    return { default: SignUpButton };
  },
  {
    fallback: (
      <button
        disabled
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background opacity-50"
      >
        登録
      </button>
    ),
  }
);

// SignOutButton - クライアントでのみレンダリング
export const ClientSignOutButton = clientOnly(
  async () => {
    const { SignOutButton } = await import("@clerk/clerk-react");
    return { default: SignOutButton };
  },
  {
    fallback: null,
  }
);
