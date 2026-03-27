"use client";
import { createConfig, http, fallback } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { openfortConnector } from "./openfortConnector";

const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ??
  "bee-hive-system-dev";

export const wagmiConfig = createConfig({
  chains: [polygon, polygonAmoy],
  connectors: [
    injected(),
    injected({ target: "metaMask" }),
    walletConnect({ projectId: WC_PROJECT_ID }),
    coinbaseWallet({ appName: "Meta Bee Hive" }),
    openfortConnector,
  ],
  transports: {
    [polygon.id]: fallback([
      http(process.env.NEXT_PUBLIC_POLYGON_RPC ?? "https://polygon-bor-rpc.publicnode.com"),
      http("https://polygon.llamarpc.com"),
      http("https://polygon-rpc.com"),
    ]),
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology"),
  },
});
