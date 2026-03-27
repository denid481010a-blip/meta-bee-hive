"use client";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { TelegramProvider } from "./TelegramProvider";
import { PrivyAuthProvider } from "./PrivyContext";
import { useState, useEffect } from "react";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 2 },
        },
      })
  );

  // Privy and wagmi access browser APIs (window, crypto, localStorage)
  // during initialization — skip SSR entirely to avoid 500 errors.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <PrivyAuthProvider>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <TelegramProvider>{children}</TelegramProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyAuthProvider>
  );
}
