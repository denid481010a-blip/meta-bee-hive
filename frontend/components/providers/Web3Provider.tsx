"use client";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { TelegramProvider } from "./TelegramProvider";
import { PrivyAuthProvider } from "./PrivyAuthProvider";
import { useState } from "react";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000, retry: 2 },
    },
  }));

  return (
    <PrivyAuthProvider>
      <QueryClientProvider client={queryClient}>
        <SmartWalletsProvider>
          <TelegramProvider>
            <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
              {children}
            </WagmiProvider>
          </TelegramProvider>
        </SmartWalletsProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  );
}
