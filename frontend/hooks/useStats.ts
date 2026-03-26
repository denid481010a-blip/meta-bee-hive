"use client";
import { useEffect, useState } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS, DEPLOY_BLOCK } from "@/lib/constants";
import { getLogsAll } from "@/lib/getLogs";
import { getTeam } from "@/lib/teamCache";

export function useStats(address?: `0x${string}`) {
  const publicClient = usePublicClient();
  const [directRefs, setDirectRefs]     = useState(0);
  const [totalRefs, setTotalRefs]       = useState(0);
  const [totalCycles, setTotalCycles]   = useState(0);
  const [isTeamLoading, setIsTeamLoading] = useState(false);

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BHS_ABI,
    functionName: "getStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 60_000, refetchInterval: 60_000 },
  });

  // Подсчёт прямых рефералов и всего дерева (кэш через Supabase)
  useEffect(() => {
    if (!address || !publicClient) return;
    setIsTeamLoading(true);

    getTeam(address.toLowerCase(), publicClient as any, (fresh) => {
      const direct = fresh.filter((m) => m.depth === 1).length;
      const total  = fresh.length;
      setDirectRefs(direct);
      setTotalRefs(total);
      setIsTeamLoading(false);
    }).then((members) => {
      setDirectRefs(members.filter((m) => m.depth === 1).length);
      setTotalRefs(members.length);
      setIsTeamLoading(false);
    }).catch(() => { setDirectRefs(0); setTotalRefs(0); setIsTeamLoading(false); });
  }, [address, publicClient]);

  // totalCycles: sum of cycles from all active levels
  useEffect(() => {
    if (!address || !data) return;
    const [, , levels] = data as unknown as [string, boolean, readonly boolean[], boolean, bigint, bigint, bigint];
    const activeLevelNums = Array.from(levels)
      .map((active, i) => active ? i + 1 : null)
      .filter(Boolean) as number[];
    if (!activeLevelNums.length || !publicClient) return;

    Promise.all(
      activeLevelNums.map((level) =>
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: BHS_ABI,
          functionName: "getMatrix",
          args: [address, level],
        }).then((m: any) => Number(m[2])).catch(() => 0)
      )
    ).then((cycles) => setTotalCycles(cycles.reduce((a, b) => a + b, 0)));
  }, [address, data, publicClient]);

  if (!data) return { isLoading, refetch, stats: null, isTeamLoading };

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
      directRefs,
      totalRefs,
      workingRefs:     totalRefs - directRefs,
      totalCycles,
      isTeamLoading,
    },
  };
}
