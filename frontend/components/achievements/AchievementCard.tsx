"use client";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface AchievementCardProps {
  id:       string;
  icon:     string;
  label:    string;
  desc:     string;
  unlocked: boolean;
  progress?: number; // 0–100
}

export function AchievementCard({ icon, label, desc, unlocked, progress }: AchievementCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={clsx(
        "rounded-2xl border p-4 transition-all duration-300",
        unlocked
          ? "border-gold/30 bg-card-gradient shadow-gold"
          : "border-white/10 bg-white/5 opacity-60 grayscale"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
          unlocked ? "bg-gold/20" : "bg-white/10"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={clsx("font-bold text-sm", unlocked ? "text-gold" : "text-white/50")}>{label}</p>
            {unlocked && <span className="text-xs bg-bee-green/20 text-bee-green px-1.5 py-0.5 rounded-full">✓</span>}
          </div>
          <p className="text-white/40 text-xs mt-0.5">{desc}</p>

          {progress !== undefined && !unlocked && (
            <div className="mt-2">
              <ProgressBar value={progress} height="sm" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
