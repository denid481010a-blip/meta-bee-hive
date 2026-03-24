"use client";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { LEVEL_COLORS, CONTRACT_ADDRESS, DEPLOY_BLOCK } from "@/lib/constants";
import { BHS_ABI } from "@/lib/contract";
import { Loader2 } from "lucide-react";
import { AddressDisplay } from "@/components/ui/AddressDisplay";

interface TeamMember {
  address:      string;
  activeLevels: number;
  blockNumber:  bigint;
}

export default function TeamPage() {
  const { address }    = useAccount();
  const publicClient   = usePublicClient();
  const [members, setMembers]     = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address || !publicClient) return;
    setIsLoading(true);

    publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event: BHS_ABI.find((e) => e.name === "UserRegistered") as any,
      args: { referrer: address },
      fromBlock: DEPLOY_BLOCK,
      toBlock: "latest",
    }).then(async (logs) => {
      const members: TeamMember[] = await Promise.all(
        logs.map(async (log: any) => {
          const userAddr = log.args.user as `0x${string}`;
          try {
            const stats = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: BHS_ABI,
              functionName: "getStats",
              args: [userAddr],
            }) as any;
            const levels: boolean[] = stats[2];
            const activeLevels = levels.filter(Boolean).length;
            return { address: userAddr, activeLevels, blockNumber: log.blockNumber };
          } catch {
            return { address: userAddr, activeLevels: 0, blockNumber: log.blockNumber };
          }
        })
      );
      const sorted = members.sort((a, b) => Number(b.blockNumber - a.blockNumber));
      setMembers(sorted);
    }).catch(() => setMembers([]))
      .finally(() => setIsLoading(false));
  }, [address, publicClient]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Моя Пасека</h1>
        <p className="text-white/40 text-sm mt-1">Твои реферальные пчёлы и их активность</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mx-auto mb-2">🐝🐝🐝</div>
          <p className="text-2xl font-bold text-white">{members.length}</p>
          <p className="text-white/40 text-xs">Личных пчёл</p>
        </div>
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mx-auto mb-2">🏆</div>
          <p className="text-2xl font-bold text-white">
            {members.filter((m) => m.activeLevels > 0).length}
          </p>
          <p className="text-white/40 text-xs">Активных пчёл</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <div className="text-4xl mb-3">🐝</div>
          <p>В твоей пасеке пока нет пчёл</p>
          <p className="text-sm mt-2">Поделись реферальной ссылкой!</p>
        </div>
      ) : (
        <div className="bg-navy rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-3 text-xs text-white/30 px-4 py-3 border-b border-white/10">
            <span className="col-span-2">Адрес</span>
            <span>Активных уровней</span>
          </div>
          {members.map((m, i) => {
            const color = LEVEL_COLORS[m.activeLevels] ?? "#555";
            return (
              <div
                key={m.address}
                className={`grid grid-cols-3 px-4 py-3 items-center text-sm ${i > 0 ? "border-t border-white/5" : ""}`}
              >
                <div className="col-span-2">
                  <AddressDisplay address={m.address as `0x${string}`} />
                </div>
                <span className="font-bold" style={{ color: m.activeLevels > 0 ? color : "rgba(255,255,255,0.2)" }}>
                  {m.activeLevels > 0 ? `${m.activeLevels} / 10` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
