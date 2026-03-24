"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { MatrixView } from "@/components/matrix/MatrixView";
import { useStats } from "@/hooks/useStats";
import { LEVEL_COLORS, ACHIEVEMENTS } from "@/lib/constants";
import { clsx } from "clsx";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { TitleBadge } from "@/components/achievements/TitleBadge";
import { useT } from "@/lib/i18n/LanguageContext";
import { formatUnits } from "viem";

export default function MatrixPage() {
  const { address } = useAccount();
  const { stats } = useStats(address);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const { t } = useT();
  const activeLevels: number[] = stats?.activeLevelsList ?? [];
  const teamSize    = Number(stats?.teamSize   ?? 0);
  const cycles      = Number(stats?.totalCycles ?? 0);
  const earnedDai   = Number(formatUnits(stats?.totalEarned ?? 0n, 18));

  const getProgress = (id: string): { unlocked: boolean; progress?: number } => {
    const lvl = activeLevels.length;
    switch (id) {
      case "first_hive":  return { unlocked: lvl >= 1 };
      case "first_ref":   return { unlocked: teamSize >= 1 };
      case "first_cycle": return { unlocked: cycles >= 1 };
      case "hive5":       return { unlocked: lvl >= 5,        progress: Math.min(100, (lvl / 5)          * 100) };
      case "hive10":      return { unlocked: lvl >= 10,       progress: Math.min(100, (lvl / 10)         * 100) };
      case "team10":      return { unlocked: teamSize >= 10,  progress: Math.min(100, (teamSize / 10)    * 100) };
      case "team100":     return { unlocked: teamSize >= 100, progress: Math.min(100, (teamSize / 100)   * 100) };
      case "earned100":   return { unlocked: earnedDai >= 100,  progress: Math.min(100, (earnedDai / 100)  * 100) };
      case "earned1000":  return { unlocked: earnedDai >= 1000, progress: Math.min(100, (earnedDai / 1000) * 100) };
      case "cycles10":    return { unlocked: cycles >= 10,   progress: Math.min(100, (cycles / 10)       * 100) };
      default:            return { unlocked: false };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.nav.matrix}</h1>
          <p className="text-white/40 text-sm mt-1">Состояние слотов по каждому уровню</p>
        </div>
        <TitleBadge activeLevels={activeLevels.length} teamSize={teamSize} cycles={cycles} />
      </div>

      {/* Level selector */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
          const color  = LEVEL_COLORS[level] ?? "#F5A623";
          const active = activeLevels.includes(level);
          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={clsx(
                "w-12 h-12 rounded-xl font-bold text-sm border-2 transition-all",
                selectedLevel === level
                  ? "scale-110 shadow-lg"
                  : "opacity-60 hover:opacity-100",
                active ? "bg-opacity-20" : "bg-white/5"
              )}
              style={{
                borderColor: selectedLevel === level ? color : "rgba(255,255,255,0.1)",
                color: active ? color : "rgba(255,255,255,0.3)",
                backgroundColor: selectedLevel === level ? color + "22" : undefined,
              }}
            >
              H{level}
            </button>
          );
        })}
      </div>

      {/* Matrix display */}
      {address && (
        <MatrixView
          level={selectedLevel}
          address={address}
        />
      )}

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">{t.achievements.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((a) => {
            const { unlocked, progress } = getProgress(a.id);
            return (
              <AchievementCard key={a.id} id={a.id} icon={a.icon} label={a.label} desc={a.desc} unlocked={unlocked} progress={progress} />
            );
          })}
        </div>
      </div>

    </div>
  );
}
