"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { shortAddress, formatDAI, formatDate } from "@/lib/formatters";
import { API_BASE, LEVEL_COLORS } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { AddressDisplay } from "@/components/ui/AddressDisplay";

interface TeamMember {
  address:     string;
  level:       number;
  activeLevels: number;
  joinedAt:    number;
  totalEarned: string;
  depth:       number;
}

export default function TeamPage() {
  const { address } = useAccount();
  const [members, setMembers]     = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    setIsLoading(true);
    fetch(`${API_BASE}/team/${address}`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setIsLoading(false));
  }, [address]);

  const direct   = members.filter((m) => m.depth === 1);
  const indirect = members.filter((m) => m.depth > 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Моя Пасека</h1>
        <p className="text-white/40 text-sm mt-1">Твои реферальные пчёлы и их активность</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mx-auto mb-2">🐝🐝🐝</div>
          <p className="text-2xl font-bold text-white">{members.length}</p>
          <p className="text-white/40 text-xs">Всего пчёл</p>
        </div>
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mx-auto mb-2">🐝</div>
          <p className="text-2xl font-bold text-white">{direct.length}</p>
          <p className="text-white/40 text-xs">Личные пчёлы</p>
        </div>
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mx-auto mb-2">⚙️</div>
          <p className="text-2xl font-bold text-white">{indirect.length}</p>
          <p className="text-white/40 text-xs">Рабочие пчёлы</p>
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
          <div className="grid grid-cols-5 text-xs text-white/30 px-4 py-3 border-b border-white/10">
            <span className="col-span-2">Адрес</span>
            <span>Уровни</span>
            <span>Глубина</span>
            <span>Дата</span>
          </div>
          {members.map((m, i) => {
            const topColor = LEVEL_COLORS[m.activeLevels] ?? "#F5A623";
            return (
              <div
                key={m.address}
                className={`grid grid-cols-5 px-4 py-3 items-center text-sm ${i > 0 ? "border-t border-white/5" : ""}`}
              >
                <div className="col-span-2">
                  <AddressDisplay address={m.address as `0x${string}`} />
                </div>
                <span className="font-bold" style={{ color: topColor }}>
                  {m.activeLevels} / 10
                </span>
                <span className={m.depth === 1 ? "text-bee-green" : "text-white/40"}>
                  {m.depth === 1 ? "Личная" : `Глубина ${m.depth}`}
                </span>
                <span className="text-white/30 text-xs">{formatDate(m.joinedAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
