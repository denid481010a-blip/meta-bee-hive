"use client";
import { motion } from "framer-motion";
import { useMatrix } from "@/hooks/useMatrix";
import { LEVEL_COLORS } from "@/lib/constants";
import { shortAddress } from "@/lib/formatters";
import { RefreshCw } from "lucide-react";

interface MatrixViewProps {
  address: `0x${string}`;
  level:   number;
}

// SVG классический улей (skep) с кольцами
function HiveSVG({ color, level, size = 100 }: { color: string; level: number; size?: number }) {
  const id = `hive-${level}`;
  // Кольца улья снизу вверх: [cx, cy, rx, ry]
  const rings = [
    [50, 72, 26, 5.5],   // основание
    [50, 65, 24, 5],
    [50, 58, 21, 4.5],
    [50, 52, 18, 4],
    [50, 46, 15, 3.5],
    [50, 41, 11, 3],
    [50, 37, 7,  2.5],   // верхушка
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7a4a10" stopOpacity="0.9" />
          <stop offset="30%"  stopColor={color}   stopOpacity="0.95" />
          <stop offset="70%"  stopColor={color}   stopOpacity="0.85" />
          <stop offset="100%" stopColor="#5a3008" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`${id}-dark`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#3d2008" stopOpacity="0.8" />
          <stop offset="50%"  stopColor="#7a4a10" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2a1505" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="60%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Ground glow */}
      <ellipse cx="50" cy="74" rx="30" ry="10" fill={`url(#${id}-glow)`} />

      {/* Shadow under hive */}
      <ellipse cx="50" cy="77" rx="24" ry="4" fill="#000" opacity="0.4" />

      {/* Hive body — filled silhouette first */}
      <path
        d="M24 72 Q24 36 50 33 Q76 36 76 72 Z"
        fill={`url(#${id}-body)`}
        filter={`url(#${id}-blur)`}
        opacity="0.95"
      />
      {/* Side shading */}
      <path d="M24 72 Q24 36 50 33 L50 72 Z" fill="#000" opacity="0.2" />
      <path d="M76 72 Q76 36 50 33 L50 72 Z" fill="#fff" opacity="0.04" />

      {/* Rings (horizontal lines) */}
      {rings.map(([cx, cy, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
            fill={`url(#${id}-dark)`} opacity="0.7" />
          <ellipse cx={cx} cy={cy - ry * 0.3} rx={rx * 0.95} ry={ry * 0.4}
            fill={color} opacity="0.2" />
        </g>
      ))}

      {/* Top cap */}
      <ellipse cx="50" cy="33" rx="7" ry="3.5" fill={color} opacity="0.8" />
      <ellipse cx="50" cy="31.5" rx="4" ry="2" fill="#fff" opacity="0.3" />

      {/* Entry hole */}
      <path d="M43 72 Q43 67 50 67 Q57 67 57 72 Z" fill="#1a0800" opacity="0.9" />

      {/* Hex pattern overlay */}
      {[
        "M46 56 L50 54 L54 56 L54 60 L50 62 L46 60 Z",
        "M41 47 L45 45 L49 47 L49 51 L45 53 L41 51 Z",
        "M51 47 L55 45 L59 47 L59 51 L55 53 L51 51 Z",
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" />
      ))}

      {/* Sparkles */}
      {[[72,42,1.4],[28,50,1],[70,58,0.9],[30,63,1.2],[62,34,1]].map(([x,y,r],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={color} opacity="0.55"
          className="animate-pulse" style={{ animationDelay: `${i*0.35}s` }} />
      ))}

      {/* Level number */}
      <text x="50" y="54" textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="12" fontWeight="900" opacity="0.95">
        {level}
      </text>
    </svg>
  );
}

export function MatrixView({ address, level }: MatrixViewProps) {
  const { matrix, isLoading } = useMatrix(address, level);
  const color = LEVEL_COLORS[level] ?? "#F5A623";

  const slots     = matrix?.slots     ?? [];
  const slotCount = matrix?.slotCount ?? 0;
  const cycles    = matrix?.cycles    ?? 0;
  const ZERO      = "0x0000000000000000000000000000000000000000";

  // Размеры canvas
  const W = 340; const H = 320;
  const cx = W / 2; const cy = H / 2 + 10;
  const orbitR = 118;

  // Позиции: 4 слота (верх, право, низ, лево)
  const slotAngles = [270, 0, 90, 180]; // верх, право, низ, лево
  const slotPos = slotAngles.map((deg) => ({
    x: cx + orbitR * Math.cos((deg * Math.PI) / 180),
    y: cy + orbitR * Math.sin((deg * Math.PI) / 180),
  }));
  const CYCLE_COLOR = "#27AE60"; // 4й слот — реактивация

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ backgroundColor: color + "20", color }}>
            {level}
          </div>
          <div>
            <p className="font-bold text-white text-sm">Hive {level}</p>
            <p className="text-white/30 text-xs">Матрица S4</p>
          </div>
        </div>
        {cycles > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#27AE60" }}>
            <RefreshCw className="w-3.5 h-3.5" />
            {cycles} цикл{cycles > 1 ? "а" : ""}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex justify-center py-6 px-2">
        {isLoading ? (
          <div style={{ width: W, height: H }} className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: color, borderTopColor: "transparent" }} />
          </div>
        ) : (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
            <defs>
              <radialGradient id="bg-glow" cx="50%" cy="50%">
                <stop offset="0%"   stopColor={color} stopOpacity="0.06" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background glow */}
            <circle cx={cx} cy={cy} r={orbitR + 30} fill="url(#bg-glow)" />

            {/* Orbit ring */}
            <circle cx={cx} cy={cy} r={orbitR}
              fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.25"
              strokeDasharray="5 6"
            />
            {/* Inner ring */}
            <circle cx={cx} cy={cy} r={orbitR * 0.55}
              fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.08"
            />

            {/* Particle dots on orbit */}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * 360;
              const x = cx + orbitR * Math.cos((a * Math.PI) / 180);
              const y = cy + orbitR * Math.sin((a * Math.PI) / 180);
              return <circle key={i} cx={x} cy={y} r="1" fill={color} opacity="0.2" />;
            })}

            {/* Lines: center → slots */}
            {slotPos.map((pos, i) => (
              <line key={i}
                x1={cx} y1={cy} x2={pos.x} y2={pos.y}
                stroke={color} strokeWidth="0.8"
                strokeOpacity={i < slotCount ? 0.3 : 0.1}
                strokeDasharray="4 4"
              />
            ))}

            {/* Center: hive illustration */}
            <foreignObject x={cx - 50} y={cy - 55} width="100" height="100">
              <div style={{ width: 100, height: 100 }}>
                <HiveSVG color={color} level={level} size={100} />
              </div>
            </foreignObject>

            {/* Address under hive */}
            <text x={cx} y={cy + 54} textAnchor="middle"
              fill="white" fontSize="9" opacity="0.45" fontFamily="monospace">
              {shortAddress(address)}
            </text>

            {/* Slot nodes */}
            {slotPos.map((pos, i) => {
              const is4th     = i === 3;
              const nodeColor = is4th ? CYCLE_COLOR : color;
              const filled    = slotCount > i && slots[i] !== undefined && slots[i] !== ZERO;
              const slotLabel = is4th ? "реактивация" : `слот ${i + 1}`;

              return (
                <motion.g key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.12 + 0.3 }}
                >
                  {/* Glow ring */}
                  {(filled || is4th) && (
                    <circle cx={pos.x} cy={pos.y} r={28}
                      fill={nodeColor} opacity={is4th ? "0.06" : "0.07"} className="animate-pulse" />
                  )}
                  {/* Circle — 4й слот со штриховой рамкой */}
                  <circle cx={pos.x} cy={pos.y} r={22}
                    fill={filled ? nodeColor + "18" : is4th ? CYCLE_COLOR + "0a" : "rgba(255,255,255,0.04)"}
                    stroke={filled ? nodeColor : is4th ? CYCLE_COLOR : "rgba(255,255,255,0.15)"}
                    strokeWidth={filled ? "1.5" : is4th ? "1" : "1"}
                    strokeDasharray={is4th && !filled ? "3 3" : undefined}
                    strokeOpacity={is4th && !filled ? "0.5" : undefined}
                  />
                  {/* Иконка обновления для 4го слота */}
                  {is4th && !filled && (
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                      fill={CYCLE_COLOR} fontSize="13" opacity="0.6">↺</text>
                  )}
                  {/* Number or address */}
                  {filled ? (
                    <>
                      <text x={pos.x} y={pos.y - 3} textAnchor="middle" dominantBaseline="middle"
                        fill={nodeColor} fontSize="8" fontWeight="700" fontFamily="monospace">
                        {shortAddress(slots[i])}
                      </text>
                      <text x={pos.x} y={pos.y + 8} textAnchor="middle" dominantBaseline="middle"
                        fill={nodeColor} fontSize="7" opacity="0.7">✓</text>
                    </>
                  ) : !is4th ? (
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                      fill="rgba(255,255,255,0.25)" fontSize="14" fontWeight="600">
                      {i + 1}
                    </text>
                  ) : null}
                  {/* Label below */}
                  <text x={pos.x} y={pos.y + 32} textAnchor="middle"
                    fill={is4th ? CYCLE_COLOR + "99" : "rgba(255,255,255,0.2)"} fontSize="9">
                    {slotLabel}
                  </text>
                </motion.g>
              );
            })}

          </svg>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-center gap-6 px-5 pb-5 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          Слоты 1–3 → сбор меда
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-bee-green" />
          Слот 4 → реактивация улия
        </span>
      </div>
    </div>
  );
}
