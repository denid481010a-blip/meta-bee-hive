import { formatUnits } from "viem";

/** 0x1234...5678 */
export function shortAddress(addr?: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** BigInt wei → "4.50 DAI" */
export function formatDAI(wei: bigint | undefined, decimals = 2): string {
  if (wei === undefined) return "—";
  return `${Number(formatUnits(wei, 18)).toFixed(decimals)} DAI`;
}

/** BigInt wei → число */
export function toDAI(wei: bigint | undefined): number {
  if (wei === undefined) return 0;
  return Number(formatUnits(wei, 18));
}

/** Unix timestamp → читаемая дата */
export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Число с разделителями: 1000 → "1 000" */
export function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}
