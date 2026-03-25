"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HIVE_PRICES_DAI } from "@/lib/constants";

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
      {/* Core */}
      <circle cx={cx} cy={cy} r={18} fill="rgba(245,166,35,0.15)" stroke="rgba(245,166,35,0.4)" strokeWidth="1.5" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#F5A623" fontSize="10" fontWeight="900">YOU</text>
    </svg>
  );
}

// ── Flow arrow ────────────────────────────────────────────────────────────────
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

// ── Income example card ───────────────────────────────────────────────────────
function IncomeCard({ level, price, color }: { level: number; price: number; color: string }) {
  const perSlot = +(price * 0.9).toFixed(2);
  const perCycle = +(price * 3 * 0.9).toFixed(2);
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: color + "0D", border: `1px solid ${color}25` }}>
      <p className="font-black text-sm" style={{ color }}>Hive {level}</p>
      <p className="text-white/40 text-xs">Вход: {price} DAI</p>
      <div className="flex justify-between text-xs mt-1">
        <div>
          <p className="text-white/30">За слот</p>
          <p className="font-bold text-white">+{perSlot} DAI</p>
        </div>
        <div className="text-right">
          <p className="text-white/30">За цикл × 3</p>
          <p className="font-bold" style={{ color }}>+{perCycle} DAI</p>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white">Как это работает</h1>
        <p className="text-white/40 text-sm mt-1">Простое объяснение системы META BEE HIVE</p>
      </motion.div>

      {/* ── Блок 1: Суть ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
        <h2 className="text-lg font-black text-white">🍯 Суть за 1 минуту</h2>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "rgba(39,174,96,0.12)", border: "1px solid rgba(39,174,96,0.25)", color: "#27AE60", width: "fit-content" }}>
          💵 1 DAI = 1$
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          META BEE HIVE — это <span className="text-gold font-bold">децентрализованная матрица S4</span> на блокчейне Polygon.
          Ты покупаешь улий (уровень), получаешь 4 слота. Когда другие участники попадают в твой улий — ты автоматически получаешь DAI прямо на кошелёк MetaMask. Никаких администраторов, всё работает через смарт-контракт.
        </p>
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl text-xs"
          style={{ background: "rgba(76,143,255,0.08)", border: "1px solid rgba(76,143,255,0.2)" }}>
          <span className="text-xl flex-shrink-0">🔐</span>
          <p className="text-white/60 leading-relaxed">
            <span className="text-white font-bold">Приложение не имеет доступа к твоему кошельку.</span>{" "}
            Оно не может снять твои деньги. Все выплаты идут напрямую через смарт-контракт — без посредников и без возможности заблокировать средства.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          {[
            { icon: "⚡", label: "Мгновенные выплаты", sub: "Сразу на кошелёк" },
            { icon: "🔒", label: "Смарт-контракт", sub: "Код открытый" },
            { icon: "♾️", label: "Без ограничений", sub: "Цикл повторяется" },
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
        <h2 className="text-lg font-black text-white">🐝 Матрица S4 — 4 слота</h2>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <MatrixDiagram filledSlots={2} />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                style={{ background: "rgba(245,166,35,0.2)", color: "#F5A623" }}>S1</div>
              <div>
                <p className="text-white text-sm font-bold">Слоты 1, 2, 3 → тебе</p>
                <p className="text-white/40 text-xs">90% от цены уровня приходит на твой кошелёк</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                style={{ background: "rgba(39,174,96,0.2)", color: "#27AE60" }}>S4</div>
              <div>
                <p className="text-white text-sm font-bold">Слот 4 → наставнику + перезапуск</p>
                <p className="text-white/40 text-xs">4-й платёж идёт твоему рефереру, матрица сбрасывается и начинается заново</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                style={{ background: "rgba(76,143,255,0.2)", color: "#4C8FFF" }}>10%</div>
              <div>
                <p className="text-white text-sm font-bold">10% — комиссия системы</p>
                <p className="text-white/40 text-xs">Со всех выплат автоматически удерживается 10%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Animated slots example */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-white/50 text-xs uppercase tracking-widest">Пример: Hive 1 = 5 DAI</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { slot: 1, amount: "4.5", color: "#F5A623", label: "→ тебе" },
              { slot: 2, amount: "4.5", color: "#F5A623", label: "→ тебе" },
              { slot: 3, amount: "4.5", color: "#F5A623", label: "→ тебе" },
              { slot: 4, amount: "4.5", color: "#27AE60", label: "→ вверх" },
            ].map((s) => (
              <div key={s.slot} className="rounded-xl p-2 text-center"
                style={{ background: s.color + "12", border: `1px solid ${s.color}30` }}>
                <p className="text-[10px] text-white/40">Слот {s.slot}</p>
                <p className="font-black text-sm" style={{ color: s.color }}>{s.amount}</p>
                <p className="text-[10px]" style={{ color: s.color }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <span className="text-white/40">Итого за цикл (3 слота)</span>
            <span className="font-black text-gold">+13.5 DAI</span>
          </div>
        </div>
      </motion.div>

      {/* ── Блок 3: Шаги ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-lg font-black text-white">📋 Как начать зарабатывать</h2>
        <div className="space-y-4">
          <FlowStep n="1" title="Зарегистрируйся" desc="Одна бесплатная транзакция. Нужен только POL для газа (~0.01$)" />
          <FlowStep n="2" title="Купи Hive 1 за 5 DAI" desc="Твоя первая матрица активирована. 4 слота ждут участников." color="#27AE60" />
          <FlowStep n="3" title="Пригласи людей по реф-ссылке" desc="Каждый кто зарегистрируется через тебя — попадёт в твою матрицу" color="#4C8FFF" />
          <FlowStep n="4" title="Получай выплаты автоматически" desc="Как только слот заполняется — DAI приходит сразу на кошелёк. Без кнопок, без ожидания." color="#7C4DFF" />
          <FlowStep n="5" title="Покупай следующие уровни" desc="Больше уровней = больше параллельных матриц = больше выплат" color="#F5A623" />
        </div>
      </motion.div>

      {/* ── Блок 4: Доход по уровням ────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-lg font-black text-white">💰 Потенциал по уровням</h2>
        <p className="text-white/40 text-xs">Доход за 1 цикл (3 заполненных слота × 90%)</p>
        <div className="grid grid-cols-2 gap-3">
          {HIVE_PRICES_DAI.slice(0, 6).map((price, i) => (
            <IncomeCard key={i} level={i + 1} price={price} color={i < 3 ? "#F5A623" : "#4C8FFF"} />
          ))}
        </div>
        <div className="rounded-2xl p-4 text-center"
          style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}>
          <p className="text-white/50 text-xs mb-1">Если активны все 10 уровней — потенциал за цикл</p>
          <p className="text-3xl font-black text-gold">
            +{HIVE_PRICES_DAI.reduce((sum, p) => sum + p * 3 * 0.9, 0).toFixed(0)} DAI
          </p>
        </div>
      </motion.div>

      {/* ── Блок 5: Рефералы и переливы ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-lg font-black text-white">🔗 Рефералы и переливы</h2>

        {/* Ref tree visual */}
        <div className="rounded-2xl p-4 space-y-1" style={{ background: "rgba(255,255,255,0.03)" }}>
          {/* YOU */}
          <div className="flex justify-center">
            <div className="rounded-full px-5 py-2 text-xs font-black flex items-center gap-2"
              style={{ background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.5)", color: "#F5A623" }}>
              ТЫ 💰
            </div>
          </div>
          {/* arrow up from lvl1 */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-0">
              <span className="text-[10px] font-bold" style={{ color: "#27AE60" }}>+DAI</span>
              <span className="text-base leading-none" style={{ color: "#27AE60" }}>↑</span>
            </div>
          </div>
          {/* Level 1 refs */}
          <div className="flex justify-center gap-4">
            {[
              { name: "Петя", dai: "4.5" },
              { name: "Маша", dai: "4.5" },
              { name: "Саша", dai: "4.5" },
            ].map((r, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60A5FA" }}>
                  {r.name}
                </div>
                <span className="text-[9px] font-bold" style={{ color: "#27AE60" }}>цикл → +{r.dai} DAI</span>
              </div>
            ))}
          </div>
          {/* arrow up from lvl2 */}
          <div className="flex justify-center mt-1">
            <div className="flex flex-col items-center gap-0">
              <span className="text-[10px] font-bold" style={{ color: "#A78BFA" }}>+DAI</span>
              <span className="text-base leading-none" style={{ color: "#A78BFA" }}>↑</span>
            </div>
          </div>
          {/* Level 2 refs */}
          <div className="flex justify-center gap-2">
            {[
              { name: "Игорь", dai: "4.5" },
              { name: "Лена", dai: "4.5" },
              { name: "Дима", dai: "4.5" },
              { name: "Оля", dai: "4.5" },
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
          <p className="text-center text-white/30 text-[10px] pt-2">Когда у рефералов закрывается цикл — DAI идёт прямо тебе</p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex gap-3 items-start">
            <span className="text-lg flex-shrink-0">⬆️</span>
            <div>
              <p className="text-white font-bold">Переливы идут тебе</p>
              <p className="text-white/40 text-xs">Если у твоего реферала нет нужного уровня — его платёж идёт тебе (или выше по цепочке)</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg flex-shrink-0">♾️</span>
            <div>
              <p className="text-white font-bold">Матрица бесконечна</p>
              <p className="text-white/40 text-xs">После 4-го слота уровень перезапускается — ты снова в очереди и снова получаешь выплаты</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Блок 6: Автопокупка ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-3xl p-6 space-y-4"
        style={{ background: "rgba(39,174,96,0.06)", border: "1px solid rgba(39,174,96,0.15)" }}>
        <h2 className="text-lg font-black text-white">⚡ Что такое Автопокупка</h2>
        <p className="text-white/70 text-sm leading-relaxed">
          Когда автопокупка <span className="text-bee-green font-bold">включена</span> — вместо того чтобы выплачивать тебе DAI на кошелёк, система накапливает их внутри. Когда накопится достаточно — <span className="text-bee-green font-bold">автоматически покупает следующий уровень</span>.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.2)" }}>
            <p className="text-bee-green font-black text-sm">✓ Включена</p>
            <p className="text-white/40 text-xs mt-1">Выплаты копятся → автоматически покупается следующий Hive</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/60 font-black text-sm">✗ Выключена</p>
            <p className="text-white/40 text-xs mt-1">Все выплаты идут сразу на твой кошелёк</p>
          </div>
        </div>
      </motion.div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-3xl p-6 text-center space-y-4"
        style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}>
        <div className="text-4xl">🐝</div>
        <h2 className="text-xl font-black text-white">Готов начать?</h2>
        <p className="text-white/50 text-sm">Перейди во вкладку <span className="text-gold font-bold">Уровни улиев</span> и активируй Hive 1 за 5 DAI</p>
        <button
          onClick={() => router.push("/dashboard/levels")}
          className="px-8 py-3 rounded-2xl font-black text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #F5A623, #FF8C00)" }}
        >
          Купить Hive 1 — 5 DAI
        </button>
      </motion.div>
    </div>
  );
}
