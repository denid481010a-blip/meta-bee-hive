"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  PrivyProvider,
  usePrivy,
  useWallets,
  useLoginWithTelegram,
} from "@privy-io/react-auth";
import { SmartWalletsProvider, useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { polygon, polygonAmoy } from "viem/chains";
import toast from "react-hot-toast";

// ── Context interface ──────────────────────────────────────────────────────

interface PrivyAuthCtx {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  address: string | undefined;
  loginWithTelegram: () => Promise<void>;
  logout: () => Promise<void>;
  sendTransaction: (to: string, data: string, value?: bigint) => Promise<string>;
  exportWallet: () => Promise<void>;
}

const Ctx = createContext<PrivyAuthCtx | null>(null);

// ── Inner provider — has access to Privy + SmartWallet hooks ───────────────

function PrivyAuthInner({ children }: { children: ReactNode }) {
  const { ready, authenticated, exportWallet: privyExportWallet, logout: privyLogout, login } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();
  const { login: loginTelegram, state: telegramState } = useLoginWithTelegram({
    onComplete: () => {},
    onError: (error) => {
      console.error("Telegram login error:", error);
      const msg = typeof error === "string" ? error : (error as any)?.message ?? "Ошибка входа";
      setError(msg);
      toast.error(msg, { duration: 6000 });
    },
  });

  const [error, setError] = useState<string | null>(null);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  // Prefer smart wallet address (gas-sponsored), fallback to embedded wallet
  const address = (smartWalletClient?.account as any)?.address ?? embeddedWallet?.address;

  const loginWithTelegram = useCallback(async () => {
    setError(null);
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initData) {
        await loginTelegram();
      } else {
        login();
      }
    } catch (e: any) {
      console.error("Privy Telegram login error:", e);
      const msg = e?.message ?? "Ошибка входа";
      setError(msg);
      toast.error(msg, { duration: 6000 });
    }
  }, [loginTelegram, login]);

  const logout = useCallback(async () => {
    try {
      await privyLogout();
    } catch (e: any) {
      console.error("Privy logout error:", e);
    }
    setError(null);
  }, [privyLogout]);

  const sendTransaction = useCallback(
    async (to: string, data: string, value: bigint = 0n): Promise<string> => {
      // Prefer smart wallet (gas-sponsored via ERC-4337)
      if (smartWalletClient) {
        const hash = await smartWalletClient.sendTransaction({
          to: to as `0x${string}`,
          data: data as `0x${string}`,
          value,
        });
        return hash as string;
      }
      // Fallback: embedded wallet (requires MATIC for gas)
      if (!embeddedWallet) {
        throw new Error("Wallet not initialized. Please login first.");
      }
      const provider = await embeddedWallet.getEthereumProvider();
      const hash = await provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: embeddedWallet.address,
          to,
          data,
          value: value === 0n ? "0x0" : `0x${value.toString(16)}`,
        }],
      });
      return hash as string;
    },
    [smartWalletClient, embeddedWallet],
  );

  const exportWallet = useCallback(async () => {
    try {
      if (embeddedWallet?.address) {
        await privyExportWallet({ address: embeddedWallet.address });
      } else {
        await (privyExportWallet as () => Promise<void>)();
      }
    } catch (e: any) {
      console.error("Export wallet error:", e);
      toast.error(e?.message ?? "Не удалось экспортировать кошелёк");
    }
  }, [privyExportWallet, embeddedWallet?.address]);

  const isLoading = !ready || telegramState.status === "loading";

  return (
    <Ctx.Provider
      value={{
        isAuthenticated: authenticated,
        isLoading,
        error,
        address,
        loginWithTelegram,
        logout,
        sendTransaction,
        exportWallet,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// ── Public provider component ──────────────────────────────────────────────

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#F5A623",
        },
        loginMethods: ["telegram"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          showWalletUIs: false,
        },
        defaultChain: polygonAmoy,
        supportedChains: [polygon, polygonAmoy],
      }}
    >
      <SmartWalletsProvider>
        <PrivyAuthInner>{children}</PrivyAuthInner>
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}

// ── Public hook ────────────────────────────────────────────────────────────

export function usePrivyAuth(): PrivyAuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrivyAuth must be used inside PrivyAuthProvider");
  return ctx;
}
