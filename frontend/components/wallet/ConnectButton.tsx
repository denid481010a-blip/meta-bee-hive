"use client";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { Wallet, ChevronDown, LogOut, AlertTriangle, X, KeyRound } from "lucide-react";
import { shortAddress } from "@/lib/formatters";
import { CHAIN_ID } from "@/lib/constants";
import { clsx } from "clsx";

const SITE = "metabeehive.com";

const WALLETS = [
  {
    id:   "metaMask",
    icon: "🦊",
    name: "MetaMask",
    url:  `https://metamask.app.link/dapp/${SITE}`,
  },
  {
    id:   "trust",
    icon: "🛡️",
    name: "Trust Wallet",
    url:  `https://link.trustwallet.com/open_url?coin_id=966&url=https://${SITE}`,
  },
];

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
  const { ready, login, logout, authenticated, exportWallet } = usePrivy();
  const [open, setOpen]           = useState(false);
  const [modal, setModal]         = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [isTelegram, setIsTelegram]   = useState(false);

  useEffect(() => {
    setHasInjected(!!(window as any).ethereum);
    setIsTelegram(!!(window as any).Telegram?.WebApp);
  }, []);

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;

  const btnStyle = {
    background: "linear-gradient(135deg, #F5A623, #FF8C00)",
    color: "#000",
    boxShadow: "0 0 20px rgba(245,166,35,0.3)",
  };

  if (!isConnected) {
    // Telegram WebApp — use Privy (embedded wallet / Telegram auth)
    if (isTelegram) {
      return (
        <button
          onClick={() => login()}
          disabled={!ready}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={btnStyle}
        >
          <Wallet className="w-4 h-4" />
          Connect
        </button>
      );
    }

    // If wallet detected — connect immediately on click, no modal
    if (hasInjected) {
      return (
        <button
          onClick={() => connect({ connector: injected() })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={btnStyle}
        >
          <Wallet className="w-4 h-4" />
          Connect
        </button>
      );
    }

    // No wallet — show deep links modal
    return (
      <>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={btnStyle}
        >
          <Wallet className="w-4 h-4" />
          Connect
        </button>

        {modal && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
            <div
              className="fixed z-50 left-1/2 -translate-x-1/2 bottom-6 w-[calc(100%-2rem)] max-w-sm rounded-3xl p-5 space-y-3"
              style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-bold text-sm">Connect Wallet</p>
                <button onClick={() => setModal(false)} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {WALLETS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => openDeepLink(w.url)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="text-2xl">{w.icon}</span>
                  <span className="text-white font-semibold text-sm">{w.name}</span>
                </button>
              ))}

              <p className="text-white/20 text-xs text-center pt-1">Polygon · DAI</p>
            </div>
          </>
        )}
      </>
    );
  }

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
        <ChevronDown className={clsx("w-3.5 h-3.5 text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-11 z-20 w-44 rounded-xl overflow-hidden"
            style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {authenticated && (
              <button
                onClick={() => { exportWallet(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all border-b border-white/5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Ключ импорта в другой кошелёк
              </button>
            )}
            <button
              onClick={() => { disconnect(); if (authenticated) logout(); setOpen(false); }}
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
