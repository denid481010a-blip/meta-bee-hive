"use client";
import { useEffect, type ReactNode } from "react";

const APP_VERSION = "4";

export function TelegramProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    // Force cache-bust: reload with version param if not already on latest
    const url = new URL(window.location.href);
    if (url.searchParams.get("_v") !== APP_VERSION) {
      url.searchParams.set("_v", APP_VERSION);
      window.location.replace(url.toString());
      return;
    }

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
