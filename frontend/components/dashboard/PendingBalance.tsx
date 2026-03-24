"use client";
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formatDAI } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

interface PendingBalanceProps {
  pending: bigint;
  onWithdrawn?: () => void;
}

export function PendingBalance({ pending, onWithdrawn }: PendingBalanceProps) {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { writeContractAsync, isPending } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  if (pending === 0n) return null;

  async function withdraw() {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: BHS_ABI,
        functionName: "withdrawPending",
        args: [],
      });
      setTxHash(hash);
      toast.success("Средства выведены!");
      onWithdrawn?.();
    } catch {
      toast.error("Ошибка вывода");
    }
  }

  return (
    <Card glow="gold" className="flex items-center justify-between">
      <div>
        <p className="text-white/50 text-sm">Накоплено (автопокупка)</p>
        <p className="text-gold text-2xl font-bold mt-1">{formatDAI(pending)}</p>
      </div>
      <Button
        variant="gold"
        size="sm"
        onClick={withdraw}
        loading={isPending || isWaiting}
      >
        <Download className="w-4 h-4" />
        Вывести
      </Button>
    </Card>
  );
}
