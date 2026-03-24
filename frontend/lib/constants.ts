// ── Адреса контрактов ──────────────────────────────────────────────────────
export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export const DAI_ADDRESS = (
  process.env.NEXT_PUBLIC_DAI_ADDRESS ??
  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" // DAI on Polygon mainnet
) as `0x${string}`;

// ── Сеть ──────────────────────────────────────────────────────────────────
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 137); // Polygon

// ── Уровни ────────────────────────────────────────────────────────────────
export const MAX_LEVEL = 10;

// Цены уровней: H1=5 DAI, H(n) = H(n-1) * 9/5  (в DAI)
export const HIVE_PRICES_DAI: number[] = (() => {
  const prices = [5];
  for (let i = 1; i < MAX_LEVEL; i++) {
    prices.push(Math.round((prices[i - 1] * 9) / 5 * 100) / 100);
  }
  return prices;
})();

// Цены в BigInt wei (18 decimals)
import { parseUnits } from "viem";
export const HIVE_PRICES_WEI: bigint[] = HIVE_PRICES_DAI.map(
  (p) => parseUnits(p.toString(), 18)
);

// ── Титулы ────────────────────────────────────────────────────────────────
export const TITLES = [
  { id: "worker",   label: "Рабочая пчела",   condition: "1 реферал",          min: 1   },
  { id: "builder",  label: "Строитель ульев",  condition: "Hive 3 активен",     min: 0   },
  { id: "swarm",    label: "Пчелиный рой",     condition: "10 пчёл в команде",  min: 10  },
  { id: "harvest",  label: "Медосборщик",      condition: "1 цикл завершён",    min: 0   },
  { id: "master",   label: "Мастер улья",      condition: "10 циклов",          min: 0   },
  { id: "queen",    label: "Королева улья",    condition: "Все 10 Hive активны", min: 0  },
  { id: "legend",   label: "Легенда роя",      condition: "100 пчёл в команде", min: 100 },
] as const;

// ── Ачивки ────────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: "first_hive",    label: "Первый улей",      desc: "Купил Hive 1",              icon: "🐝" },
  { id: "first_ref",     label: "Первая пчела",     desc: "Пригласил первого реферала", icon: "🔗" },
  { id: "first_cycle",   label: "Первый медосбор",  desc: "Завершил первый цикл",       icon: "🍯" },
  { id: "hive5",         label: "Полуульей",        desc: "Активировал Hive 5",         icon: "⭐" },
  { id: "hive10",        label: "Король улья",      desc: "Все 10 уровней активны",     icon: "👑" },
  { id: "team10",        label: "Рой",              desc: "10 человек в команде",        icon: "🐝" },
  { id: "team100",       label: "Мега-рой",         desc: "100 человек в команде",       icon: "🔥" },
  { id: "earned100",     label: "Первая сотня",     desc: "Заработал 100 DAI",          icon: "💰" },
  { id: "earned1000",    label: "Тысячник",         desc: "Заработал 1000 DAI",         icon: "💎" },
  { id: "cycles10",      label: "Ветеран",          desc: "10 завершённых циклов",      icon: "🔄" },
] as const;

// ── Цвета уровней ─────────────────────────────────────────────────────────
// Используем только 3 цвета: жёлтый, зелёный (нечётные/чётные), белый для текста
export const LEVEL_COLORS: Record<number, string> = {
  1:  "#F5A623",
  2:  "#F5A623",
  3:  "#F5A623",
  4:  "#F5A623",
  5:  "#F5A623",
  6:  "#F5A623",
  7:  "#F5A623",
  8:  "#F5A623",
  9:  "#F5A623",
  10: "#F5A623",
};

// ── Блок деплоя контракта (Polygon Amoy) ──────────────────────────────────
export const DEPLOY_BLOCK = 35611130n;

// ── Backend API ───────────────────────────────────────────────────────────
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api";
