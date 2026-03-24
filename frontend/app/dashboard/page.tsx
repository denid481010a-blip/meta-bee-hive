"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useStats } from "@/hooks/useStats";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ReferralLink } from "@/components/dashboard/ReferralLink";
import { AutoBuyToggle } from "@/components/dashboard/AutoBuyToggle";
import { PendingBalance } from "@/components/dashboard/PendingBalance";
import { HiveCard } from "@/components/hive/HiveCard";
import { BuyLevelModal } from "@/components/levels/BuyLevelModal";
import { TitleBadge } from "@/components/achievements/TitleBadge";
import { shortAddress } from "@/lib/formatters";
import { Loader2 } from "lucide-react";
import { useRegister } from "@/hooks/useRegister";
import { CONTRACT_ADDRESS } from "@/lib/constants";

function RegisterBlock({ onSuccess }: { onSuccess: () => void }) {
  const { register, isPending, isSuccess } = useRegister();

  if (isSuccess) {
    onSuccess();
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center space-y-6">
      <div className="text-5xl">🐣</div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Ты ещё не в рое</h2>
        <p className="text-white/50 text-sm max-w-xs">
          Нажми кнопку ниже чтобы вступить в рой
        </p>
      </div>
      <button
        onClick={() => register(CONTRACT_ADDRESS)}
        disabled={isPending}
        className="px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
        style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623" }}
      >
        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Регистрация...</> : "🐝 Вступить в рой"}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { address } = useAccount();
  const { stats, isLoading, refetch } = useStats(address);
  const [buyLevel, setBuyLevel] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!stats?.isRegistered) {
    return <RegisterBlock onSuccess={refetch} />;
  }

  const activeLevels = stats?.activeLevels ?? 0;
  const teamSize     = Number(stats?.teamSize ?? 0);
  const cycles       = Number(stats?.totalCycles ?? 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Мой улей 🐝</h1>
          <p className="text-white/40 text-sm font-mono">{address && shortAddress(address)}</p>
        </div>
        <TitleBadge activeLevels={activeLevels} teamSize={teamSize} cycles={cycles} />
      </div>

      {/* Stats */}
      <StatsCards
        totalEarned={stats.totalEarned}
        totalSpent={stats.totalSpent}
        activeLevels={stats.activeLevels}
        pending={stats.pending}
      />

      {/* Quick actions row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <ReferralLink address={address ?? ""} />
        </div>
        <PendingBalance pending={stats.pending} onWithdrawn={refetch} />
      </div>

      {/* Auto-buy */}
      <AutoBuyToggle enabled={stats.autoBuy} onToggled={refetch} />

      {/* Hive grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Мои ульи</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
            const isActive = (stats?.activeLevelsList ?? []).includes(level);
            const nextLevel = (stats?.activeLevels ?? 0) + 1;
            const isNext = level === nextLevel;
            return (
              <HiveCard
                key={level}
                level={level}
                active={isActive}
                isNext={isNext}
                address={address}
                onClick={isNext ? () => setBuyLevel(level) : undefined}
                compact
              />
            );
          })}
        </div>
      </div>

      <BuyLevelModal
        level={buyLevel}
        address={address}
        onClose={() => setBuyLevel(null)}
        onSuccess={() => { setBuyLevel(null); refetch(); }}
      />
    </div>
  );
}
