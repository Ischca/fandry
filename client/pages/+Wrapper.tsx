import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { trpc } from "../src/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useRef, useState, useEffect } from "react";
import superjson from "superjson";
import { Toaster } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import ErrorBoundary from "../src/components/ErrorBoundary";
import { AgeVerification } from "../src/components/AgeVerification";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { usePageContext } from "vike-react/usePageContext";
import type { InitialState } from "@clerk/shared/types";
import { ClerkAvailableContext } from "../src/_core/hooks/useAuth";
import { Router } from "wouter";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// デバッグ: ビルド時の環境変数確認（本番デプロイ後に削除）
if (typeof window !== "undefined") {
  console.log("[Clerk Debug] VITE_CLERK_PUBLISHABLE_KEY exists:", !!CLERK_PUBLISHABLE_KEY);
  console.log("[Clerk Debug] Key prefix:", CLERK_PUBLISHABLE_KEY?.substring(0, 10) || "EMPTY");
}

// SSR環境かどうかを判定
const isServer = typeof window === "undefined";

// tRPC Provider（Clerkの中で使用、認証トークンを自動付与）
function TrpcProviderWithAuth({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          async headers() {
            if (!isLoaded) {
              return {};
            }
            const token = await getTokenRef.current();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

// SSR用のtRPC Provider（認証なし）
function TrpcProviderNoAuth({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

// クライアント専用Wrapper（Clerkあり）
function ClientWrapperWithClerk({
  children,
  ssrPath,
  ssrSearch,
  clerkInitialState,
  isClerkAvailable,
}: {
  children: React.ReactNode;
  ssrPath: string;
  ssrSearch: string;
  clerkInitialState: InitialState | null | undefined;
  isClerkAvailable: boolean;
}) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
      initialState={clerkInitialState ?? undefined}
    >
      <ClerkAvailableContext.Provider value={isClerkAvailable}>
        <Router ssrPath={ssrPath} ssrSearch={ssrSearch}>
          <TrpcProviderWithAuth>
            <ThemeProvider defaultTheme="light">
              <TooltipProvider>
                <Toaster />
                <AgeVerification>{children}</AgeVerification>
              </TooltipProvider>
            </ThemeProvider>
          </TrpcProviderWithAuth>
        </Router>
      </ClerkAvailableContext.Provider>
    </ClerkProvider>
  );
}

// SSR/初回レンダリング用Wrapper（Clerkなし）
function SSRWrapper({
  children,
  ssrPath,
  ssrSearch,
}: {
  children: React.ReactNode;
  ssrPath: string;
  ssrSearch: string;
}) {
  return (
    <ClerkAvailableContext.Provider value={false}>
      <Router ssrPath={ssrPath} ssrSearch={ssrSearch}>
        <TrpcProviderNoAuth>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </TrpcProviderNoAuth>
      </Router>
    </ClerkAvailableContext.Provider>
  );
}

export function Wrapper({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext();
  const clerkInitialState = (pageContext as { clerkInitialState?: InitialState | null })
    .clerkInitialState;

  // URLをpageContextから取得（SSR用）
  const ssrPath = pageContext.urlPathname || "/";
  const ssrSearch = pageContext.urlParsed?.searchOriginal || "";

  // クライアントでマウント済みかどうか
  // SSRとクライアント初回レンダリングでは同じ構造を使う
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR時 または クライアント初回レンダリング時はSSRWrapperを使用
  // これによりハイドレーションの不整合を防ぐ
  if (isServer || !mounted) {
    return (
      <ErrorBoundary>
        <SSRWrapper ssrPath={ssrPath} ssrSearch={ssrSearch}>
          {children}
        </SSRWrapper>
      </ErrorBoundary>
    );
  }

  // クライアントでマウント後、Clerk keyがない場合
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-600">Configuration Error</h1>
            <p className="mt-2 text-muted-foreground">
              Missing VITE_CLERK_PUBLISHABLE_KEY environment variable
            </p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // クライアントでマウント後、Clerkを有効化
  return (
    <ErrorBoundary>
      <ClientWrapperWithClerk
        ssrPath={ssrPath}
        ssrSearch={ssrSearch}
        clerkInitialState={clerkInitialState}
        isClerkAvailable={true}
      >
        {children}
      </ClientWrapperWithClerk>
    </ErrorBoundary>
  );
}
