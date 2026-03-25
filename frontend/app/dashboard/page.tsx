"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useStats } from "@/hooks/useStats";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ReferralLink } from "@/components/dashboard/ReferralLink";
import { AutoBuyToggle } from "@/components/dashboard/AutoBuyToggle";
import { PendingBalance } from "@/components/dashboard/PendingBalance";
import { TitleBadge } from "@/components/achievements/TitleBadge";
import { RegisterModal } from "@/components/dashboard/RegisterModal";
import { shortAddress } from "@/lib/formatters";
import { Loader2, HelpCircle } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import Link from "next/link";

export default function DashboardPage() {
  const { address } = useAccount();
  const { stats, isLoading, refetch } = useStats(address);
  const { t } = useT();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  const isRegistered = stats?.isRegistered ?? false;
  const activeLevels = stats?.activeLevels ?? 0;
  const teamSize     = Number(stats?.totalRefs ?? 0);
  const cycles       = Number(stats?.totalCycles ?? 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Register modal */}
      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => { setShowRegister(false); refetch(); }}
      />

      {/* Register banner (only if not registered) */}
      {!isRegistered && (
        <div className="flex flex-col items-center justify-center text-center py-10 space-y-5">
          <div className="text-6xl">👑🐝</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">{t.dashboard.notInSwarm}</h2>
            <p className="text-white/50 text-sm">{t.dashboard.joinDesc}</p>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className="px-10 py-4 rounded-2xl font-black text-lg"
            style={{ background: "linear-gradient(135deg, #F5A623, #FF8C00)", color: "#000", boxShadow: "0 0 30px rgba(245,166,35,0.35)" }}
          >
            {t.dashboard.join}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.dashboard.title}</h1>
          <p className="text-white/40 text-sm font-mono">{address && shortAddress(address)}</p>
        </div>
        {isRegistered && <TitleBadge activeLevels={activeLevels} teamSize={teamSize} cycles={cycles} />}
      </div>

      {/* Stats */}
      {isRegistered && stats && (
        <StatsCards
          totalEarned={stats.totalEarned}
          totalSpent={stats.totalSpent}
          activeLevels={stats.activeLevels}
          pending={stats.pending}
        />
      )}

      {/* Quick actions row */}
      {isRegistered && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <ReferralLink address={address ?? ""} />
            <LanguageSwitcher />
          </div>
          <PendingBalance pending={stats.pending} onWithdrawn={refetch} />
        </div>
      )}

      {/* Language switcher for unregistered */}
      {!isRegistered && (
        <div className="space-y-2">
          <p className="text-white/30 text-xs">{t.language.subtitle}</p>
          <LanguageSwitcher />
        </div>
      )}

      {/* Auto-buy */}
      {isRegistered && stats && (
        <AutoBuyToggle enabled={stats.autoBuy} onToggled={refetch} />
      )}

      {/* How it works */}
      <Link href="/dashboard/how-it-works"
        className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all hover:opacity-80"
        style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
        <HelpCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#F5A623" }} />
        <div>
          <p className="text-white text-sm font-bold">{t.howItWorks.btnTitle}</p>
          <p className="text-white/40 text-xs">{t.howItWorks.btnSub}</p>
        </div>
        <span className="ml-auto text-white/20 text-lg">›</span>
      </Link>
    </div>
  );
}
