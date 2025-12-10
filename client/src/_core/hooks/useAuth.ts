import { useUser, useClerk } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { useCallback, useMemo, createContext, useContext, useState, useEffect } from "react";

// Clerkが利用可能かどうかを示すコンテキスト
// SSR時はfalse、クライアントでClerkProviderがマウントされたらtrue
export const ClerkAvailableContext = createContext<boolean>(false);

// SSR時またはClerk未ロード時のデフォルト値
const DEFAULT_AUTH_STATE = {
  user: null,
  clerkUser: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  isSignedIn: false,
  refresh: () => Promise.resolve({ data: null, error: null }),
  logout: () => Promise.resolve(),
};

// SSR-safe auth hook
// SSR時やClerkが利用できない時は安全なデフォルト値を返す
export function useAuth() {
  const isClerkAvailable = useContext(ClerkAvailableContext);

  // SSR時またはClerkが利用できない場合はデフォルト値を返す
  // useAuthWithClerk内部でClerk hooksを使用するため、
  // Clerkが利用可能な場合のみそちらを使用する
  if (!isClerkAvailable) {
    return DEFAULT_AUTH_STATE;
  }

  // クライアント側でClerkが利用可能な場合は、実際のhookを使用
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAuthWithClerk();
}

// 内部用：Clerk hooksを使用する実際の認証ロジック
// ClerkProviderがある場合のみ呼び出される
function useAuthWithClerk() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const utils = trpc.useUtils();

  // Get user from our database
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isSignedIn,
  });

  const logout = useCallback(async () => {
    await signOut();
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [signOut, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      clerkUser: clerkUser ?? null,
      loading: !isLoaded || (isSignedIn && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(isSignedIn && meQuery.data),
      isSignedIn: Boolean(isSignedIn),
    };
  }, [clerkUser, isLoaded, isSignedIn, meQuery.data, meQuery.error, meQuery.isLoading]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
