"use client";
import { createConfig, http } from "wagmi";
import { polygon, polygonMumbai, hardhat } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ??
  "bee-hive-system-dev";

export const wagmiConfig = createConfig({
  chains: [polygon, polygonMumbai, hardhat],
  connectors: [
    injected({ target: "metaMask" }),
    walletConnect({ projectId: WC_PROJECT_ID }),
  ],
  transports: {
    [polygon.id]:       http(process.env.NEXT_PUBLIC_POLYGON_RPC ?? "https://polygon-rpc.com"),
    [polygonMumbai.id]: http("https://rpc-mumbai.maticvigil.com"),
    [hardhat.id]:       http("http://127.0.0.1:8545"),
  },
});
