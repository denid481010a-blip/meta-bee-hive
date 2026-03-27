"use client";
import { useEffect, type ReactNode } from "react";

const APP_VERSION = "6";
const STORAGE_KEY = "mbh_app_ver";

export function TelegramProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    // Update stored version (no reload — causes init race conditions)
    localStorage.setItem(STORAGE_KEY, APP_VERSION);

    // Tell Telegram the app is ready (hides loading screen)
    tg.ready();

    // Expand to full screen
    tg.expand();

    // Match app background to Telegram theme
    tg.setBackgroundColor("#06060f");
    tg.setHeaderColor("#06060f");

    // Читаем реферальный адрес из start_param (t.me/BOT?startapp=0xADDRESS)
    const startParam: string | undefined = tg.initDataUnsafe?.start_param;
    if (startParam && /^0x[0-9a-fA-F]{40}$/.test(startParam)) {
      localStorage.setItem("bee_ref", startParam);
    }
  }, []);

  return <>{children}</>;
}

/** Returns true if running inside Telegram Mini App */
export function isTelegram(): boolean {
  if (typeof window === "undefined") return false;
  const tg = (window as any).Telegram?.WebApp;
  return !!(tg && tg.platform && tg.platform !== "unknown");
}

/** Returns true if MetaMask extension is actually available */
export function isMetaMaskAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).ethereum?.isMetaMask;
}
