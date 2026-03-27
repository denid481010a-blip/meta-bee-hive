import { createConnector } from "wagmi";
import { mnemonicToAccount } from "viem/accounts";
import type { Address } from "viem";

export function createMnemonicConnector(mnemonic: string) {
  const account = mnemonicToAccount(mnemonic.trim());

  return createConnector((config) => {
    const emitter = config.emitter;
    const chainId = config.chains[0]?.id ?? 137;

    return {
      id: "mnemonic-wallet",
      name: "Secret Phrase",
      type: "mnemonic",

      async setup() {},

      async connect(_params?: { chainId?: number }) {
        const cid = _params?.chainId ?? chainId;
        emitter.emit("connect", {
          accounts: [account.address] as readonly Address[],
          chainId: cid,
        });
        return {
          accounts: [account.address] as readonly Address[],
          chainId: cid,
        };
      },

      async disconnect() {
        emitter.emit("disconnect");
      },

      async getAccounts(): Promise<readonly Address[]> {
        return [account.address];
      },

      async getChainId() {
        return chainId;
      },

      async isAuthorized() {
        return true;
      },

      async getProvider() {
        return {
          on: (_event: string, _listener: (...args: unknown[]) => void) => {},
          removeListener: (_event: string, _listener: (...args: unknown[]) => void) => {},
          request: async ({
            method,
            params: p,
          }: {
            method: string;
            params?: readonly unknown[];
          }): Promise<unknown> => {
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
                const parsed = JSON.parse(typedDataStr);
                const { domain, types, primaryType, message: msg } = parsed;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { EIP712Domain: _removed, ...restTypes } = types;
                return account.signTypedData({
                  domain,
                  types: restTypes,
                  primaryType,
                  message: msg,
                });
              }
              case "eth_sendTransaction": {
                const [tx] = (p as [{ to: string; data?: string; value?: string }]) ?? [];
                const { createPublicClient, createWalletClient, http, parseGwei } = await import("viem");
                const chain = config.chains[0];
                const publicClient = createPublicClient({ chain, transport: http() });
                const walletClient = createWalletClient({ account, chain, transport: http() });
                const nonce = await publicClient.getTransactionCount({ address: account.address });
                const gasPrice = await publicClient.getGasPrice();
                return walletClient.sendTransaction({
                  to: tx.to as `0x${string}`,
                  data: (tx.data ?? "0x") as `0x${string}`,
                  value: tx.value ? BigInt(tx.value) : 0n,
                  nonce,
                  gasPrice: gasPrice + parseGwei("5"),
                });
              }
              default:
                throw new Error(`Method ${method} not supported`);
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
