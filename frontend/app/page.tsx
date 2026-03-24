"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { HIVE_PRICES_DAI, LEVEL_COLORS } from "@/lib/constants";
import { motion } from "framer-motion";

const STEPS = [
  { n: "01", title: "Подключи кошелёк",   desc: "MetaMask на Polygon. 30 секунд." },
  { n: "02", title: "Зарегистрируйся",     desc: "Введи реф-ссылку и войди в рой." },
  { n: "03", title: "Купи первый Hive",    desc: "H1 всего 5 DAI — старт в один клик." },
  { n: "04", title: "Получай DAI",         desc: "Слоты заполняются → выплаты автоматически." },
];

function OrbitalPreview({ color, slots }: { color: string; slots: number }) {
  const size = 100;
  const cx = size / 2; const cy = size / 2;
  const angles = [270, 30, 150, 210];
  const orbitR = 34; const dotR = 6; const coreR = 12;
  const pts = angles.map((d) => ({
    x: cx + orbitR * Math.cos((d * Math.PI) / 180),
    y: cy + orbitR * Math.sin((d * Math.PI) / 180),
  }));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="3 4" />
      <defs>
        <radialGradient id={`cg-${color.replace("#","")}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={coreR} fill={`url(#cg-${color.replace("#","")})`} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={dotR}
          fill={i < slots ? color + "40" : "transparent"}
          stroke={i < slots ? color : "rgba(255,255,255,0.15)"}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) router.push("/dashboard");
  }, [isConnected, address]);

  return (
    <div className="min-h-screen bg-bg text-white overflow-x-hidden">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 py-24">
        {/* Backgrounds */}
        <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gold pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue/8 blur-[100px] rounded-full pointer-events-none" />

        {/* Floating bees */}
        <div className="absolute top-20 left-[8%] text-2xl opacity-20 animate-float" style={{ animationDelay: "0s" }}>🐝</div>
        <div className="absolute top-[35%] right-[6%] text-xl opacity-15 animate-float" style={{ animationDelay: "1.2s" }}>🐝</div>
        <div className="absolute bottom-[28%] left-[12%] text-lg opacity-10 animate-float" style={{ animationDelay: "2.1s" }}>🐝</div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Работает на Polygon · DAI
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 leading-[1.05]">
            <span className="text-white">BEE</span>
            <span className="shimmer-text">HIVE</span>
            <br />
            <span className="text-white/60 text-3xl md:text-4xl font-bold">SYSTEM</span>
          </h1>

          <p className="text-white/50 text-lg md:text-xl mb-3 max-w-md mx-auto leading-relaxed">
            Децентрализованная матрица S4
          </p>
          <p className="text-white/25 text-sm mb-10">
            Прозрачные выплаты · Без администратора · Смарт-контракт с открытым кодом
          </p>

          <ConnectButton />

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-white/25">
            <span>✦ Без скрытых комиссий</span>
            <span>✦ Только DAI стейблкоин</span>
            <span>✦ Авто-выплаты на кошелёк</span>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-black text-white mb-3">Как это работает</h2>
          <p className="text-white/35 text-sm">4 шага до первых DAI</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: "rgba(16,16,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-3xl font-black" style={{ color: "rgba(245,166,35,0.25)" }}>{s.n}</span>
              <p className="font-bold text-white text-sm">{s.title}</p>
              <p className="text-white/35 text-xs leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Levels grid ────────────────────────────────────────── */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-black text-white mb-3">10 уровней Hive</h2>
          <p className="text-white/35 text-sm">Каждый следующий × 1.8 — и потенциал выше</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {HIVE_PRICES_DAI.map((price, i) => {
            const level  = i + 1;
            const color  = LEVEL_COLORS[level] ?? "#F5A623";
            const income = +(price * 3 * 0.9).toFixed(1);
            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl p-4 flex flex-col items-center gap-3 text-center"
                style={{
                  background: "rgba(16,16,30,0.7)",
                  border: `1px solid ${color}20`,
                  boxShadow: `0 0 20px ${color}08`,
                }}
              >
                <OrbitalPreview color={color} slots={2} />
                <div>
                  <p className="font-black text-sm" style={{ color }}>H{level}</p>
                  <p className="text-white/50 text-xs mt-0.5">{price} DAI</p>
                  <p className="text-xs mt-1" style={{ color: "#27AE60" }}>+{income} DAI</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Matrix mechanic ────────────────────────────────────── */}
      <section className="py-24 px-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl overflow-hidden"
          style={{ background: "rgba(16,16,30,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="px-8 py-10 text-center border-b border-white/5">
            <h2 className="text-3xl font-black text-white mb-3">Матрица S4</h2>
            <p className="text-white/35 text-sm">4 слота — понятная механика</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              { icon: "🐝", label: "Слоты 1–3 из 4", desc: "3 слота из 4 идут тебе. С каждого платежа 10% берёт система — остальное автоматически на кошелёк.", color: "#F5A623" },
              { icon: "♻️", label: "Слот 4",    desc: "Цикл завершён — уровень перезапускается, ты снова в матрице", color: "#7C4DFF" },
              { icon: "⬆️", label: "Переливы",  desc: "Нет уровня у реферера — выплата идёт наставнику вверх по цепи", color: "#4C8FFF" },
            ].map((item, i) => (
              <div key={i} className={`px-6 py-8 text-center ${i < 2 ? "md:border-r border-white/5" : ""}`}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <p className="font-bold text-sm mb-2" style={{ color: item.color }}>{item.label}</p>
                <p className="text-white/35 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto"
        >
          <div className="text-5xl mb-6 animate-float">🍯</div>
          <h2 className="text-4xl font-black text-white mb-3">
            Войди в <span className="shimmer-text">рой</span>
          </h2>
          <p className="text-white/35 mb-8">Polygon · DAI · 5 DAI для старта</p>
          <ConnectButton />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-white/15 text-xs border-t border-white/5">
        BEE HIVE SYSTEM · Смарт-контракт на Polygon · Без администратора
      </footer>
    </div>
  );
}
