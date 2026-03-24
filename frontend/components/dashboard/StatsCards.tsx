"use client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Layers, Clock } from "lucide-react";
import { formatDAI } from "@/lib/formatters";
import { useT } from "@/lib/i18n/LanguageContext";

interface StatsCardsProps {
  totalEarned:  bigint;
  totalSpent:   bigint;
  activeLevels: number;
  pending:      bigint;
}

export function StatsCards({ totalEarned, totalSpent, activeLevels, pending }: StatsCardsProps) {
  const net = totalEarned - totalSpent;
  const { t } = useT();

  const cards = [
    {
      icon:  TrendingUp,
      label: t.stats.earned,
      value: formatDAI(totalEarned),
      color: "#27AE60",
      bg:    "rgba(39,174,96,0.08)",
      border:"rgba(39,174,96,0.15)",
    },
    {
      icon:  TrendingDown,
      label: t.stats.spent,
      value: formatDAI(totalSpent),
      color: "rgba(255,255,255,0.5)",
      bg:    "rgba(255,255,255,0.04)",
      border:"rgba(255,255,255,0.07)",
    },
    {
      icon:  Layers,
      label: t.stats.activeLevels,
      value: `${activeLevels} / 10`,
      color: "#F5A623",
      bg:    "rgba(245,166,35,0.08)",
      border:"rgba(245,166,35,0.15)",
    },
    {
      icon:  Clock,
      label: t.stats.pending,
      value: formatDAI(pending),
      color: "#FFC857",
      bg:    "rgba(255,200,87,0.06)",
      border:"rgba(255,200,87,0.12)",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ icon: Icon, label, value, color, bg, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs font-medium">{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-lg font-black" style={{ color }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Net profit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-white/40 text-sm">{t.stats.netIncome}</span>
        <span
          className="text-xl font-black"
          style={{ color: net >= 0n ? "#27AE60" : "#E94560" }}
        >
          {net >= 0n ? "+" : ""}{formatDAI(net)}
        </span>
      </motion.div>
    </div>
  );
}
