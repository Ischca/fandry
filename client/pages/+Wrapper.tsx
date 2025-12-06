import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { trpc } from "../src/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useRef, useState } from "react";
import superjson from "superjson";
import { Toaster } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import ErrorBoundary from "../src/components/ErrorBoundary";
import { AgeVerification } from "../src/components/AgeVerification";
import { ThemeProvider } from "../src/contexts/ThemeContext";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function TrpcProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  // Keep a ref to always get the latest getToken
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [queryClient] = useState(() => new QueryClient());

  // Create trpcClient only once using useState initializer
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

export function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <TrpcProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <Toaster />
              <AgeVerification>
                {children}
              </AgeVerification>
            </TooltipProvider>
          </ThemeProvider>
        </TrpcProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
