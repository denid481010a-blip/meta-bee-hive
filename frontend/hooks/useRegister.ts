"use client";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { useState } from "react";

export function useRegister() {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { writeContractAsync, isPending } = useWriteContract();
  const { isSuccess, isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  async function register(referrer: `0x${string}`) {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: BHS_ABI,
        functionName: "register",
        args: [referrer],
      });
      setTxHash(hash);
      return hash;
    } catch (e) {
      throw e;
    }
  }

  return {
    register,
    txHash,
    isPending: isPending || isWaiting,
    isSuccess,
  };
}
