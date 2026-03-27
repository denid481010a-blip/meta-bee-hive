/* eslint-disable @typescript-eslint/no-explicit-any */
import { createConnector } from "wagmi";
import { mnemonicToAccount } from "viem/accounts";

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

      async connect(params?: any) {
        const cid: number = params?.chainId ?? chainId;
        emitter.emit("connect", { accounts: [account.address], chainId: cid });
        return { accounts: [account.address] as any, chainId: cid };
      },

      async disconnect() {
        emitter.emit("disconnect");
      },

      async getAccounts() {
        return [account.address] as any;
      },

      async getChainId() {
        return chainId;
      },

      async isAuthorized() {
        return true;
      },

      async getProvider() {
        return {
          on: (_e: string, _l: any) => {},
          removeListener: (_e: string, _l: any) => {},
          request: async ({ method, params: p }: { method: string; params?: readonly unknown[] }): Promise<unknown> => {
            switch (method) {
              case "eth_accounts":
                return [account.address];
              case "eth_chainId":
                return `0x${chainId.toString(16)}`;
              case "personal_sign": {
                const [message] = (p as [string, string]) ?? [];
                return account.signMessage({ message: { raw: message as `0x${string}` } });
              }
              case "eth_signTypedData_v4": {
                const [, typedDataStr] = (p as [string, string]) ?? [];
                const { domain, types, primaryType, message: msg } = JSON.parse(typedDataStr);
                const { EIP712Domain: _, ...restTypes } = types;
                return account.signTypedData({ domain, types: restTypes, primaryType, message: msg });
              }
              case "eth_sendTransaction": {
                const [tx] = (p as [{ to: string; data?: string; value?: string }]) ?? [];
                const { createPublicClient, createWalletClient, http, parseGwei } = await import("viem");
                const chain = config.chains[0];
                const pub = createPublicClient({ chain, transport: http() });
                const wal = createWalletClient({ account, chain, transport: http() });
                const nonce = await pub.getTransactionCount({ address: account.address });
                const gasPrice = await pub.getGasPrice();
                return wal.sendTransaction({
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
  }) as any;
}
