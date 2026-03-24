"use client";
import { clsx } from "clsx";
import { useT } from "@/lib/i18n/LanguageContext";

interface TitleBadgeProps {
  activeLevels: number;
  teamSize:     number;
  cycles:       number;
  className?:   string;
}

export function TitleBadge({ activeLevels, teamSize, cycles, className }: TitleBadgeProps) {
  const { t } = useT();

  let titleKey: keyof typeof t.titles = "worker";
  if (activeLevels >= 10)    titleKey = "queen";
  else if (teamSize >= 100)  titleKey = "legend";
  else if (cycles >= 10)     titleKey = "master";
  else if (cycles >= 1)      titleKey = "harvest";
  else if (teamSize >= 10)   titleKey = "swarm";
  else if (activeLevels >= 3) titleKey = "builder";

  return (
    <div className={clsx(
      "inline-flex items-center gap-2 px-4 py-2 rounded-full",
      "bg-gold/10 border border-gold/30 text-gold text-sm font-bold",
      className
    )}>
      <span>👑</span>
      <span>{t.titles[titleKey]}</span>
    </div>
  );
}
