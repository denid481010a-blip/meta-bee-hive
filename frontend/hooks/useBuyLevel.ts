"use client";
import { useState, useCallback } from "react";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { BHS_ABI, DAI_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS, DAI_ADDRESS } from "@/lib/constants";

export type BuyStep = "idle" | "approving" | "approve_pending" | "buying" | "buy_pending" | "success" | "error";

export function useBuyLevel() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep]           = useState<BuyStep>("idle");
  const [error, setError]         = useState<string | null>(null);
  const [approveTx, setApproveTx] = useState<`0x${string}` | undefined>();
  const [buyTx, setBuyTx]         = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();

  const buy = useCallback(async (level: number, price: bigint) => {
    if (!address || !publicClient) return;
    setError(null);
    setStep("idle");

    try {
      // Шаг 1: approve DAI
      setStep("approving");
      const approveTxHash = await writeContractAsync({
        address: DAI_ADDRESS,
        abi: DAI_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, price],
      });
      setApproveTx(approveTxHash);
      setStep("approve_pending");

      // Ждём подтверждения approve через publicClient (нет race condition)
      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

      // Шаг 2: buyHive
      setStep("buying");
      const buyTxHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: BHS_ABI,
        functionName: "buyHive",
        args: [level],
      });
      setBuyTx(buyTxHash);
      setStep("buy_pending");

      await publicClient.waitForTransactionReceipt({ hash: buyTxHash });

      setStep("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка транзакции";
      setError(msg.includes("user rejected") ? "Транзакция отклонена" : msg.slice(0, 100));
      setStep("error");
    }
  }, [address, publicClient, writeContractAsync]);

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setApproveTx(undefined);
    setBuyTx(undefined);
  }, []);

  return { step, error, approveTx, buyTx, buy, reset };
}
