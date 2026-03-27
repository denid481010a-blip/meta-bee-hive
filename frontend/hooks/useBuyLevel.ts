"use client";
import { useState, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { BHS_ABI, DAI_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS, DAI_ADDRESS } from "@/lib/constants";
import { usePrivyAuth } from "@/components/providers/PrivyContext";

export type BuyStep =
  | "idle"
  | "approving"
  | "approve_pending"
  | "buying"
  | "buy_pending"
  | "success"
  | "error";

export function useBuyLevel() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransaction } = usePrivyAuth();

  const [step, setStep]           = useState<BuyStep>("idle");
  const [error, setError]         = useState<string | null>(null);
  const [approveTx, setApproveTx] = useState<`0x${string}` | undefined>();
  const [buyTx, setBuyTx]         = useState<`0x${string}` | undefined>();

  const MAX_UINT256 = BigInt(
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  );

  const buy = useCallback(
    async (level: number, price: bigint) => {
      if (!address || !publicClient) return;
      setError(null);
      setStep("idle");

      try {
        // Check current DAI allowance
        const allowance = (await publicClient.readContract({
          address: DAI_ADDRESS,
          abi: DAI_ABI,
          functionName: "allowance",
          args: [address, CONTRACT_ADDRESS],
        })) as bigint;

        // Approve if needed
        if (allowance < price) {
          setStep("approving");

          const approveData = encodeFunctionData({
            abi: DAI_ABI,
            functionName: "approve",
            args: [CONTRACT_ADDRESS, MAX_UINT256],
          });

          const approveTxHash = await sendTransaction(DAI_ADDRESS, approveData, 0n);
          setApproveTx(approveTxHash as `0x${string}`);
          setStep("approve_pending");
          await publicClient.waitForTransactionReceipt({
            hash: approveTxHash as `0x${string}`,
          });
        }

        // Buy level
        setStep("buying");

        const buyData = encodeFunctionData({
          abi: BHS_ABI,
          functionName: "buyHive",
          args: [level],
        });

        const buyTxHash = await sendTransaction(CONTRACT_ADDRESS, buyData, 0n);
        setBuyTx(buyTxHash as `0x${string}`);
        setStep("buy_pending");
        await publicClient.waitForTransactionReceipt({
          hash: buyTxHash as `0x${string}`,
        });

        setStep("success");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        if (
          msg.includes("user rejected") ||
          msg.includes("User rejected") ||
          msg.includes("cancel")
        ) {
          reset();
          return;
        }
        setError(msg.slice(0, 120) || "Ошибка транзакции");
        setStep("error");
      }
    },
    [address, publicClient, sendTransaction],
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setApproveTx(undefined);
    setBuyTx(undefined);
  }, []);

  return { step, error, approveTx, buyTx, buy, reset };
}
