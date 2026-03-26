"use client";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatDAI, shortAddress } from "@/lib/formatters";
import { LEVEL_COLORS } from "@/lib/constants";
import { useT } from "@/lib/i18n/LanguageContext";
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";
import { getPayments, type Payment } from "@/lib/paymentsCache";

export default function PaymentsPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter]       = useState<"all" | "income" | "expense">("all");
  const { t } = useT();

  useEffect(() => {
    if (!address || !publicClient) return;
    setIsLoading(true);
    setIsSyncing(false);

    getPayments(address.toLowerCase(), publicClient as any, (fresh) => {
      setPayments(fresh);
      setIsSyncing(false);
    })
      .then((cached) => {
        setPayments(cached);
        setIsLoading(false);
        // If no cached data — blockchain scan is running in background
        if (cached.length === 0) setIsSyncing(true);
      })
      .catch(() => { setIsLoading(false); setIsSyncing(false); });
  }, [address, publicClient]);

  const filtered     = filter === "all" ? payments : payments.filter((p) => p.type === filter);
  const totalIncome  = payments.filter((p) => p.type === "income").reduce((s, p) => s + p.amount, 0n);
  const totalExpense = payments.filter((p) => p.type === "expense").reduce((s, p) => s + p.amount, 0n);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.payments.title}</h1>
        <p className="text-white/40 text-sm mt-1">{t.payments.subtitle}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-navy rounded-2xl p-4 border border-bee-green/20">
          <p className="text-white/40 text-sm">{t.payments.received}</p>
          <p className="text-2xl font-bold text-bee-green mt-1">+{formatDAI(totalIncome)}</p>
        </div>
        <div className="bg-navy rounded-2xl p-4 border border-white/10">
          <p className="text-white/40 text-sm">{t.payments.spent}</p>
          <p className="text-2xl font-bold text-white/70 mt-1">−{formatDAI(totalExpense)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "income", "expense"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              filter === f ? "text-white font-bold" : "bg-white/10 text-white/60 hover:bg-white/20"
            )}
            style={filter === f ? { background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623" } : undefined}
          >
            {{ all: t.payments.all, income: t.payments.income, expense: t.payments.expense }[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : filtered.length === 0 ? (
        isSyncing ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-gold" />
            <p className="text-white/40 text-sm">Синхронизация с блокчейном…</p>
          </div>
        ) : (
          <div className="text-center py-12 text-white/30">
            <div className="text-4xl mb-3">📭</div>
            <p>{t.payments.empty}</p>
          </div>
        )
      ) : (
        <div className="bg-navy rounded-2xl border border-white/10 overflow-hidden">
          {filtered.map((p, i) => {
            const color = LEVEL_COLORS[p.level] ?? "#F5A623";
            return (
              <div
                key={`${p.txHash}-${i}`}
                className={clsx("flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors", i > 0 && "border-t border-white/5")}
              >
                <div className={clsx(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                  p.type === "income" ? "bg-bee-green/20" : "bg-white/10"
                )}>
                  {p.type === "income"
                    ? <ArrowDownLeft className="w-4 h-4 text-bee-green" />
                    : <ArrowUpRight className="w-4 h-4 text-white/50" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color, backgroundColor: color + "22" }}>
                      H{p.level}
                    </span>
                    <span className="text-white/60 text-sm truncate">
                      {p.type === "income" ? `${t.payments.from} ${shortAddress(p.from)}` : t.payments.buyHive}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={clsx("font-bold text-sm", p.type === "income" ? "text-bee-green" : "text-white/60")}>
                    {p.type === "income" ? "+" : "−"}{formatDAI(p.amount)}
                  </p>
                  <a
                    href={`https://polygonscan.com/tx/${p.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/20 text-xs hover:text-white/50 transition-colors"
                  >
                    {p.txHash.slice(0, 8)}…
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
