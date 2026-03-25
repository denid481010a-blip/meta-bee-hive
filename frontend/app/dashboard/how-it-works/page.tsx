"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HIVE_PRICES_DAI } from "@/lib/constants";
import { useT } from "@/lib/i18n/LanguageContext";

// ── S4 Matrix visual ──────────────────────────────────────────────────────────
function MatrixDiagram({ filledSlots = 0 }: { filledSlots?: number }) {
  const slots = [
    { label: "1", angle: 270, income: true },
    { label: "2", angle: 30,  income: true },
    { label: "3", angle: 150, income: true },
    { label: "4", angle: 90,  income: false },
  ];
  const cx = 80; const cy = 80; const r = 50; const dotR = 14;

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(245,166,35,0.2)" strokeWidth="1" strokeDasharray="4 4" />
      {slots.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const filled = i < filledSlots;
        const color = s.income ? "#F5A623" : "#27AE60";
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 3" />
            <circle cx={x} cy={y} r={dotR} fill={filled ? color + "25" : "rgba(255,255,255,0.04)"} stroke={filled ? color : "rgba(255,255,255,0.15)"} strokeWidth="1.5" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={filled ? color : "rgba(255,255,255,0.3)"} fontSize="9" fontWeight="700">
              {s.income ? `S${i+1}` : "↑"}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={18} fill="rgba(245,166,35,0.15)" stroke="rgba(245,166,35,0.4)" strokeWidth="1.5" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#F5A623" fontSize="10" fontWeight="900">YOU</text>
    </svg>
  );
}

function FlowStep({ n, title, desc, color = "#F5A623" }: { n: string; title: string; desc: string; color?: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
        style={{ background: color + "20", border: `1.5px solid ${color}50`, color }}>
        {n}
      </div>
      <div>
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function IncomeCard({ level, price, color, entryLabel, perSlotLabel, perCycleLabel }: {
  level: number; price: number; color: string;
  entryLabel: string; perSlotLabel: string; perCycleLabel: string;
}) {
  const perSlot = +(price * 0.9).toFixed(2);
  const perCycle = +(price * 3 * 0.9).toFixed(2);
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: color + "0D", border: `1px solid ${color}25` }}>
      <p className="font-black text-sm" style={{ color }}>Hive {level}</p>
      <p className="text-white/40 text-xs">{entryLabel} {price} DAI</p>
      <div className="flex justify-between text-xs mt-1">
        <div>
          <p className="text-white/30">{perSlotLabel}</p>
          <p className="font-bold text-white">+{perSlot} DAI</p>
        </div>
        <div className="text-right">
          <p className="text-white/30">{perCycleLabel}</p>
          <p className="font-bold" style={{ color }}>+{perCycle} DAI</p>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  const router = useRouter();
  const { t } = useT();
  const h = t.howItWorks;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        {h.back}
      </button>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white">{h.title}</h1>
        <p className="text-white/40 text-sm mt-1">{h.subtitle}</p>
      </motion.div>

      {/* ── Блок 1: Суть ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
        <h2 className="text-lg font-black text-white">🍯 {h.block1Title}</h2>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "rgba(39,174,96,0.12)", border: "1px solid rgba(39,174,96,0.25)", color: "#27AE60", width: "fit-content" }}>
          💵 {h.daiBadge}
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          META BEE HIVE — <span className="text-gold font-bold">S4</span> {h.block1Text}
        </p>
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl text-xs"
          style={{ background: "rgba(76,143,255,0.08)", border: "1px solid rgba(76,143,255,0.2)" }}>
          <span className="text-xl flex-shrink-0">🔐</span>
          <p className="text-white/60 leading-relaxed">
            <span className="text-white font-bold">{h.securityNote}</span>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          {[
            { icon: "⚡", label: h.autoOn.replace("✓ ", ""), sub: h.autoOnDesc.split("→")[0].trim() },
            { icon: "🔒", label: "Smart contract", sub: "Open source" },
            { icon: "♾️", label: h.infiniteTitle, sub: h.cycleTotal },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-white font-bold text-[11px]">{item.label}</p>
              <p className="text-white/30 text-[10px] mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Блок 2: Матрица S4 ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-3xl p-6 space-y-5"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-lg font-black text-white">🐝 {h.block2Title}</h2>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <MatrixDiagram filledSlots={2} />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                style={{ background: "rgba(245,166,35,0.2)", color: "#F5A623" }}>S1</div>
              <div>
                <p className="text-white text-sm font-bold">{h.slots123}</p>
                <p className="text-white/40 text-xs">{h.slots123desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                style={{ background: "rgba(39,174,96,0.2)", color: "#27AE60" }}>S4</div>
              <div>
                <p className="text-white text-sm font-bold">{h.slot4}</p>
                <p className="text-white/40 text-xs">{h.slot4desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                style={{ background: "rgba(76,143,255,0.2)", color: "#4C8FFF" }}>10%</div>
              <div>
                <p className="text-white text-sm font-bold">{h.fee}</p>
                <p className="text-white/40 text-xs">{h.feeDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Slots example */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-white/50 text-xs uppercase tracking-widest">{h.exampleTitle}</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { slot: 1, amount: "4.5", color: "#F5A623", label: h.toYou },
              { slot: 2, amount: "4.5", color: "#F5A623", label: h.toYou },
              { slot: 3, amount: "4.5", color: "#F5A623", label: h.toYou },
              { slot: 4, amount: "4.5", color: "#27AE60", label: h.toUp },
            ].map((s) => (
              <div key={s.slot} className="rounded-xl p-2 text-center"
                style={{ background: s.color + "12", border: `1px solid ${s.color}30` }}>
                <p className="text-[10px] text-white/40">Slot {s.slot}</p>
                <p className="font-black text-sm" style={{ color: s.color }}>{s.amount}</p>
                <p className="text-[10px]" style={{ color: s.color }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <span className="text-white/40">{h.cycleTotal}</span>
            <span className="font-black text-gold">+13.5 DAI</span>
          </div>
        </div>
      </motion.div>

      {/* ── Блок 3: Шаги ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-lg font-black text-white">📋 {h.block3Title}</h2>
        <div className="space-y-4">
          <FlowStep n="1" title={h.step1Title} desc={h.step1Desc} />
          <FlowStep n="2" title={h.step2Title} desc={h.step2Desc} color="#27AE60" />
          <FlowStep n="3" title={h.step3Title} desc={h.step3Desc} color="#4C8FFF" />
          <FlowStep n="4" title={h.step4Title} desc={h.step4Desc} color="#7C4DFF" />
          <FlowStep n="5" title={h.step5Title} desc={h.step5Desc} color="#F5A623" />
        </div>
      </motion.div>

      {/* ── Блок 4: Доход по уровням ────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-lg font-black text-white">💰 {h.block4Title}</h2>
        <p className="text-white/40 text-xs">{h.block4Sub}</p>
        <div className="grid grid-cols-2 gap-3">
          {HIVE_PRICES_DAI.slice(0, 6).map((price, i) => (
            <IncomeCard key={i} level={i + 1} price={price} color={i < 3 ? "#F5A623" : "#4C8FFF"}
              entryLabel={h.entryPrice} perSlotLabel={h.perSlot} perCycleLabel={h.perCycle} />
          ))}
        </div>
        <div className="rounded-2xl p-4 text-center"
          style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}>
          <p className="text-white/50 text-xs mb-1">{h.allLevels}</p>
          <p className="text-3xl font-black text-gold">
            +{HIVE_PRICES_DAI.reduce((sum, p) => sum + p * 3 * 0.9, 0).toFixed(0)} DAI
          </p>
        </div>
      </motion.div>

      {/* ── Блок 5: Рефералы ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-lg font-black text-white">🔗 {h.block5Title}</h2>

        {/* Ref tree visual */}
        <div className="rounded-2xl p-4 space-y-1" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex justify-center">
            <div className="rounded-full px-5 py-2 text-xs font-black flex items-center gap-2"
              style={{ background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.5)", color: "#F5A623" }}>
              YOU 💰
            </div>
          </div>
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold" style={{ color: "#27AE60" }}>+DAI</span>
              <span className="text-base leading-none" style={{ color: "#27AE60" }}>↑</span>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            {[
              { name: "Alex", dai: "4.5" },
              { name: "Maria", dai: "4.5" },
              { name: "John", dai: "4.5" },
            ].map((r, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60A5FA" }}>
                  {r.name}
                </div>
                <span className="text-[9px] font-bold" style={{ color: "#27AE60" }}>cycle → +{r.dai} DAI</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-1">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold" style={{ color: "#A78BFA" }}>+DAI</span>
              <span className="text-base leading-none" style={{ color: "#A78BFA" }}>↑</span>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {[
              { name: "Igor", dai: "4.5" },
              { name: "Anna", dai: "4.5" },
              { name: "Dima", dai: "4.5" },
              { name: "Olya", dai: "4.5" },
            ].map((r, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#A78BFA" }}>
                  {r.name}
                </div>
                <span className="text-[8px] font-bold" style={{ color: "#27AE60" }}>+{r.dai} DAI</span>
              </div>
            ))}
          </div>
          <p className="text-center text-white/30 text-[10px] pt-2">{h.cycleClosedNote}</p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex gap-3 items-start">
            <span className="text-lg flex-shrink-0">⬆️</span>
            <div>
              <p className="text-white font-bold">{h.overflowTitle}</p>
              <p className="text-white/40 text-xs">{h.overflowDesc}</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg flex-shrink-0">♾️</span>
            <div>
              <p className="text-white font-bold">{h.infiniteTitle}</p>
              <p className="text-white/40 text-xs">{h.infiniteDesc}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Блок 6: Автопокупка ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "rgba(39,174,96,0.06)", border: "1px solid rgba(39,174,96,0.15)" }}>
        <h2 className="text-lg font-black text-white">⚡ {h.block6Title}</h2>
        <p className="text-white/70 text-sm leading-relaxed">{h.block6Text}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.2)" }}>
            <p className="text-bee-green font-black text-sm">{h.autoOn}</p>
            <p className="text-white/40 text-xs mt-1">{h.autoOnDesc}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/60 font-black text-sm">{h.autoOff}</p>
            <p className="text-white/40 text-xs mt-1">{h.autoOffDesc}</p>
          </div>
        </div>
      </motion.div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-3xl p-6 text-center space-y-4"
        style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}>
        <div className="text-4xl">🐝</div>
        <h2 className="text-xl font-black text-white">{h.ctaTitle}</h2>
        <p className="text-white/50 text-sm">{h.ctaDesc}</p>
        <button
          onClick={() => router.push("/dashboard/levels")}
          className="px-8 py-3 rounded-2xl font-black text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #F5A623, #FF8C00)" }}
        >
          {h.ctaBtn}
        </button>
      </motion.div>
    </div>
  );
}
