"use client";
import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useSendTransaction as useWagmiSend } from "wagmi";
import { useWallets } from "@privy-io/react-auth";
import { usePrivyAuth } from "@/components/providers/PrivyContext";
// usePrivyAuth used in SwapPanel for address; useWallets for direct provider access
import { parseEther, parseUnits, formatUnits, encodeFunctionData, isAddress, maxUint256 } from "viem";
import { Loader2, ArrowDown, RefreshCw, Send, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import toast from "react-hot-toast";
import { useT } from "@/lib/i18n/LanguageContext";

// Token addresses on Polygon
const TOKENS = {
  POL:  { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18, symbol: "POL",  label: "POL (Polygon)" },
  DAI:  { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", decimals: 18, symbol: "DAI",  label: "DAI" },
  USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals:  6, symbol: "USDT", label: "USDT" },
  USDC: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals:  6, symbol: "USDC", label: "USDC" },
} as const;

type TokenKey = keyof typeof TOKENS;

const PAIRS: { sell: TokenKey; buy: TokenKey; label: string }[] = [
  { sell: "POL",  buy: "DAI",  label: "POL → DAI"  },
  { sell: "USDT", buy: "DAI",  label: "USDT → DAI" },
  { sell: "USDC", buy: "DAI",  label: "USDC → DAI" },
  { sell: "DAI",  buy: "USDT", label: "DAI → USDT" },
];

const ERC20_TRANSFER_ABI = [{
  name: "transfer",
  type: "function" as const,
  inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
  outputs: [{ name: "", type: "bool" }],
  stateMutability: "nonpayable" as const,
}];

const ERC20_ABI = [
  {
    name: "allowance",
    type: "function" as const,
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    name: "approve",
    type: "function" as const,
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable" as const,
  },
];

interface Quote {
  buyAmount:        string;
  sellAmount?:      string;
  allowanceTarget?: string;
  issues?:          { allowance?: { actual: string; spender: string } | null } | null;
  transaction:      { to: string; data: string; value: string };
  price?:           string;
}

// ── Universal send hook — works with both Privy embedded and external wallets ──
function useUniversalSend() {
  const { sendTransactionAsync: wagmiSend } = useWagmiSend();
  const { wallets } = useWallets();
  const { address } = useAccount();

  return useCallback(async (to: string, data: string, value: bigint = 0n): Promise<string> => {
    const embeddedWallet = wallets.find(w => w.walletClientType === "privy");
    const externalWallet = wallets.find(w => w.walletClientType !== "privy");

    if (externalWallet) {
      // MetaMask / WalletConnect — use wagmi
      return wagmiSend({ to: to as `0x${string}`, data: data as `0x${string}`, value });
    }

    if (embeddedWallet) {
      // Privy embedded wallet — use provider directly (no confirmation modal)
      const provider = await embeddedWallet.getEthereumProvider();
      const hash = await provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to,
          data,
          value: "0x" + value.toString(16),
        }],
      });
      return hash as string;
    }

    throw new Error("No wallet connected");
  }, [wallets, address, wagmiSend]);
}

// ── Send DAI panel ────────────────────────────────────────────────────────────
function SendPanel() {
  const sendTx = useUniversalSend();
  const { t } = useT();
  const [token, setToken]     = useState<"DAI" | "USDT" | "USDC">("DAI");
  const [to, setTo]           = useState("");
  const [amount, setAmount]   = useState("");
  const [sending, setSending] = useState(false);

  const tokInfo = TOKENS[token];
  const toValid = to.length > 0 && isAddress(to);
  const amtValid = parseFloat(amount) > 0;
  const canSend = toValid && amtValid && !sending;

  async function send() {
    if (!canSend) return;
    setSending(true);
    try {
      const value = parseUnits(amount as `${number}`, tokInfo.decimals);
      const data  = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [to as `0x${string}`, value],
      });
      await sendTx(tokInfo.address, data, 0n);
      toast.success(`${amount} ${token} 🐝`);
      setTo("");
      setAmount("");
    } catch (e: any) {
      if (e?.message !== "cancelled") toast.error(t.swap.txCancelled);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-4 h-4 text-gold" />
        <p className="text-white font-bold text-sm">{t.swap.sendTitle}</p>
      </div>

      {/* Token selector */}
      <div className="flex gap-2 mb-4">
        {(["DAI", "USDT", "USDC"] as const).map((tk) => (
          <button
            key={tk}
            onClick={() => setToken(tk)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={
              token === tk
                ? { background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.4)", color: "#F5A623" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
            }
          >
            {tk}
          </button>
        ))}
      </div>

      {/* Recipient */}
      <div className="mb-3">
        <p className="text-white/40 text-xs mb-1.5">{t.swap.recipient}</p>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value.trim())}
          placeholder="0x..."
          className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${to.length > 0 ? (toValid ? "rgba(39,174,96,0.4)" : "rgba(229,57,57,0.4)") : "rgba(255,255,255,0.08)"}`,
            color: "#fff",
          }}
        />
        {to.length > 0 && !toValid && (
          <p className="text-red-400 text-xs mt-1">{t.swap.invalidAddress}</p>
        )}
      </div>

      {/* Amount */}
      <div className="mb-4">
        <p className="text-white/40 text-xs mb-1.5">{t.swap.amount} ({token})</p>
        <input
          type="number"
          min="0.01"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-xl px-4 py-3 text-xl font-bold outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
          }}
        />
      </div>

      <button
        onClick={send}
        disabled={!canSend}
        className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
        style={{
          background: canSend ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.05)",
          border: canSend ? "1px solid rgba(245,166,35,0.4)" : "1px solid rgba(255,255,255,0.08)",
          color: canSend ? "#F5A623" : "rgba(255,255,255,0.3)",
        }}
      >
        {sending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.swap.sending}</>
          : <><Send className="w-4 h-4" /> {t.swap.tabSend} {amount || ""} {token}</>}
      </button>

      <p className="text-white/20 text-xs text-center mt-3">{t.swap.sendFooter}</p>
    </Card>
  );
}

// ── Swap panel ────────────────────────────────────────────────────────────────
function SwapPanel() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const sendTx = useUniversalSend();
  const { t } = useT();

  const [pairIdx, setPairIdx] = useState(0);
  const [amount, setAmount]   = useState("10");
  const [quote, setQuote]     = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const pair    = PAIRS[pairIdx];
  const sellTok = TOKENS[pair.sell];
  const buyTok  = TOKENS[pair.buy];

  const fetchQuote = useCallback(async () => {
    if (!address || !amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setQuote(null);
    try {
      const sellAmount = pair.sell === "POL"
        ? parseEther(amount as `${number}`).toString()
        : parseUnits(amount as `${number}`, sellTok.decimals).toString();

      const params = new URLSearchParams({ sellToken: sellTok.address, buyToken: buyTok.address, sellAmount, taker: address });
      const res    = await fetch(`/api/swap-quote?${params}`);
      const data   = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t.swap.rateFailed);
      setQuote(data);
    } catch (e: any) {
      toast.error(e?.message ?? t.swap.rateFailed);
    } finally {
      setLoading(false);
    }
  }, [address, amount, pair, sellTok, buyTok, t]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 700);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  useEffect(() => { setQuote(null); setAmount("10"); }, [pairIdx]);

  async function swap() {
    if (!quote?.transaction || !address) return;
    setSwapping(true);
    try {
      const isNative = sellTok.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      const allowanceTarget = quote.allowanceTarget;
      let currentQuote = quote;

      const needsApprove = !isNative && allowanceTarget && (
        quote.issues?.allowance != null ||
        (publicClient && await (async () => {
          const sellAmount = parseUnits(amount as `${number}`, sellTok.decimals);
          const allowance = await publicClient.readContract({
            address: sellTok.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, allowanceTarget as `0x${string}`],
          }) as bigint;
          return allowance < sellAmount;
        })().catch(() => true))
      );

      if (needsApprove && allowanceTarget) {
          const approveData = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [allowanceTarget as `0x${string}`, maxUint256],
          });
          const approveTxHash = await sendTx(sellTok.address, approveData, 0n);
          if (!approveTxHash) throw new Error("Approve отклонён — попробуйте снова");

          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: approveTxHash as `0x${string}` });
          } else {
            await new Promise((r) => setTimeout(r, 3000));
          }

          const sellAmountStr = parseUnits(amount as `${number}`, sellTok.decimals).toString();
          const params = new URLSearchParams({ sellToken: sellTok.address, buyToken: buyTok.address, sellAmount: sellAmountStr, taker: address });
          const res = await fetch(`/api/swap-quote?${params}`);
          const freshData = await res.json();
          if (!res.ok) throw new Error(freshData?.error ?? "Ошибка получения курса");
          currentQuote = freshData;
          setQuote(freshData);
      }

      const { to, data, value } = currentQuote.transaction;
      const swapTxHash = await sendTx(to, data as `0x${string}`, BigInt(value ?? "0"));
      if (!swapTxHash) throw new Error("Swap отклонён — попробуйте снова");
      toast.success(`${buyTok.symbol} 🐝`);
      setQuote(null);
      setAmount("10");
    } catch (e: any) {
      const msg  = e?.message ?? e?.reason ?? "";
      const code = String(e?.code ?? "");
      const detail = msg || `code:${code}` || JSON.stringify(e).slice(0, 200);
      console.error("[swap]", e);
      if (!msg.includes("cancel") && !msg.includes("reject") && !msg.includes("denied")) {
        toast.error(detail.slice(0, 120) || t.swap.rateFailed);
      }
    } finally {
      setSwapping(false);
    }
  }

  const buyOut = quote?.buyAmount
    ? parseFloat(formatUnits(BigInt(quote.buyAmount), buyTok.decimals)).toFixed(4)
    : null;
  const rate = buyOut && parseFloat(amount) > 0
    ? (parseFloat(buyOut) / parseFloat(amount)).toFixed(4)
    : null;

  return (
    <>
    <Card>
      {/* Pair selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PAIRS.map((p, i) => (
          <button
            key={i}
            onClick={() => setPairIdx(i)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={
              pairIdx === i
                ? { background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.4)", color: "#F5A623" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sell */}
      <div className="rounded-xl px-4 py-3 mb-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex justify-between mb-1.5">
          <span className="text-white/40 text-xs">{t.swap.youGive}</span>
          <span className="text-white/60 text-xs font-semibold">{sellTok.symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0.01"
            step={pair.sell === "POL" ? "0.5" : "1"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-white text-2xl font-bold outline-none"
            placeholder="0.0"
          />
          <button onClick={fetchQuote} className="text-white/20 hover:text-white/60 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex justify-center my-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
          <ArrowDown className="w-4 h-4 text-white/40" />
        </div>
      </div>

      {/* Buy */}
      <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(39,174,96,0.06)", border: "1px solid rgba(39,174,96,0.15)" }}>
        <div className="flex justify-between mb-1.5">
          <span className="text-white/40 text-xs">{t.swap.youGet}</span>
          <span className="text-white/60 text-xs font-semibold">{buyTok.symbol}</span>
        </div>
        {loading
          ? <div className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-white/30" /><span className="text-white/30 text-sm">{t.swap.calculating}</span></div>
          : <p className="text-bee-green text-2xl font-bold">{buyOut ?? "—"}</p>
        }
      </div>

      {rate && <p className="text-white/25 text-xs text-center mb-4">1 {sellTok.symbol} ≈ {rate} {buyTok.symbol}</p>}

      <button
        onClick={swap}
        disabled={!quote || swapping || loading}
        className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
        style={{
          background: quote ? "rgba(39,174,96,0.2)" : "rgba(255,255,255,0.05)",
          border: quote ? "1px solid rgba(39,174,96,0.4)" : "1px solid rgba(255,255,255,0.08)",
          color: quote ? "#27AE60" : "rgba(255,255,255,0.3)",
        }}
      >
        {swapping ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.swap.swapping}</> : `${t.swap.tabSwap} ${sellTok.symbol} → ${buyTok.symbol}`}
      </button>

      <p className="text-white/20 text-xs text-center mt-3">{t.swap.swapFooter}</p>
    </Card>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SwapPage() {
  const [tab, setTab] = useState<"swap" | "send">("swap");
  const { t } = useT();

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">{t.swap.title}</h1>
        <p className="text-white/40 text-sm mt-0.5">Polygon · DAI · USDT · USDC · POL</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => setTab("swap")}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={tab === "swap"
            ? { background: "rgba(39,174,96,0.15)", border: "1px solid rgba(39,174,96,0.3)", color: "#27AE60" }
            : { color: "rgba(255,255,255,0.35)" }}
        >
          <ArrowDown className="w-4 h-4" /> {t.swap.tabSwap}
        </button>
        <button
          onClick={() => setTab("send")}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={tab === "send"
            ? { background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623" }
            : { color: "rgba(255,255,255,0.35)" }}
        >
          <Send className="w-4 h-4" /> {t.swap.tabSend}
        </button>
      </div>

      {tab === "swap" ? <SwapPanel /> : <SendPanel />}

      {/* Guide button */}
      <Link
        href="/dashboard/swap/guide"
        className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all hover:opacity-80"
        style={{ background: "rgba(41,182,246,0.07)", border: "1px solid rgba(41,182,246,0.18)" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(41,182,246,0.15)" }}>
          <BookOpen className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-left flex-1">
          <p className="text-white text-sm font-bold">{t.daiGuide.title}</p>
          <p className="text-white/40 text-xs">{t.daiGuide.sub}</p>
        </div>
        <span className="text-white/20 text-lg">›</span>
      </Link>
    </div>
  );
}
