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
  logout: () => Promise<void>;
  otpSent: boolean;
}

const Ctx = createContext<OpenfortCtx | null>(null);

export function OpenfortProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  /** После успешной авторизации — получаем провайдер и подключаем wagmi */
  const finishAuth = useCallback(async () => {
    const openfort = getOpenfort();
    const provider = await openfort.embeddedWallet.getEthereumProvider();
    setOpenfortEIP1193Provider(provider as any);
    connect({ connector: openfortConnector });
    setIsAuthenticated(true);
  }, [connect]);

  /** Авторизация через Telegram OAuth */
  const loginWithTelegram = useCallback(async () => {
    setIsLoading(true);
    try {
      const openfort = getOpenfort();
      const tg = (window as any).Telegram?.WebApp;

      if (tg && tg.initData) {
        // Telegram Mini App — верифицируем initData через backend
        const res = await fetch("/api/auth/openfort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData }),
        });
        if (!res.ok) throw new Error("Auth failed");
        const { token } = await res.json();
        await openfort.authenticateWithCustomToken({
          token,
          authProvider: "CUSTOM",
        });
      } else {
        // Browser — Telegram OAuth flow
        await openfort.authenticateWithOAuth({
          provider: "TELEGRAM" as any,
          options: {
            redirectTo: window.location.origin,
          },
        });
      }

      await finishAuth();
    } catch (e) {
      console.error("Openfort login error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [finishAuth]);

  /** Авторизация по email с OTP */
  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const openfort = getOpenfort();
      await openfort.logInWithEmailOTP({ email });
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
        await openfort.verifyEmailOTP({ email, otp });
        await finishAuth();
        setOtpSent(false);
      } catch (e) {
        console.error("OTP verify error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [finishAuth]
  );

  /** Выход */
  const logout = useCallback(async () => {
    try {
      const openfort = getOpenfort();
      await openfort.logout();
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
