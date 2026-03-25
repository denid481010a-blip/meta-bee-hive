"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { HiveCard } from "@/components/hive/HiveCard";
import { BuyLevelModal } from "@/components/levels/BuyLevelModal";
import { useStats } from "@/hooks/useStats";
import { useMatrix } from "@/hooks/useMatrix";
import { HIVE_PRICES_DAI, LEVEL_COLORS } from "@/lib/constants";
import { useT } from "@/lib/i18n/LanguageContext";
import { clearLogsCache } from "@/lib/getLogs";
import { RefreshCw } from "lucide-react";
import { RegisterModal } from "@/components/dashboard/RegisterModal";

function LevelRow({
  level, price, active, cycles, delay, isNext, onBuy,
}: {
  level: number; price: number; active: boolean; cycles: number;
  delay: number; isNext: boolean; onBuy: () => void;
}) {
  const color = LEVEL_COLORS[level] ?? "#F5A623";
  const cycleIncome = +(price * 3 * 0.9).toFixed(2);
  const { t } = useT();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="grid px-4 py-3 border-b border-white/[0.04] items-center text-sm"
      style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr" }}
    >
      <span className="font-black text-sm" style={{ color }}>Hive {level}</span>
      <span className="text-white/70 text-xs font-medium">{price} DAI</span>
      <span className="text-xs font-medium whitespace-nowrap" style={{ color: "#27AE60" }}>+{cycleIncome} DAI</span>
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
            {t.levels.bought}
          </span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)" }}>
            {t.levels.inactive}
          </span>
        )}
      </span>
    </motion.div>
  );
}

function LevelEntry({
  level, price, active, address, delay, isNext, onBuy,
}: {
  level: number; price: number; active: boolean;
  address?: `0x${string}`; delay: number; isNext: boolean; onBuy: () => void;
}) {
  const { matrix } = useMatrix(active ? address : undefined, active ? level : undefined);
  const cycles = matrix?.cycles ?? 0;
  return (
    <LevelRow level={level} price={price} active={active} cycles={cycles}
      delay={delay} isNext={isNext} onBuy={onBuy} />
  );
}

export default function LevelsPage() {
  const { address } = useAccount();
  const { stats, refetch } = useStats(address);
  const { t } = useT();
  const [buyLevel, setBuyLevel] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const isRegistered = stats?.isRegistered ?? false;
  const activeLevels: number[] = stats?.activeLevelsList ?? [];
  const nextLevel = (stats?.activeLevels ?? 0) + 1;

  function handleCardClick(level: number) {
    if (!isRegistered) { setShowRegister(true); return; }
    if (level === nextLevel) setBuyLevel(level);
  }

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
            <div key={level} className="w-6 h-1.5 rounded-full transition-all"
              style={{ background: activeLevels.includes(level) ? "#F5A623" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="grid text-[10px] uppercase tracking-widest text-white/25 px-5 py-3 border-b border-white/5"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr" }}>
          <span>{t.levels.hive}</span>
          <span>{t.levels.price}</span>
          <span>{t.levels.cycleIncome}</span>
          <span>{t.levels.cycles}</span>
          <span>{t.levels.status}</span>
        </div>
        {HIVE_PRICES_DAI.map((price, i) => (
          <LevelEntry
            key={i + 1}
            level={i + 1}
            price={price}
            active={activeLevels.includes(i + 1)}
            address={address}
            delay={i * 0.03}
            isNext={i + 1 === nextLevel}
            onBuy={() => setBuyLevel(i + 1)}
          />
        ))}
      </div>

      {/* Card grid */}
      <div>
        <h2 className="text-base font-bold text-white/60 mb-4">{t.levels.details}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level, i) => (
            <motion.div key={level} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <HiveCard
                level={level}
                active={activeLevels.includes(level)}
                isNext={level === nextLevel || !isRegistered}
                address={address}
                onClick={() => handleCardClick(level)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => { setShowRegister(false); refetch(); }}
      />
      <BuyLevelModal
        level={buyLevel}
        address={address}
        onClose={() => setBuyLevel(null)}
        onSuccess={() => { setBuyLevel(null); clearLogsCache(address); refetch(); }}
      />
    </div>
  );
}
