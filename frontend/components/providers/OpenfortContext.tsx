"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useConnect, useDisconnect } from "wagmi";
import { openfortConnector, setOpenfortEIP1193Provider, clearOpenfortEIP1193Provider } from "@/lib/openfortConnector";
import { getOpenfort } from "@/lib/openfort";

interface OpenfortCtx {
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithTelegram: () => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, otp: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  otpSent: boolean;
}

const Ctx = createContext<OpenfortCtx | null>(null);

const POLYGON_CHAIN_ID = 137;

async function setupWallet(finishAuth: () => Promise<void>) {
  const openfort = getOpenfort();

  // Конфигурируем embedded wallet на Polygon
  await openfort.embeddedWallet.configure({ chainId: POLYGON_CHAIN_ID });

  // Получаем EIP-1193 провайдер (с gas sponsorship policy если указан)
  const policyId = process.env.NEXT_PUBLIC_OPENFORT_POLICY_ID;
  const provider = await openfort.embeddedWallet.getEthereumProvider(
    policyId ? { feeSponsorship: policyId } : undefined
  );

  setOpenfortEIP1193Provider(provider as any);
  await finishAuth();
}

export function OpenfortProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const finishAuth = useCallback(async () => {
    connect({ connector: openfortConnector });
    setIsAuthenticated(true);
  }, [connect]);

  /** Авторизация в Telegram Mini App */
  const loginWithTelegram = useCallback(async () => {
    setIsLoading(true);
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
            await openfort.auth.storeCredentials({ token, userId });
          } else {
            // Fallback: guest wallet
            await openfort.auth.signUpGuest();
          }
        } else {
          await openfort.auth.signUpGuest();
        }
      }

      await setupWallet(finishAuth);
    } catch (e) {
      console.error("Openfort Telegram login error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [finishAuth]);

  /** Отправка OTP на email */
  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const openfort = getOpenfort();
      await openfort.auth.requestEmailOtp({ email });
      setOtpSent(true);
    } catch (e) {
      console.error("OTP send error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Подтверждение OTP */
  const verifyEmailOTP = useCallback(
    async (email: string, otp: string) => {
      setIsLoading(true);
      try {
        const openfort = getOpenfort();
        await openfort.auth.logInWithEmailOtp({ email, otp });
        await setupWallet(finishAuth);
        setOtpSent(false);
      } catch (e) {
        console.error("OTP verify error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [finishAuth]
  );

  /** Быстрый вход как гость (для тестов) */
  const loginAsGuest = useCallback(async () => {
    setIsLoading(true);
    try {
      const openfort = getOpenfort();
      await openfort.auth.signUpGuest();
      await setupWallet(finishAuth);
    } catch (e) {
      console.error("Guest login error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [finishAuth]);

  /** Выход */
  const logout = useCallback(async () => {
    try {
      const openfort = getOpenfort();
      await openfort.auth.logout();
    } catch (_) {}
    clearOpenfortEIP1193Provider();
    disconnect();
    setIsAuthenticated(false);
    setOtpSent(false);
  }, [disconnect]);

  return (
    <Ctx.Provider
      value={{
        isAuthenticated,
        isLoading,
        loginWithTelegram,
        loginWithEmail,
        verifyEmailOTP,
        loginAsGuest,
        logout,
        otpSent,
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
