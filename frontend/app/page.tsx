"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { usePrivyAuth } from "@/components/providers/PrivyContext";
import { HIVE_PRICES_DAI, LEVEL_COLORS } from "@/lib/constants";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const STEPS = [
  { n: "01", title: "Connect Wallet",    desc: "MetaMask on Polygon. 30 seconds." },
  { n: "02", title: "Register",          desc: "Use a referral link and join the swarm." },
  { n: "03", title: "Buy First Hive",    desc: "H1 is only 5 DAI — start in one click." },
  { n: "04", title: "Earn DAI",          desc: "Slots fill up → payouts automatically." },
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
  const { address, isConnected, status } = useAccount();
  const { loginWithTelegram, error: privyError } = usePrivyAuth();
  const [hydrated, setHydrated] = useState(false);
  const [isTg, setIsTg] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Detect Telegram
  useEffect(() => {
    if (!hydrated) return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initData || tg?.initDataUnsafe?.user) {
      setIsTg(true);
    }
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && status === "connected" && address) {
      router.push("/dashboard");
    }
  }, [hydrated, status, address]);

  // Telegram fullscreen state
  if (isTg && !isConnected) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 text-white px-6">
        <div className="text-6xl">🐝</div>
        <div className="text-center">
          <p className="text-white font-black text-2xl mb-1">Meta Bee Hive</p>
          <p className="text-white/40 text-sm">Decentralized S4 Matrix</p>
        </div>
        {privyError && (
          <p className="text-red-400 text-xs text-center bg-red-500/10 rounded-xl px-4 py-2 max-w-xs">
            {privyError}
          </p>
        )}
        {isLoggingIn ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <p className="text-white/40 text-sm">Подключаем кошелёк...</p>
          </div>
        ) : (
        <button
          onClick={async () => {
            setIsLoggingIn(true);
            try { await loginWithTelegram(); } catch { /* shown via toast */ } finally { setIsLoggingIn(false); }
          }}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold w-full max-w-xs justify-center"
          style={{ background: "#2AABEE", color: "#fff", boxShadow: "0 0 24px rgba(42,171,238,0.35)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
          </svg>
          Войти через Telegram
        </button>
        )}
      </div>
    );
  }

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
            Powered by Polygon · DAI
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 leading-[1.05]">
            <span className="text-white">META </span>
            <span className="shimmer-text">BEE</span>
            <br />
            <span className="text-white/60 text-3xl md:text-4xl font-bold">HIVE</span>
          </h1>

          <p className="text-white/50 text-lg md:text-xl mb-3 max-w-md mx-auto leading-relaxed">
            Decentralized S4 Matrix
          </p>
          <p className="text-white/25 text-sm mb-10">
            Transparent payouts · No admin · Open-source smart contract
          </p>

          <ConnectButton />

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-white/25">
            <span>✦ No hidden fees</span>
            <span>✦ DAI stablecoin only</span>
            <span>✦ Auto-payouts to wallet</span>
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
          <h2 className="text-3xl font-black text-white mb-3">How It Works</h2>
          <p className="text-white/35 text-sm">4 steps to your first DAI</p>
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
          <h2 className="text-3xl font-black text-white mb-3">10 Hive Levels</h2>
          <p className="text-white/35 text-sm">Each next level ×1.8 — higher potential</p>
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
            <h2 className="text-3xl font-black text-white mb-3">S4 Matrix</h2>
            <p className="text-white/35 text-sm">4 slots — simple mechanics</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              { icon: "🐝", label: "Slots 1–3 of 4", desc: "3 out of 4 slots go to you. 10% fee per payment — the rest goes straight to your wallet.", color: "#F5A623" },
              { icon: "♻️", label: "Slot 4",    desc: "Cycle complete — level restarts, you're back in the matrix", color: "#7C4DFF" },
              { icon: "⬆️", label: "Overflow",  desc: "No level at referrer — payment flows up the chain to the upline", color: "#4C8FFF" },
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
            Join the <span className="shimmer-text">Swarm</span>
          </h2>
          <p className="text-white/35 mb-8">Polygon · DAI · 5 DAI to start</p>
          <ConnectButton />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-white/15 text-xs border-t border-white/5">
        META BEE HIVE · Smart contract on Polygon · No admin
      </footer>
    </div>
  );
}
