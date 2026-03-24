"use client";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { hardhat } from "wagmi/chains";
import { useState } from "react";
import { Wallet, ChevronDown, LogOut, AlertTriangle } from "lucide-react";
import { shortAddress } from "@/lib/formatters";
import { CHAIN_ID } from "@/lib/constants";
import { clsx } from "clsx";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors }           = useConnect();
  const { disconnect }                    = useDisconnect();
  const { switchChain }                   = useSwitchChain();
  const [open, setOpen]                   = useState(false);

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        style={{
          background: "linear-gradient(135deg, #F5A623, #FF8C00)",
          color: "#000",
          boxShadow: "0 0 20px rgba(245,166,35,0.3)",
        }}
      >
        <Wallet className="w-4 h-4" />
        Подключить
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/10 border border-white/20 text-white transition-all hover:bg-white/15"
      >
        <AlertTriangle className="w-4 h-4" />
        Сменить сеть
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
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Отключиться
            </button>
          </div>
        </>
      )}
    </div>
  );
}
