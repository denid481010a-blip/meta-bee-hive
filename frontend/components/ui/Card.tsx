import { clsx } from "clsx";

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  glow?:      "gold" | "blue" | "green" | "none";
  onClick?:   () => void;
}

export function Card({ children, className, glow = "none", onClick }: CardProps) {
  const glowStyles: Record<string, React.CSSProperties> = {
    gold:  { boxShadow: "0 0 24px rgba(245,166,35,0.15), 0 0 0 1px rgba(245,166,35,0.12)" },
    blue:  { boxShadow: "0 0 24px rgba(76,143,255,0.15), 0 0 0 1px rgba(76,143,255,0.12)" },
    green: { boxShadow: "0 0 24px rgba(39,174,96,0.15),  0 0 0 1px rgba(39,174,96,0.12)"  },
    none:  {},
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-2xl border border-white/[0.07] bg-card p-4",
        onClick && "cursor-pointer transition-all hover:border-white/[0.12]",
        className
      )}
      style={glowStyles[glow]}
    >
      {children}
    </div>
  );
}
