import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "gold" | "navy" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

const variants: Record<Variant, string> = {
  gold:   "bg-gold-gradient text-bg font-bold hover:shadow-gold hover:scale-105",
  navy:   "bg-navy border border-gold/30 text-white hover:border-gold/70",
  ghost:  "border border-white/20 text-white/80 hover:border-white/50 hover:text-white",
  danger: "bg-white/10 border border-white/30 text-white hover:bg-white/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

export function Button({
  variant = "gold",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
