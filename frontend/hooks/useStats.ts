"use client";
import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS, API_BASE } from "@/lib/constants";

interface BackendStats {
  teamSize:    number;
  totalCycles: number;
}

export function useStats(address?: `0x${string}`) {
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BHS_ABI,
    functionName: "getStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  useEffect(() => {
    if (!address) return;
    fetch(`${API_BASE}/user/${address}`)
      .then((r) => r.json())
      .then((d) => setBackendStats({ teamSize: d.teamSize ?? 0, totalCycles: d.totalCycles ?? 0 }))
      .catch(() => setBackendStats({ teamSize: 0, totalCycles: 0 }));
  }, [address]);

  if (!data) return { isLoading, refetch, stats: null };

  const [referrer, registered, levels, autoBuy, totalEarned, totalSpent, pending] = data as unknown as [
    string, boolean, readonly boolean[], boolean, bigint, bigint, bigint
  ];

  const levelsArr = Array.from(levels) as boolean[];
  const activeLevelsList = levelsArr.reduce<number[]>((acc, active, i) => {
    if (active) acc.push(i + 1);
    return acc;
  }, []);

  return {
    isLoading,
    refetch,
    stats: {
      isRegistered:    registered,
      referrer,
      levels:          levelsArr,
      autoBuy,
      totalEarned,
      totalSpent,
      pending,
      activeLevels:    activeLevelsList.length,
      activeLevelsList,
      teamSize:        backendStats?.teamSize ?? 0,
      totalCycles:     backendStats?.totalCycles ?? 0,
    },
  };
}
