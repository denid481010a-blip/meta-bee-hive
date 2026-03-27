import { createConfig } from "@privy-io/wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { http, fallback } from "wagmi";

export const wagmiConfig = createConfig({
  chains: [polygon, polygonAmoy],
  transports: {
    [polygon.id]: fallback([
      http(process.env.NEXT_PUBLIC_POLYGON_RPC ?? "https://polygon-bor-rpc.publicnode.com"),
      http("https://polygon.llamarpc.com"),
      http("https://polygon-rpc.com"),
    ]),
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology"),
  },
});
