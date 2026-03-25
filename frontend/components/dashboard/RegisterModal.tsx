"use client";
import { Loader2, X } from "lucide-react";
import { useRegister } from "@/hooks/useRegister";
import { useT } from "@/lib/i18n/LanguageContext";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { useEffect } from "react";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterModal({ open, onClose, onSuccess }: RegisterModalProps) {
  const { register, isPending, isSuccess } = useRegister();
  const { t } = useT();

  const savedRef = typeof window !== "undefined"
    ? (localStorage.getItem("bee_ref") as `0x${string}` | null)
    : null;

  const referrer: `0x${string}` = savedRef ?? CONTRACT_ADDRESS;

  useEffect(() => {
    if (isSuccess) {
      if (typeof window !== "undefined") localStorage.removeItem("bee_ref");
      onSuccess();
    }
  }, [isSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl p-6 space-y-5 flex flex-col items-center text-center"
        style={{ background: "#10101e", border: "1px solid rgba(245,166,35,0.25)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-5xl">👑🐝</div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">{t.dashboard.notInSwarm}</h2>
          <p className="text-white/50 text-sm">{t.dashboard.joinDesc}</p>
        </div>

        {savedRef && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm"
            style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)" }}>
            <span className="text-white/50">{t.ref.invitedBy}</span>
            <span className="text-gold font-mono font-bold">
              {savedRef.slice(0, 6)}...{savedRef.slice(-4)}
            </span>
          </div>
        )}

        <button
          onClick={() => register(referrer)}
          disabled={isPending}
          className="w-full px-8 py-3 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #F5A623, #FF8C00)", color: "#000" }}
        >
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.dashboard.registering}</>
            : <span className="flex flex-col items-center leading-tight">
                <span>{t.dashboard.join}</span>
                <span className="text-xs font-medium opacity-60">({t.dashboard.joinSub})</span>
              </span>
          }
        </button>
      </div>
    </div>
  );
}
