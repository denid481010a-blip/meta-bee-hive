"use client";
import { clsx } from "clsx";

interface ProgressBarProps {
  value: number;      // 0–100
  color?: string;     // tailwind bg color class or hex
  label?: string;
  showPercent?: boolean;
  height?: "sm" | "md" | "lg";
}

const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

export function ProgressBar({
  value,
  color = "bg-gold-gradient",
  label,
  showPercent = false,
  height = "md",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-white/60 mb-1">
          {label && <span>{label}</span>}
          {showPercent && <span>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={clsx("w-full bg-white/10 rounded-full overflow-hidden", heights[height])}>
        <div
          className={clsx("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
