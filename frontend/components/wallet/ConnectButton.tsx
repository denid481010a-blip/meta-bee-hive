"use client";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ChevronDown,
  LogOut,
  AlertTriangle,
  Loader2,
  KeyRound,
} from "lucide-react";

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
    </svg>
  );
}

import { shortAddress } from "@/lib/formatters";
import { CHAIN_ID } from "@/lib/constants";
import { clsx } from "clsx";
import { usePrivyAuth } from "@/components/providers/PrivyContext";

const SITE = "metabeehive.com";

function openDeepLink(url: string) {
  const tg = (window as any).Telegram?.WebApp;
  if (tg) tg.openLink(url);
  else window.open(url, "_blank");
}

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect }     = useConnect();
  const { disconnect }  = useDisconnect();
  const { switchChain } = useSwitchChain();
  const {
    isAuthenticated,
    loginWithTelegram,
    logout: privyLogout,
    exportWallet,
  } = usePrivyAuth();
  const router = useRouter();

  const [open, setOpen]             = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [isTelegram, setIsTelegram]   = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleDisconnect = useCallback(() => {
    privyLogout();
    disconnect();
    setOpen(false);
    router.push("/");
  }, [privyLogout, disconnect, router]);

  useEffect(() => {
    setHasInjected(!!(window as any).ethereum);
    setIsTelegram(!!(window as any).Telegram?.WebApp);
  }, []);

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;

  // ── Not connected — show 3 login options inline ──────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">

        {/* 1. Telegram via Privy */}
        <button
          onClick={async () => {
            setIsLoggingIn(true);
            try { await loginWithTelegram(); } finally { setIsLoggingIn(false); }
          }}
          disabled={isLoggingIn}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{
            background: "#2AABEE",
            color: "#fff",
            boxShadow: "0 0 24px rgba(42,171,238,0.35)",
          }}
        >
          {isLoggingIn ? (
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          ) : (
            <span className="flex-shrink-0"><TelegramIcon /></span>
          )}
          <span>Войти через Telegram</span>
        </button>

        {/* 2. MetaMask / Browser wallet */}
        <button
          onClick={() => {
            if (hasInjected) {
              connect({ connector: injected() });
            } else {
              openDeepLink(`https://metamask.app.link/dapp/${SITE}`);
            }
          }}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        >
          <span className="text-xl flex-shrink-0">🦊</span>
          <span>MetaMask</span>
        </button>

        {/* 3. Trust Wallet */}
        <button
          onClick={() =>
            openDeepLink(
              `https://link.trustwallet.com/open_url?coin_id=966&url=https://${SITE}`
            )
          }
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        >
          <span className="text-xl flex-shrink-0">🛡️</span>
          <span>Trust Wallet</span>
        </button>

      </div>
    );
  }

  // ── Wrong network ────────────────────────────────────────────────────────
  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/10 border border-white/20 text-white transition-all hover:bg-white/15"
      >
        <AlertTriangle className="w-4 h-4" />
        Switch Network
      </button>
    );
  }

  // ── Connected ────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.85)",
        }}
      >
        <div className="w-5 h-5 rounded-full bg-gold/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gold" />
        </div>
        <span className="font-mono text-xs">{shortAddress(address!)}</span>
        <ChevronDown
          className={clsx(
            "w-3.5 h-3.5 text-white/40 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-11 z-20 w-52 rounded-xl overflow-hidden"
            style={{
              background: "#10101e",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {isAuthenticated && (
              <button
                onClick={() => { setOpen(false); exportWallet(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all border-b border-white/5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Скопировать секретный ключ кошелька для импорта
              </button>
            )}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
