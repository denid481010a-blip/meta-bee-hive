"use client";
import { useEffect, useState } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS, DEPLOY_BLOCK } from "@/lib/constants";
import { getLogsAll } from "@/lib/getLogs";

export function useStats(address?: `0x${string}`) {
  const publicClient = usePublicClient();
  const [directRefs, setDirectRefs]   = useState(0);
  const [totalRefs, setTotalRefs]     = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BHS_ABI,
    functionName: "getStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 60_000, refetchInterval: 60_000 },
  });

  // Подсчёт прямых рефералов и всего дерева (кэш 2 часа в localStorage)
  useEffect(() => {
    if (!address || !publicClient) return;

    const CACHE_TTL = 2 * 60 * 60 * 1000;
    const cacheKey  = `beeTree_${address}`;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { direct, total, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setDirectRefs(direct);
          setTotalRefs(total);
          return;
        }
      }
    } catch {}

    const event = BHS_ABI.find((e) => e.name === "UserRegistered") as any;

    // Шаг 1: только мои прямые рефералы (indexed filter)
    getLogsAll(publicClient as any, {
      address: CONTRACT_ADDRESS,
      event,
      args: { referrer: address },
      fromBlock: DEPLOY_BLOCK,
    }).then(async (directLogs) => {
      const directAddrs = directLogs.map((l) => (l.args?.user as string)?.toLowerCase()).filter(Boolean);
      const direct = directAddrs.length;

      // Шаг 2: рефералы каждого прямого (depth 2+)
      const indirectResults = await Promise.all(
        directAddrs.map((ref) =>
          getLogsAll(publicClient as any, {
            address: CONTRACT_ADDRESS,
            event,
            args: { referrer: ref as `0x${string}` },
            fromBlock: DEPLOY_BLOCK,
          }).catch(() => [])
        )
      );
      const total = direct + indirectResults.reduce((sum, logs) => sum + logs.length, 0);

      setDirectRefs(direct);
      setTotalRefs(total);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ direct, total, ts: Date.now() }));
      } catch {}
    }).catch(() => { setDirectRefs(0); setTotalRefs(0); });
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
      directRefs,
      totalRefs,
      workingRefs:     totalRefs - directRefs,
      totalCycles,
    },
  };
}
