"use client";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { HIVE_PRICES_DAI, LEVEL_COLORS } from "@/lib/constants";
import { useMatrix } from "@/hooks/useMatrix";

interface HiveCardProps {
  level:    number;
  active:   boolean;
  isNext?:  boolean;
  address?: `0x${string}`;
  onClick?: () => void;
  compact?: boolean;
}

// Мини-улей SVG для карточек
function HiveMini({
  level, color, active, slotCount, size = 110,
}: {
  level: number; color: string; active: boolean; slotCount: number; size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const orbitR = size * 0.38;
  const dotR   = size * 0.07;
  const hiveS  = size * 0.28;
  const alpha  = active ? 1 : 0.3;

  // 4 слота: верх, право, лево, низ
  const angles = [270, 30, 150, 90];
  const slots  = angles.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + orbitR * Math.cos(rad),
      y: cy + orbitR * Math.sin(rad),
      filled: i < slotCount,
      is4th: i === 3,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`hm-${level}-${size}`} cx="40%" cy="30%">
          <stop offset="0%"   stopColor={active ? color : "#444"} stopOpacity="0.9" />
          <stop offset="100%" stopColor={active ? color : "#222"} stopOpacity="0.3" />
        </radialGradient>
      </defs>

      {/* Orbit */}
      {active && <circle cx={cx} cy={cy} r={orbitR + 4} fill={color} opacity="0.04" />}
      <circle cx={cx} cy={cy} r={orbitR}
        fill="none" stroke={color}
        strokeWidth="0.8" strokeOpacity={active ? 0.25 : 0.1}
        strokeDasharray="3 4"
      />

      {/* Lines to slots */}
      {slots.map((s, i) => (
        <line key={i} x1={cx} y1={cy} x2={s.x} y2={s.y}
          stroke={color} strokeWidth="0.5"
          strokeOpacity={s.filled ? 0.2 : 0.07}
          strokeDasharray="2 3"
        />
      ))}

      {/* Hive body — skep shape */}
      <path
        d={`M${cx - hiveS} ${cy + hiveS * 0.42} Q${cx - hiveS} ${cy - hiveS * 0.85} ${cx} ${cy - hiveS} Q${cx + hiveS} ${cy - hiveS * 0.85} ${cx + hiveS} ${cy + hiveS * 0.42} Z`}
        fill={active ? color : "#333"}
        opacity={active ? 0.85 : 0.25}
      />
      {/* Shading */}
      <path
        d={`M${cx - hiveS} ${cy + hiveS * 0.42} Q${cx - hiveS} ${cy - hiveS * 0.85} ${cx} ${cy - hiveS} L${cx} ${cy + hiveS * 0.42} Z`}
        fill="#000" opacity="0.18"
      />
      {/* Rings */}
      {[0.38, 0.22, 0.06, -0.1, -0.26, -0.42, -0.56].map((yOff, i) => {
        const ry2  = cy + hiveS * yOff;
        const prog = i / 6;
        const rx2  = hiveS * (1 - prog * 0.65);
        return (
          <ellipse key={i} cx={cx} cy={ry2} rx={rx2 * 0.9} ry={hiveS * 0.1}
            fill="#000" opacity={active ? 0.25 : 0.12} />
        );
      })}
      {/* Entry */}
      <path d={`M${cx - hiveS*0.22} ${cy + hiveS*0.42} Q${cx - hiveS*0.22} ${cy + hiveS*0.18} ${cx} ${cy + hiveS*0.18} Q${cx + hiveS*0.22} ${cy + hiveS*0.18} ${cx + hiveS*0.22} ${cy + hiveS*0.42} Z`}
        fill="#1a0800" opacity={active ? 0.9 : 0.4} />
      {/* Level number */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={size * 0.13} fontWeight="900" opacity={active ? 0.95 : 0.3}>
        {level}
      </text>

      {/* Slot dots */}
      {slots.map((s, i) => {
        const sc = s.is4th ? "#ffc857" : color;
        return (
          <g key={i}>
            {s.filled && <circle cx={s.x} cy={s.y} r={dotR * 1.8} fill={sc} opacity="0.1" />}
            <circle cx={s.x} cy={s.y} r={dotR}
              fill={s.filled ? sc + "30" : "transparent"}
              stroke={s.filled ? sc : (active ? color : "rgba(255,255,255,0.1)")}
              strokeWidth="0.8"
              strokeOpacity={s.filled ? 0.9 : (active ? 0.3 : 0.1)}
            />
            {s.filled && (
              <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="middle"
                fill={sc} fontSize={size * 0.07} fontWeight="700" opacity="0.9">✓</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function HiveCard({ level, active, isNext = false, address, onClick, compact = false }: HiveCardProps) {
  const color = LEVEL_COLORS[level] ?? "#F5A623";
  const price = HIVE_PRICES_DAI[level - 1];
  const { matrix } = useMatrix(address, active ? level : undefined);

  const slotCount = matrix?.slotCount ?? 0;
  const cycles    = matrix?.cycles    ?? 0;
  const pct       = Math.round((slotCount / 4) * 100);

  if (compact) {
    return (
      <motion.button
        onClick={active ? undefined : (isNext ? onClick : undefined)}
        whileHover={isNext || active ? { scale: 1.04, y: -2 } : {}}
        whileTap={isNext ? { scale: 0.97 } : {}}
        className={clsx(
          "relative flex flex-col items-center gap-1.5 rounded-2xl p-3 border transition-all duration-300",
          active   ? "border-white/10 bg-card cursor-default" :
          isNext   ? "border-gold/40 bg-card cursor-pointer" :
          "border-white/5 bg-white/[0.02] opacity-30 cursor-not-allowed"
        )}
        style={active ? { boxShadow: `0 0 16px ${color}18` } :
               isNext ? { boxShadow: `0 0 20px ${color}30`, animation: "pulse 2s infinite" } : undefined}
      >
        {(active || isNext) && (
          <div
            className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)` }}
          />
        )}
        <HiveMini level={level} slotCount={slotCount} color={color} active={active} size={72} />
        <span className="text-xs font-bold" style={{ color: active ? color : isNext ? color : "#555" }}>
          H{level}
        </span>
        {active && <span className="text-[10px] text-white/40">{pct}%</span>}
        {isNext && <span className="text-[10px] font-bold animate-pulse" style={{ color }}>Активировать</span>}
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      className={clsx(
        "relative rounded-3xl border cursor-pointer overflow-hidden transition-all duration-300",
        active
          ? "border-white/10 bg-card"
          : "border-white/5 bg-white/[0.02]"
      )}
      style={active ? { boxShadow: `0 4px 32px ${color}18, 0 0 0 1px ${color}18` } : undefined}
    >
      {/* Background glow */}
      {active && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${color}12 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Уровень</div>
            <div className="text-2xl font-black" style={{ color: active ? color : "#444" }}>
              H{level}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Цена</div>
            <div className="text-sm font-bold text-white/70">{price} DAI</div>
          </div>
        </div>

        {/* Orbital visual */}
        <div className="flex justify-center my-2">
          <HiveMini level={level} slotCount={slotCount} color={color} active={active} size={110} />
        </div>

        {/* Stats row */}
        {active ? (
          <div className="mt-3 space-y-3">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>{pct}%</span>
                {cycles > 0 && (
                  <span className="text-bee-green">{cycles} {cycles === 1 ? "цикл" : "цикла"}</span>
                )}
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
                />
              </div>
            </div>

            {/* Slots */}
            <div className="grid grid-cols-4 gap-1.5">
              {[0,1,2,3].map((i) => {
                const filled = i < slotCount;
                const is4th  = i === 3;
                return (
                  <div
                    key={i}
                    className={clsx(
                      "h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                      filled && is4th  ? "bg-bee-green/20 text-bee-green" :
                      filled           ? "text-white/80" :
                      "bg-white/5 text-white/20"
                    )}
                    style={filled && !is4th ? { backgroundColor: color + "30", color } : undefined}
                  >
                    {filled ? (is4th ? "↑" : "✓") : i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-center">
            {isNext ? (
              <span className="text-xs font-bold animate-pulse" style={{ color }}>🐝 Активировать</span>
            ) : (
              <span className="text-xs text-white/20">Недоступно</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
