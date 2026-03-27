import { createConnector } from "wagmi";
import { mnemonicToAccount } from "viem/accounts";
import type { Address } from "viem";

export function createMnemonicConnector(mnemonic: string) {
  const account = mnemonicToAccount(mnemonic.trim());

  return createConnector((config) => {
    const emitter = config.emitter;

    return {
      id: "mnemonic-wallet",
      name: "Secret Phrase",
      type: "mnemonic" as const,

      async setup() {},

      async connect(params?: { chainId?: number }) {
        const chainId = params?.chainId ?? config.chains[0]?.id ?? 137;
        emitter.emit("connect", {
          accounts: [account.address] as Address[],
          chainId,
        });
        return { accounts: [account.address] as Address[], chainId };
      },

      async disconnect() {
        emitter.emit("disconnect");
      },

      async getAccounts() {
        return [account.address] as Address[];
      },

      async getChainId() {
        return config.chains[0]?.id ?? 137;
      },

      async isAuthorized() {
        return true;
      },

      async getProvider() {
        const chainId = config.chains[0]?.id ?? 137;
        return {
          on: () => {},
          removeListener: () => {},
          request: async ({
            method,
            params: p,
          }: {
            method: string;
            params?: readonly unknown[];
          }) => {
            switch (method) {
              case "eth_accounts":
                return [account.address];
              case "eth_chainId":
                return `0x${chainId.toString(16)}`;
              case "personal_sign": {
                const [message] = (p as [string, string]) ?? [];
                return account.signMessage({
                  message: { raw: message as `0x${string}` },
                });
              }
              case "eth_signTypedData_v4": {
                const [, typedDataStr] = (p as [string, string]) ?? [];
                const { domain, types, primaryType, message: msg } =
                  JSON.parse(typedDataStr);
                const { EIP712Domain: _, ...restTypes } = types;
                return account.signTypedData({
                  domain,
                  types: restTypes,
                  primaryType,
                  message: msg,
                });
              }
              case "eth_sendTransaction": {
                const [tx] = (p as [{ to: string; data: string; value?: string }]) ?? [];
                const { createPublicClient, http, parseGwei } = await import("viem");
                const chain = config.chains[0];
                const publicClient = createPublicClient({
                  chain,
                  transport: http(),
                });
                const { createWalletClient } = await import("viem");
                const walletClient = createWalletClient({
                  account,
                  chain,
                  transport: http(),
                });
                const nonce = await publicClient.getTransactionCount({
                  address: account.address,
                });
                const gasPrice = await publicClient.getGasPrice();
                const hash = await walletClient.sendTransaction({
                  to: tx.to as `0x${string}`,
                  data: (tx.data ?? "0x") as `0x${string}`,
                  value: tx.value ? BigInt(tx.value) : 0n,
                  nonce,
                  gasPrice: gasPrice + parseGwei("5"),
                });
                return hash;
              }
              default:
                throw new Error(`Method ${method} not supported by mnemonic wallet`);
            }
          },
        };
      },

      onAccountsChanged() {},
      onChainChanged() {},
      onDisconnect() {},
    };
  });
}
