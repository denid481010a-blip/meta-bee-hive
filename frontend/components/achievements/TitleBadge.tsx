import { TITLES } from "@/lib/constants";
import { clsx } from "clsx";

interface TitleBadgeProps {
  activeLevels: number;
  teamSize:     number;
  cycles:       number;
  className?:   string;
}

export function TitleBadge({ activeLevels, teamSize, cycles, className }: TitleBadgeProps) {
  const titles = TITLES as readonly { id: string; label: string; condition: string; min: number }[];

  let title = titles[0];

  if (activeLevels >= 10)   title = titles[5]; // Королева улья
  else if (teamSize >= 100) title = titles[6]; // Легенда роя
  else if (cycles >= 10)    title = titles[4]; // Мастер улья
  else if (cycles >= 1)     title = titles[3]; // Медосборщик
  else if (teamSize >= 10)  title = titles[2]; // Пчелиный рой
  else if (activeLevels >= 3) title = titles[1]; // Строитель

  return (
    <div className={clsx(
      "inline-flex items-center gap-2 px-4 py-2 rounded-full",
      "bg-gold/10 border border-gold/30 text-gold text-sm font-bold",
      className
    )}>
      <span>👑</span>
      <span>{title.label}</span>
    </div>
  );
}
