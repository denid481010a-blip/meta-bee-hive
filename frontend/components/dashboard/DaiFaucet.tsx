"use client";
import { useState } from "react";
import { useWriteContract, useAccount, useReadContract, usePublicClient } from "wagmi";
import { DAI_ABI } from "@/lib/contract";
import { DAI_ADDRESS } from "@/lib/constants";
import { formatDAI } from "@/lib/formatters";
import { Droplets, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const MINT_AMOUNT = BigInt("100000000000000000000"); // 100 DAI

export function DaiFaucet({ onMinted }: { onMinted?: () => void }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const { data: balance, refetch } = useReadContract({
    address: DAI_ADDRESS,
    abi: DAI_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  async function claim() {
    if (!address || !publicClient) return;
    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: DAI_ADDRESS,
        abi: DAI_ABI,
        functionName: "mint",
        args: [address, MINT_AMOUNT],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("100 тестовых DAI зачислено!");
      refetch();
      onMinted?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg.includes("user rejected") && !msg.includes("User rejected")) {
        toast.error("Ошибка получения DAI");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-4 flex items-center justify-between gap-4"
      style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)" }}
    >
      <div>
        <p className="text-white/50 text-xs mb-0.5">Тестовый баланс DAI</p>
        <p className="text-blue-400 font-bold text-lg">
          {balance !== undefined ? formatDAI(balance as bigint) : "—"}
        </p>
      </div>
      <button
        onClick={claim}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)" }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
        Получить 100 DAI
      </button>
    </div>
  );
}
