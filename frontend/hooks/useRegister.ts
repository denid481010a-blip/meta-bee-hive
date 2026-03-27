"use client";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { useState } from "react";

export function useRegister() {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { writeContractAsync, isPending } = useWriteContract();
  const { isSuccess, isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  async function register(referrer: `0x${string}`) {
    setError(null);
    setIsSending(true);
    try {
      // wagmi автоматически роутит через Smart Wallet + paymaster для Privy пользователей
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: BHS_ABI,
        functionName: "register",
        args: [referrer],
      });
      setTxHash(hash);
      return hash;
    } catch (e: any) {
      const msg = e?.shortMessage ?? e?.message ?? "";
      console.error("Register tx error:", msg, e);
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancel")) {
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
    isPending: isSending || isPending || isWaiting,
    isSuccess,
  };
}
