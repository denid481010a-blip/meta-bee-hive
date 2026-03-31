"use client";
import { useEffect, useState, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useT } from "@/lib/i18n/LanguageContext";
import { Loader2, RefreshCw, Users, Hexagon } from "lucide-react";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { getTeam, clearTeamCache, type TeamMember } from "@/lib/teamCache";
import { clearLogsCache } from "@/lib/getLogs";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS, LEVEL_COLORS } from "@/lib/constants";
import { MatrixView } from "@/components/matrix/MatrixView";
import { useStats } from "@/hooks/useStats";
import { clsx } from "clsx";

export default function TeamPage() {
  const { address }  = useAccount();
  const publicClient = usePublicClient();
  const [tab, setTab] = useState<"team" | "matrix">("team");
  const [members, setMembers]         = useState<TeamMember[]>([]);
  const [activeAddrs, setActiveAddrs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading]     = useState(true);
  const [isSyncing, setIsSyncing]     = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const { t } = useT();
  const { stats } = useStats(address);
  const activeLevels: number[] = stats?.activeLevelsList ?? [];

  const loadTeam = useCallback(async (forceRefresh = false) => {
    if (!address || !publicClient) return;
    setIsLoading(true);
    setIsSyncing(false);

    if (forceRefresh) {
      clearLogsCache(address);
    }

    getTeam(address.toLowerCase(), publicClient as any, (fresh) => {
      setMembers(fresh);
      setIsSyncing(false);
    }, forceRefresh)
      .then((cached) => {
        setMembers(cached);
        setIsLoading(false);
        if (cached.length === 0) setIsSyncing(true);
      })
      .catch(() => { setIsLoading(false); setIsSyncing(false); });
  }, [address, publicClient]);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  async function handleForceRefresh() {
    setIsRefreshing(true);
    await loadTeam(true);
    setIsRefreshing(false);
  }

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
          const registered = res[1] as boolean;
          return registered ? m.address : null;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.team.title}</h1>
          <p className="text-white/40 text-sm mt-1">{t.team.subtitle}</p>
        </div>
        {tab === "team" && (
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
            style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? t.team.refreshing : t.team.refresh}
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => setTab("team")}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={tab === "team"
            ? { background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623" }
            : { color: "rgba(255,255,255,0.35)" }}
        >
          <Users className="w-4 h-4" /> {t.team.title}
        </button>
        <button
          onClick={() => setTab("matrix")}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={tab === "matrix"
            ? { background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623" }
            : { color: "rgba(255,255,255,0.35)" }}
        >
          <Hexagon className="w-4 h-4" /> {t.nav.matrix}
        </button>
      </div>

      {/* ── Team tab ── */}
      {tab === "team" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center col-span-2">
              <div className="text-xl mb-2">🐝🐝🐝</div>
              <p className="text-3xl font-bold text-white">{members.length}</p>
              <p className="text-white/40 text-xs mt-1">{t.team.allBees}</p>
            </div>

            <div className="bg-navy rounded-2xl p-4 border border-bee-green/20 text-center">
              <div className="text-xl mb-2">🟡</div>
              <p className="text-2xl font-bold text-bee-green">{active.length}</p>
              <p className="text-white/60 text-xs mt-1 font-medium">{t.team.activeBees}</p>
              <p className="text-white/20 text-xs">{t.team.activeBeesSub}</p>
            </div>

            <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
              <div className="text-xl mb-2">💤</div>
              <p className="text-2xl font-bold text-white/50">{inactive.length}</p>
              <p className="text-white/60 text-xs mt-1 font-medium">{t.team.inactiveBees}</p>
              <p className="text-white/20 text-xs">{t.team.inactiveBeesSub}</p>
            </div>

            <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center col-span-2">
              <div className="text-xl mb-2">⚙️</div>
              <p className="text-2xl font-bold text-white">{indirect.length}</p>
              <p className="text-white/40 text-xs mt-1">{t.team.workerBees}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <p className="text-white/40 text-sm">{t.team.syncing}</p>
            </div>
          ) : members.length === 0 ? (
            isSyncing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-gold" />
                <p className="text-white/40 text-sm">{t.team.syncing}</p>
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
                <span className="col-span-2">{t.team.address}</span>
                <span>{t.team.type}</span>
              </div>
              {members.map((m, i) => {
                const isActive   = m.depth === 1 && activeAddrs.has(m.address);
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
                      {isActive   ? t.team.active :
                       isInactive ? t.team.inactive :
                                    t.team.worker}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Matrix tab ── */}
      {tab === "matrix" && (
        <>
          {/* Level selector */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
              const color  = LEVEL_COLORS[level] ?? "#F5A623";
              const active = activeLevels.includes(level);
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={clsx(
                    "w-12 h-12 rounded-xl font-bold text-sm border-2 transition-all",
                    selectedLevel === level ? "scale-110 shadow-lg" : "opacity-60 hover:opacity-100",
                    active ? "bg-opacity-20" : "bg-white/5"
                  )}
                  style={{
                    borderColor: selectedLevel === level ? color : "rgba(255,255,255,0.1)",
                    color: active ? color : "rgba(255,255,255,0.3)",
                    backgroundColor: selectedLevel === level ? color + "22" : undefined,
                  }}
                >
                  H{level}
                </button>
              );
            })}
          </div>

          {address && (
            <MatrixView level={selectedLevel} address={address} />
          )}
        </>
      )}
    </div>
  );
}
