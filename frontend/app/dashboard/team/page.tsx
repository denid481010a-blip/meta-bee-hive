"use client";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useT } from "@/lib/i18n/LanguageContext";
import { Loader2 } from "lucide-react";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { getTeam, type TeamMember } from "@/lib/teamCache";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";

export default function TeamPage() {
  const { address }  = useAccount();
  const publicClient = usePublicClient();
  const [members, setMembers]         = useState<TeamMember[]>([]);
  const [activeAddrs, setActiveAddrs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading]     = useState(true);
  const [isSyncing, setIsSyncing]     = useState(false);
  const { t } = useT();

  useEffect(() => {
    if (!address || !publicClient) return;
    setIsLoading(true);
    setIsSyncing(false);

    getTeam(address.toLowerCase(), publicClient as any, (fresh) => {
      setMembers(fresh);
      setIsSyncing(false);
    })
      .then((cached) => {
        setMembers(cached);
        setIsLoading(false);
        if (cached.length === 0) setIsSyncing(true);
      })
      .catch(() => { setIsLoading(false); setIsSyncing(false); });
  }, [address, publicClient]);

  // Проверяем для каждого depth-1 участника, купил ли он первый улей (levels[0] === true)
  useEffect(() => {
    if (!publicClient || members.length === 0) return;
    const depth1 = members.filter((m) => m.depth === 1);
    if (depth1.length === 0) return;

    Promise.all(
      depth1.map((m) =>
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: BHS_ABI,
          functionName: "getStats",
          args: [m.address as `0x${string}`],
        }).then((res: any) => {
          const levels = res[2] as readonly boolean[];
          return levels[0] ? m.address : null;
        }).catch(() => null)
      )
    ).then((results) => {
      setActiveAddrs(new Set(results.filter(Boolean) as string[]));
    });
  }, [members, publicClient]);

  const direct   = members.filter((m) => m.depth === 1);
  const indirect = members.filter((m) => m.depth === 2);
  const active   = direct.filter((m) => activeAddrs.has(m.address));
  const inactive = direct.filter((m) => !activeAddrs.has(m.address));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.team.title}</h1>
        <p className="text-white/40 text-sm mt-1">{t.team.subtitle}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {/* Все пчелы */}
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center col-span-2">
          <div className="text-xl mb-2">🐝🐝🐝</div>
          <p className="text-3xl font-bold text-white">{members.length}</p>
          <p className="text-white/40 text-xs mt-1">{t.team.allBees}</p>
          <p className="text-white/20 text-xs">(активные + не активные + рабочие)</p>
        </div>

        {/* Активные */}
        <div className="bg-navy rounded-2xl p-4 border border-bee-green/20 text-center">
          <div className="text-xl mb-2">🟡</div>
          <p className="text-2xl font-bold text-bee-green">{active.length}</p>
          <p className="text-white/60 text-xs mt-1 font-medium">Активные пчелы</p>
          <p className="text-white/20 text-xs">(купили первый улей)</p>
        </div>

        {/* Не активные */}
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mb-2">💤</div>
          <p className="text-2xl font-bold text-white/50">{inactive.length}</p>
          <p className="text-white/60 text-xs mt-1 font-medium">Не активные пчелы</p>
          <p className="text-white/20 text-xs">(зарегистрировались по реф. ссылке)</p>
        </div>

        {/* Рабочие */}
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center col-span-2">
          <div className="text-xl mb-2">⚙️</div>
          <p className="text-2xl font-bold text-white">{indirect.length}</p>
          <p className="text-white/40 text-xs mt-1">{t.team.workerBees}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <p className="text-white/40 text-sm">Синхронизация с блокчейном…</p>
        </div>
      ) : members.length === 0 ? (
        isSyncing ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-gold" />
            <p className="text-white/40 text-sm">Синхронизация с блокчейном…</p>
          </div>
        ) : (
          <div className="text-center py-12 text-white/30">
            <div className="text-4xl mb-3">🐝</div>
            <p>{t.team.empty}</p>
            <p className="text-sm mt-2">{t.team.shareHint}</p>
          </div>
        )
      ) : (
        <div className="bg-navy rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-3 text-xs text-white/30 px-4 py-3 border-b border-white/10">
            <span className="col-span-2">Адрес</span>
            <span>{t.team.type}</span>
          </div>
          {members.map((m, i) => {
            const isActive = m.depth === 1 && activeAddrs.has(m.address);
            const isInactive = m.depth === 1 && !activeAddrs.has(m.address);
            return (
              <div
                key={m.address}
                className={`grid grid-cols-3 px-4 py-3 items-center text-sm ${i > 0 ? "border-t border-white/5" : ""}`}
              >
                <div className="col-span-2">
                  <AddressDisplay address={m.address as `0x${string}`} />
                </div>
                <span className={
                  isActive   ? "text-bee-green text-xs font-medium" :
                  isInactive ? "text-white/30 text-xs" :
                               "text-white/40 text-xs"
                }>
                  {isActive   ? "Активная" :
                   isInactive ? "Не активная" :
                                t.team.worker}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
