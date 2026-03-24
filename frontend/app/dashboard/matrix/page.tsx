"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { MatrixView } from "@/components/matrix/MatrixView";
import { useStats } from "@/hooks/useStats";
import { HIVE_PRICES_DAI, LEVEL_COLORS } from "@/lib/constants";
import { clsx } from "clsx";

export default function MatrixPage() {
  const { address } = useAccount();
  const { stats } = useStats(address);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const activeLevels: number[] = stats?.activeLevelsList ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Пчелиный Рой</h1>
        <p className="text-white/40 text-sm mt-1">Состояние слотов по каждому уровню</p>
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

    </div>
  );
}
