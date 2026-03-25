"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { HiveCard } from "@/components/hive/HiveCard";
import { BuyLevelModal } from "@/components/levels/BuyLevelModal";
import { useStats } from "@/hooks/useStats";
import { useT } from "@/lib/i18n/LanguageContext";
import { clearLogsCache } from "@/lib/getLogs";

export default function LevelsPage() {
  const { address } = useAccount();
  const { stats, refetch } = useStats(address);
  const { t } = useT();
  const [buyLevel, setBuyLevel] = useState<number | null>(null);

  const activeLevels: number[] = stats?.activeLevelsList ?? [];
  const nextLevel = (stats?.activeLevels ?? 0) + 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{t.levels.title}</h1>
          <p className="text-white/30 text-sm mt-1">{t.levels.activeOf}: {activeLevels.length} {t.levels.of} 10</p>
        </div>
        <div className="hidden sm:flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
            <div
              key={level}
              className="w-6 h-1.5 rounded-full transition-all"
              style={{ background: activeLevels.includes(level) ? "#F5A623" : "rgba(255,255,255,0.08)" }}
            />
          ))}
        </div>
      </div>

      {/* Hive grid — clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level, i) => {
          const isActive = activeLevels.includes(level);
          const isNext = level === nextLevel;
          return (
            <motion.div
              key={level}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <HiveCard
                level={level}
                active={isActive}
                isNext={isNext}
                address={address}
                onClick={isNext ? () => setBuyLevel(level) : undefined}
              />
            </motion.div>
          );
        })}
      </div>

      <BuyLevelModal
        level={buyLevel}
        address={address}
        onClose={() => setBuyLevel(null)}
        onSuccess={() => { setBuyLevel(null); clearLogsCache(address); refetch(); }}
      />
    </div>
  );
}
