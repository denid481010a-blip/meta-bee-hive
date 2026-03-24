"use client";
import { useAccount } from "wagmi";
import { useStats } from "@/hooks/useStats";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { TitleBadge } from "@/components/achievements/TitleBadge";
import { ACHIEVEMENTS } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";
import { formatUnits } from "viem";

export default function AchievementsPage() {
  const { address } = useAccount();
  const { stats, isLoading } = useStats(address);
  const { t } = useT();

  const activeLevels  = stats?.activeLevels  ?? 0;
  const teamSize      = Number(stats?.teamSize   ?? 0);
  const cycles        = Number(stats?.totalCycles ?? 0);
  const totalEarned   = stats?.totalEarned ?? 0n;
  const earnedDai     = Number(formatUnits(totalEarned, 18));

  const getProgress = (id: string): { unlocked: boolean; progress?: number } => {
    switch (id) {
      case "first_hive":  return { unlocked: activeLevels >= 1 };
      case "first_ref":   return { unlocked: teamSize >= 1 };
      case "first_cycle": return { unlocked: cycles >= 1 };
      case "hive5":       return { unlocked: activeLevels >= 5,   progress: Math.min(100, (activeLevels / 5)   * 100) };
      case "hive10":      return { unlocked: activeLevels >= 10,  progress: Math.min(100, (activeLevels / 10)  * 100) };
      case "team10":      return { unlocked: teamSize >= 10,      progress: Math.min(100, (teamSize / 10)      * 100) };
      case "team100":     return { unlocked: teamSize >= 100,     progress: Math.min(100, (teamSize / 100)     * 100) };
      case "earned100":   return { unlocked: earnedDai >= 100,    progress: Math.min(100, (earnedDai / 100)    * 100) };
      case "earned1000":  return { unlocked: earnedDai >= 1000,   progress: Math.min(100, (earnedDai / 1000)   * 100) };
      case "cycles10":    return { unlocked: cycles >= 10,        progress: Math.min(100, (cycles / 10)        * 100) };
      default:            return { unlocked: false };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  const unlockedCount = ACHIEVEMENTS.filter((a) => getProgress(a.id).unlocked).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.achievements.title}</h1>
          <p className="text-white/40 text-sm mt-1">
            {t.achievements.openedOf} {unlockedCount} {t.levels.of} {ACHIEVEMENTS.length}
          </p>
        </div>
        <TitleBadge activeLevels={activeLevels} teamSize={teamSize} cycles={cycles} />
      </div>

      <div className="bg-navy rounded-2xl p-4 border border-white/10">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">{t.achievements.progress}</span>
          <span className="text-gold font-bold">{unlockedCount}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`, background: "linear-gradient(90deg, #F5A623, #FFC857)" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="bg-navy rounded-xl p-3 border border-white/10">
          <p className="text-2xl font-bold text-gold">{activeLevels}</p>
          <p className="text-white/40 text-xs">{t.achievements.activeLevels}</p>
        </div>
        <div className="bg-navy rounded-xl p-3 border border-white/10">
          <p className="text-2xl font-bold text-bee-green">{teamSize}</p>
          <p className="text-white/40 text-xs">{t.achievements.inTeam}</p>
        </div>
        <div className="bg-navy rounded-xl p-3 border border-white/10">
          <p className="text-2xl font-bold text-white">{cycles}</p>
          <p className="text-white/40 text-xs">{t.achievements.cyclesCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((a) => {
          const { unlocked, progress } = getProgress(a.id);
          return (
            <AchievementCard key={a.id} id={a.id} icon={a.icon} label={a.label} desc={a.desc} unlocked={unlocked} progress={progress} />
          );
        })}
      </div>
    </div>
  );
}
