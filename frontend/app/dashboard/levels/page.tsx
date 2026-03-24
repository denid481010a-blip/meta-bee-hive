"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { HiveCard } from "@/components/hive/HiveCard";
import { BuyLevelModal } from "@/components/levels/BuyLevelModal";
import { useStats } from "@/hooks/useStats";
import { useMatrix } from "@/hooks/useMatrix";
import { HIVE_PRICES_DAI, LEVEL_COLORS } from "@/lib/constants";
import { RefreshCw } from "lucide-react";

function LevelRow({
  level, price, active, address, onBuy, delay,
}: {
  level: number; price: number; active: boolean;
  address?: `0x${string}`; onBuy: () => void; delay: number;
}) {
  const color     = LEVEL_COLORS[level] ?? "#F5A623";
  const cycleIncome = +(price * 3 * 0.9).toFixed(2);
  const { matrix } = useMatrix(active ? address : undefined, active ? level : undefined);
  const cycles = matrix?.cycles ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
        className="grid grid-cols-5 px-4 py-3 border-b border-white/[0.04] items-center text-sm"
    >
      <span className="font-black text-sm" style={{ color }}>Hive {level}</span>
      <span className="text-white/70 text-xs font-medium">{price} DAI</span>
      <span className="text-xs font-medium" style={{ color: "#27AE60" }}>+{cycleIncome} DAI</span>
      <span>
        {active && cycles > 0 ? (
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#27AE60" }}>
            <RefreshCw className="w-3 h-3" />{cycles}
          </span>
        ) : (
          <span className="text-white/20 text-xs">—</span>
        )}
      </span>
      <span>
        {active ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
            style={{ background: "rgba(39,174,96,0.12)", color: "#27AE60" }}>
            ✓ Куплен
          </span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)" }}>
            Не активен
          </span>
        )}
      </span>
    </motion.div>
  );
}

export default function LevelsPage() {
  const { address } = useAccount();
  const { stats, refetch } = useStats(address);
  const [buyLevel, setBuyLevel] = useState<number | null>(null);

  const activeLevels: number[] = stats?.activeLevelsList ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Уровни улиев</h1>
          <p className="text-white/30 text-sm mt-1">Активно: {activeLevels.length} из 10</p>
        </div>
        <div className="hidden sm:flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
            const active = activeLevels.includes(level);
            return (
              <div
                key={level}
                className="w-6 h-1.5 rounded-full transition-all"
                style={{ background: active ? "#F5A623" : "rgba(255,255,255,0.08)" }}
              />
            );
          })}
        </div>
      </div>

      {/* Summary table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="grid grid-cols-5 text-[10px] uppercase tracking-widest text-white/25 px-5 py-3 border-b border-white/5">
          <span>Улий</span>
          <span>Цена</span>
          <span>Доход с цикла</span>
          <span>Циклов</span>
          <span>Статус</span>
        </div>
        {HIVE_PRICES_DAI.map((price, i) => (
          <LevelRow
            key={i + 1}
            level={i + 1}
            price={price}
            active={activeLevels.includes(i + 1)}
            address={address}
            onBuy={() => setBuyLevel(i + 1)}
            delay={i * 0.03}
          />
        ))}
      </div>

      {/* Card grid */}
      <div>
        <h2 className="text-base font-bold text-white/60 mb-4">Детали</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
            <HiveCard
              key={level}
              level={level}
              active={activeLevels.includes(level)}
              address={address}
              onClick={() => setBuyLevel(level)}
            />
          ))}
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
