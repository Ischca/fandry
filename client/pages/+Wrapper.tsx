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

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// SSR環境かどうかを判定
const isServer = typeof window === "undefined";

// tRPC Provider（Clerkの中で使用）
function TrpcProviderWithAuth({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
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

// SSR時のレンダリング（Clerkなし、基本的なtRPCのみ）
function SSRWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProviderNoAuth>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </TrpcProviderNoAuth>
  );
}

// クライアント側のフルレンダリング（Clerk + tRPC）
function ClientFullWrapper({ children }: { children: React.ReactNode }) {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Configuration Error</h1>
          <p className="mt-2 text-muted-foreground">
            Missing VITE_CLERK_PUBLISHABLE_KEY environment variable
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <TrpcProviderWithAuth>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <AgeVerification>
              {children}
            </AgeVerification>
          </TooltipProvider>
        </ThemeProvider>
      </TrpcProviderWithAuth>
    </ClerkProvider>
  );
}

export function Wrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR時またはハイドレーション前
  if (isServer || !mounted) {
    return (
      <ErrorBoundary>
        <SSRWrapper>{children}</SSRWrapper>
      </ErrorBoundary>
    );
  }

  // クライアントでハイドレーション完了後
  return (
    <ErrorBoundary>
      <ClientFullWrapper>{children}</ClientFullWrapper>
    </ErrorBoundary>
  );
}
