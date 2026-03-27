"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useConnect, useDisconnect } from "wagmi";
import { RecoveryMethod } from "@openfort/openfort-js";
import toast from "react-hot-toast";
import { openfortConnector, setOpenfortEIP1193Provider, clearOpenfortEIP1193Provider } from "@/lib/openfortConnector";
import { getOpenfort } from "@/lib/openfort";

interface OpenfortCtx {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithTelegram: () => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, otp: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  otpSent: boolean;
  resetOtp: () => void;
}

const Ctx = createContext<OpenfortCtx | null>(null);

// Use testnet (80002) with test API key, mainnet (137) requires production key
const POLYGON_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "80002");

// Recovery password — одинаковый для всех guest-аккаунтов в рамках этого приложения
const RECOVERY_PASSWORD =
  process.env.NEXT_PUBLIC_SHIELD_ENCRYPTION_SHARE ?? "metabee-recovery-2025";


function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} (${ms / 1000}s)`)), ms)
    ),
  ]);
}

async function setupWallet(finishAuth: () => Promise<void>) {
  const openfort = getOpenfort();

  // Wait for Openfort iframe to load (15s timeout)
  await withTimeout(openfort.waitForInitialization(), 15_000, "SDK initialization");

  // Always use PASSWORD recovery — ensures same user always gets same wallet
  await withTimeout(
    openfort.embeddedWallet.configure({
      chainId: POLYGON_CHAIN_ID,
      recoveryParams: { recoveryMethod: RecoveryMethod.PASSWORD, password: RECOVERY_PASSWORD },
    }),
    20_000, "configure (password)"
  );

  const policyId = process.env.NEXT_PUBLIC_OPENFORT_POLICY_ID;
  const provider = await withTimeout(
    openfort.embeddedWallet.getEthereumProvider(
      policyId ? { feeSponsorship: policyId } : undefined
    ),
    15_000, "getEthereumProvider"
  );

  setOpenfortEIP1193Provider(provider as any);
  await finishAuth();
}

export function OpenfortProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const finishAuth = useCallback(async () => {
    connect({ connector: openfortConnector });
    setIsAuthenticated(true);
  }, [connect]);

  /** Авторизация в Telegram Mini App */
  const loginWithTelegram = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const openfort = getOpenfort();
      await openfort.waitForInitialization();

      // Проверяем существующую сессию
      const existingToken = await openfort.getAccessToken();

      if (!existingToken) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initData) {
          // Верифицируем через backend и получаем Openfort token
          const res = await fetch("/api/auth/openfort", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: tg.initData }),
          });
          if (res.ok) {
            const { token, userId } = await res.json();
            if (token && userId) {
              await openfort.auth.storeCredentials({ token, userId });
            } else {
              await openfort.auth.signUpGuest();
            }
          } else {
            await openfort.auth.signUpGuest();
          }
        } else {
          await openfort.auth.signUpGuest();
        }
      }

      await setupWallet(finishAuth);
    } catch (e: any) {
      console.error("Openfort Telegram login error:", e);
      const msg = e?.message ?? "Ошибка входа";
      setError(msg);
      toast.error(msg, { duration: 6000 });
    } finally {
      setIsLoading(false);
    }
  }, [finishAuth]);

  const resetOtp = useCallback(() => {
    setOtpSent(false);
    setError(null);
  }, []);

  /** Отправка OTP на email */
  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const openfort = getOpenfort();
      await openfort.auth.requestEmailOtp({ email });
      setOtpSent(true);
    } catch (e: any) {
      console.error("OTP send error:", e);
      setError(e?.message ?? "Не удалось отправить код");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Подтверждение OTP */
  const verifyEmailOTP = useCallback(
    async (email: string, otp: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const openfort = getOpenfort();
        await openfort.auth.logInWithEmailOtp({ email, otp });
        await setupWallet(finishAuth);
        setOtpSent(false);
      } catch (e: any) {
        console.error("OTP verify error:", e);
        setError(e?.message ?? "Неверный код");
      } finally {
        setIsLoading(false);
      }
    },
    [finishAuth]
  );

  /** Быстрый вход как гость */
  const loginAsGuest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const tid = toast.loading("Создание кошелька...");
    try {
      const openfort = getOpenfort();
      await withTimeout(openfort.waitForInitialization(), 15_000, "SDK initialization");
      // Skip signUpGuest if session already exists
      const existingToken = await openfort.getAccessToken();
      if (!existingToken) {
        await openfort.auth.signUpGuest();
      }
      await setupWallet(finishAuth);
      toast.success("Кошелёк создан!", { id: tid });
    } catch (e: any) {
      console.error("Guest login error:", e);
      const msg = e?.message ?? "Ошибка входа";
      setError(msg);
      toast.error(msg, { id: tid });
    } finally {
      setIsLoading(false);
    }
  }, [finishAuth]);

  /** Выход — не уничтожаем сессию Openfort, только отключаем wagmi.
   *  Это гарантирует что при следующем входе восстановится тот же кошелёк. */
  const logout = useCallback(async () => {
    clearOpenfortEIP1193Provider();
    disconnect();
    setIsAuthenticated(false);
    setOtpSent(false);
    setError(null);
  }, [disconnect]);

  return (
    <Ctx.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        loginWithTelegram,
        loginWithEmail,
        verifyEmailOTP,
        loginAsGuest,
        logout,
        otpSent,
        resetOtp,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useOpenfortContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOpenfortContext must be inside OpenfortProvider");
  return ctx;
}
