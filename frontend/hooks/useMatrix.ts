"use client";
import { useReadContract } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";

export function useMatrix(address?: `0x${string}`, level?: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BHS_ABI,
    functionName: "getMatrix",
    args: address && level ? [address, level as number] : undefined,
    query: { enabled: !!address && !!level, staleTime: 60_000, refetchInterval: 60_000 },
  });

  if (!data) return { isLoading, refetch, matrix: null };

  const [slots, slotCount, cycles] = data;

  return {
    isLoading,
    refetch,
    matrix: {
      slots: Array.from(slots) as `0x${string}`[],
      slotCount: Number(slotCount),
      cycles:    Number(cycles),
    },
  };
}
