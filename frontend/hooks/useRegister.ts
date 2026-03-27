"use client";
import { useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { encodeFunctionData } from "viem";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { usePrivyAuth } from "@/components/providers/PrivyContext";

export function useRegister() {
  const { sendTransaction } = usePrivyAuth();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { isSuccess, isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  async function register(referrer: `0x${string}`) {
    setError(null);
    setIsSending(true);
    try {
      const data = encodeFunctionData({
        abi: BHS_ABI,
        functionName: "register",
        args: [referrer],
      });
      const hash = await sendTransaction(CONTRACT_ADDRESS, data, 0n);
      setTxHash(hash as `0x${string}`);
      return hash;
    } catch (e: any) {
      const msg = e?.shortMessage ?? e?.message ?? "";
      console.error("Register tx error:", msg, e);
      if (
        msg.includes("rejected") ||
        msg.includes("denied") ||
        msg.includes("cancel")
      ) {
        setError("cancelled");
      } else {
        setError(msg || "failed");
      }
    } finally {
      setIsSending(false);
    }
  }

  return {
    register,
    txHash,
    error,
    isPending: isSending || isWaiting,
    isSuccess,
  };
}
