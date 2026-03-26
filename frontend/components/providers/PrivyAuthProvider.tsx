"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { polygon } from "wagmi/chains";
import type { ReactNode } from "react";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "cmn7dsob8005q0clamnw3e385";

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["telegram", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#F5A623",
          logo: "https://metabeehive.com/icon.png",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        defaultChain: polygon,
        supportedChains: [polygon],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
