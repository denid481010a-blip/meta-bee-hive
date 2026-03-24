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

  const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

  const buy = useCallback(async (level: number, price: bigint) => {
    if (!address || !publicClient) return;
    setError(null);
    setStep("idle");

    try {
      // Проверяем текущий allowance
      const allowance = await publicClient.readContract({
        address: DAI_ADDRESS,
        abi: DAI_ABI,
        functionName: "allowance",
        args: [address, CONTRACT_ADDRESS],
      }) as bigint;

      // Если allowance меньше цены — делаем approve на максимум (один раз навсегда)
      if (allowance < price) {
        setStep("approving");
        const approveTxHash = await writeContractAsync({
          address: DAI_ADDRESS,
          abi: DAI_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, MAX_UINT256],
          maxFeePerGas: BigInt(50_000_000_000),
          maxPriorityFeePerGas: BigInt(30_000_000_000),
        });
        setApproveTx(approveTxHash);
        setStep("approve_pending");
        await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      }

      // Покупка
      setStep("buying");
      const buyTxHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: BHS_ABI,
        functionName: "buyHive",
        args: [level],
        maxFeePerGas: BigInt(50_000_000_000),
        maxPriorityFeePerGas: BigInt(30_000_000_000),
      });
      setBuyTx(buyTxHash);
      setStep("buy_pending");
      await publicClient.waitForTransactionReceipt({ hash: buyTxHash });

      setStep("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("user rejected") || msg.includes("User rejected")) {
        reset();
        return;
      }
      setError(msg.slice(0, 100) || "Ошибка транзакции");
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
