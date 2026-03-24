"use client";
import { useReadContract } from "wagmi";
import { DAI_ABI } from "@/lib/contract";
import { DAI_ADDRESS } from "@/lib/constants";

export function useDAIBalance(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: DAI_ADDRESS,
    abi: DAI_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  return { balance: data as bigint | undefined, isLoading, refetch };
}
