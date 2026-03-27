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
  useSendTransaction,
} from "@privy-io/react-auth";
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

// ── Inner provider ─────────────────────────────────────────────────────────

function PrivyAuthInner({ children }: { children: ReactNode }) {
  const { ready, authenticated, exportWallet: privyExportWallet, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction: privySendTx } = useSendTransaction();
  const [error, setError] = useState<string | null>(null);

  const { login: loginTg } = useLoginWithTelegram({
    onComplete: () => { setError(null); },
    onError: (err) => {
      const msg = typeof err === "string" ? err : (err as any)?.message ?? "Ошибка входа";
      setError(msg);
      toast.error(msg, { duration: 6000 });
    },
  });

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const address = embeddedWallet?.address;

  const loginWithTelegram = useCallback(async () => {
    setError(null);
    if (!ready) {
      toast.error("Приложение ещё загружается, подождите...");
      return;
    }
    try {
      loginTg();
    } catch (e: any) {
      const msg = e?.message ?? "Ошибка входа";
      setError(msg);
      toast.error(msg, { duration: 6000 });
    }
  }, [ready, loginTg]);

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
      const result = await privySendTx(
        {
          to: to as `0x${string}`,
          data: data as `0x${string}`,
          value,
          chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 80002),
        },
        { sponsor: true }
      );
      return result.hash;
    },
    [privySendTx],
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

  const isLoading = !ready;

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

// ── Public provider ────────────────────────────────────────────────────────

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
      <PrivyAuthInner>{children}</PrivyAuthInner>
    </PrivyProvider>
  );
}

// ── Public hook ────────────────────────────────────────────────────────────

export function usePrivyAuth(): PrivyAuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrivyAuth must be used inside PrivyAuthProvider");
  return ctx;
}
