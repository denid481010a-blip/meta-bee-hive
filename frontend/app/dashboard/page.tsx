"use client";
import { useAccount } from "wagmi";
import { useStats } from "@/hooks/useStats";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ReferralLink } from "@/components/dashboard/ReferralLink";
import { AutoBuyToggle } from "@/components/dashboard/AutoBuyToggle";
import { PendingBalance } from "@/components/dashboard/PendingBalance";
import { TitleBadge } from "@/components/achievements/TitleBadge";
import { shortAddress } from "@/lib/formatters";
import { Loader2, HelpCircle } from "lucide-react";
import { useRegister } from "@/hooks/useRegister";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { useT } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import Link from "next/link";
import { useEffect, useState } from "react";


function RegisterBlock({ onSuccess }: { onSuccess: () => void }) {
  const { register, isPending, isSuccess, error } = useRegister();
  const { t } = useT();

  const savedRef = typeof window !== "undefined"
    ? (localStorage.getItem("bee_ref") as `0x${string}` | null)
    : null;

  useEffect(() => {
    if (isSuccess) {
      if (typeof window !== "undefined") localStorage.removeItem("bee_ref");
      onSuccess();
    }
  }, [isSuccess]);

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-10">
        <div className="text-5xl">🐝</div>
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
        <p className="text-white/60 text-sm">{t.dashboard.registering}…</p>
      </div>
    );
  }

  const referrer: `0x${string}` = savedRef ?? CONTRACT_ADDRESS;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-10">
      <div className="text-5xl">🐣</div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">{t.dashboard.notInSwarm}</h2>
        <p className="text-white/50 text-sm max-w-xs">{t.dashboard.joinDesc}</p>
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

      {error && error !== "cancelled" && (
        <div className="px-4 py-2 rounded-2xl text-xs max-w-xs break-words"
          style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", color: "#ff6060" }}>
          {error}
        </div>
      )}

      <button
        onClick={() => register(referrer)}
        disabled={isPending}
        className="px-8 py-3 rounded-2xl font-black text-lg flex items-center gap-2"
        style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: "#ffffff" }}
      >
        {isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.dashboard.registering}</>
          : <span className="flex flex-col items-center leading-tight">
              <span>{t.dashboard.join}</span>
              <span className="text-xs font-medium opacity-60">({t.dashboard.joinSub})</span>
            </span>
        }
      </button>
      <div className="space-y-2">
        <p className="text-white/30 text-xs">{t.language.subtitle}</p>
        <LanguageSwitcher />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address } = useAccount();
  const { stats, isLoading, refetch } = useStats(address);
  const { t } = useT();
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!polling) return;
    if (stats?.isRegistered) { setPolling(false); return; }
    const id = setInterval(() => refetch(), 2000);
    return () => clearInterval(id);
  }, [polling, stats?.isRegistered, refetch]);

  function handleRegisterSuccess() {
    setPolling(true);
    refetch();
  }

  if (isLoading || polling || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!stats.isRegistered) {
    return <RegisterBlock onSuccess={handleRegisterSuccess} />;
  }

  const activeLevels = stats.activeLevels ?? 0;
  const teamSize     = Number(stats.totalRefs ?? 0);
  const cycles       = Number(stats.totalCycles ?? 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.dashboard.title}</h1>
          <p className="text-white/40 text-sm font-mono">{address && shortAddress(address)}</p>
        </div>
        <TitleBadge activeLevels={activeLevels} teamSize={teamSize} cycles={cycles} />
      </div>

      {/* Stats */}
      <StatsCards
        totalEarned={stats.totalEarned}
        totalSpent={stats.totalSpent}
        activeLevels={stats.activeLevels}
        address={address}
      />

      {/* Quick actions row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          {/* Купить DAI */}
          <button
            onClick={() => {
              const url = `https://app.uniswap.org/swap?outputCurrency=0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063&chain=polygon`;
              const tg = (window as any).Telegram?.WebApp;
              if (tg) {
                tg.openLink(url);
              } else {
                const a = document.createElement("a");
                a.href = url;
                a.target = "_blank";
                a.rel = "noreferrer";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            }}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all hover:opacity-80"
            style={{ background: "rgba(41,182,246,0.08)", border: "1px solid rgba(41,182,246,0.2)" }}
          >
            <span className="text-2xl">💱</span>
            <div className="text-left">
              <p className="text-white text-sm font-bold">Купить DAI</p>
              <p className="text-white/40 text-xs">Uniswap → DAI на Polygon</p>
            </div>
          </button>
          <ReferralLink address={address ?? ""} />
          <LanguageSwitcher />
        </div>
        <PendingBalance pending={stats.pending} onWithdrawn={refetch} />
      </div>

      {/* Auto-buy */}
      <AutoBuyToggle enabled={stats.autoBuy} onToggled={refetch} />

      {/* How it works + Telegram */}
      <div className="flex items-stretch gap-2 w-full">
        <Link href="/dashboard/how-it-works"
          className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all hover:opacity-80 flex-1"
          style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
          <HelpCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#F5A623" }} />
          <div className="text-left">
            <p className="text-white text-sm font-bold">{t.howItWorks.btnTitle}</p>
            <p className="text-white/40 text-xs">{t.howItWorks.btnSub}</p>
          </div>
        </Link>

        <button
          className="flex items-center justify-center rounded-2xl flex-shrink-0 transition-all hover:opacity-80"
          style={{ width: 50, background: "rgba(41,182,246,0.08)", border: "1px solid rgba(41,182,246,0.2)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.93 6.836l-1.696 7.986c-.127.567-.46.705-.932.438l-2.578-1.9-1.243 1.196c-.138.138-.253.253-.519.253l.185-2.629 4.782-4.321c.208-.184-.045-.287-.322-.103L8.24 14.6l-2.53-.79c-.55-.172-.56-.55.114-.815l9.64-3.716c.457-.166.857.111.466.557z" fill="#29B6F6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
