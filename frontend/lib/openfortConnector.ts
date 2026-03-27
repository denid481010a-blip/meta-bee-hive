import { createConnector } from "wagmi";
import type { EIP1193Provider } from "viem";

// Global provider set after Openfort auth
let _provider: EIP1193Provider | null = null;

export function setOpenfortEIP1193Provider(p: EIP1193Provider) {
  _provider = p;
}

export function clearOpenfortEIP1193Provider() {
  _provider = null;
}

export const openfortConnector = createConnector((config) => ({
  id: "openfort-embedded",
  name: "Openfort",
  type: "openfort-embedded" as const,
  icon: "https://openfort.io/favicon.ico",

  async connect(_params?: any) {
    if (!_provider) throw new Error("Openfort provider not initialized");
    const accounts = (await _provider.request({
      method: "eth_accounts",
    })) as readonly `0x${string}`[];
    const chainIdHex = (await _provider.request({
      method: "eth_chainId",
    })) as string;
    return {
      accounts,
      chainId: parseInt(chainIdHex, 16),
    };
  },

  async disconnect() {
    _provider = null;
    config.emitter.emit("disconnect");
  },

  async getAccounts() {
    if (!_provider) return [] as readonly `0x${string}`[];
    return _provider.request({ method: "eth_accounts" }) as Promise<readonly `0x${string}`[]>;
  },

  async getChainId() {
    if (!_provider) return config.chains[0]?.id ?? 137;
    const hex = (await _provider.request({ method: "eth_chainId" })) as string;
    return parseInt(hex, 16);
  },

  async getProvider() {
    return _provider ?? undefined;
  },

  async isAuthorized() {
    return false;
  },

  onAccountsChanged(accounts) {
    config.emitter.emit("change", { accounts: accounts as `0x${string}`[] });
  },
  onChainChanged(chainId) {
    config.emitter.emit("change", { chainId: parseInt(chainId, 16) });
  },
  onDisconnect() {
    config.emitter.emit("disconnect");
  },
}));
