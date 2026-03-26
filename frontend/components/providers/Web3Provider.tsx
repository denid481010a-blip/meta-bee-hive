"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { TelegramProvider } from "./TelegramProvider";
import { OpenfortProvider } from "./OpenfortContext";
import { useState } from "react";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 2 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <OpenfortProvider>
          <TelegramProvider>{children}</TelegramProvider>
        </OpenfortProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
