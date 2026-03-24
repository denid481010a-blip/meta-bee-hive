"use client";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatDAI, shortAddress, formatDate } from "@/lib/formatters";
import { LEVEL_COLORS, CONTRACT_ADDRESS, DEPLOY_BLOCK } from "@/lib/constants";
import { BHS_ABI } from "@/lib/contract";
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";
import { formatUnits } from "viem";

interface Payment {
  type:      "income" | "expense";
  level:     number;
  amount:    bigint;
  from:      string;
  to:        string;
  txHash:    string;
  blockNumber: bigint;
}

export default function PaymentsPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    if (!address || !publicClient) return;
    setIsLoading(true);

    Promise.all([
      // Входящие: PaymentSent where to = address
      publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: BHS_ABI.find((e) => e.name === "PaymentSent") as any,
        args: { to: address },
        fromBlock: DEPLOY_BLOCK,
        toBlock: "latest",
      }),
      // Расходы: HiveBought where user = address
      publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: BHS_ABI.find((e) => e.name === "HiveBought") as any,
        args: { user: address },
        fromBlock: DEPLOY_BLOCK,
        toBlock: "latest",
      }),
    ]).then(([incomeLogs, expenseLogs]) => {
      const income: Payment[] = incomeLogs.map((log: any) => ({
        type: "income",
        level: Number(log.args.level),
        amount: log.args.amount,
        from: log.args.from,
        to: log.args.to,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }));

      const expenses: Payment[] = expenseLogs.map((log: any) => ({
        type: "expense",
        level: Number(log.args.level),
        amount: log.args.price,
        from: address,
        to: CONTRACT_ADDRESS,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }));

      const all = [...income, ...expenses].sort((a, b) =>
        Number(b.blockNumber - a.blockNumber)
      );
      setPayments(all);
    }).catch(() => setPayments([]))
      .finally(() => setIsLoading(false));
  }, [address, publicClient]);

  const filtered = filter === "all" ? payments : payments.filter((p) => p.type === filter);

  const totalIncome  = payments.filter((p) => p.type === "income").reduce((s, p) => s + p.amount, 0n);
  const totalExpense = payments.filter((p) => p.type === "expense").reduce((s, p) => s + p.amount, 0n);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">История платежей</h1>
        <p className="text-white/40 text-sm mt-1">Все транзакции по твоему адресу</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-navy rounded-2xl p-4 border border-bee-green/20">
          <p className="text-white/40 text-sm">Получено</p>
          <p className="text-2xl font-bold text-bee-green mt-1">+{formatDAI(totalIncome)}</p>
        </div>
        <div className="bg-navy rounded-2xl p-4 border border-white/10">
          <p className="text-white/40 text-sm">Потрачено</p>
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
            {{ all: "Все", income: "Доходы", expense: "Расходы" }[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <div className="text-4xl mb-3">📭</div>
          <p>Транзакций пока нет</p>
        </div>
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
                      {p.type === "income" ? `от ${shortAddress(p.from as any)}` : `покупка улья`}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={clsx("font-bold text-sm", p.type === "income" ? "text-bee-green" : "text-white/60")}>
                    {p.type === "income" ? "+" : "−"}{formatDAI(p.amount)}
                  </p>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${p.txHash}`}
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
