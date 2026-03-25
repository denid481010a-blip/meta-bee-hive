"use client";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, DEPLOY_BLOCK } from "@/lib/constants";
import { BHS_ABI } from "@/lib/contract";
import { getLogsAll } from "@/lib/getLogs";
import { useT } from "@/lib/i18n/LanguageContext";
import { Loader2 } from "lucide-react";
import { AddressDisplay } from "@/components/ui/AddressDisplay";

interface TeamMember {
  address: string;
  depth:   1 | 2;
}

export default function TeamPage() {
  const { address }  = useAccount();
  const publicClient = usePublicClient();
  const [members, setMembers]     = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useT();

  useEffect(() => {
    if (!address || !publicClient) return;
    setIsLoading(true);

    const event = BHS_ABI.find((e) => e.name === "UserRegistered") as any;

    // Step 1: get only MY direct referrals (filtered by indexed referrer = me)
    getLogsAll(publicClient as any, {
      address: CONTRACT_ADDRESS,
      event,
      args: { referrer: address },
      fromBlock: DEPLOY_BLOCK,
    }).then(async (directLogs) => {
      const directAddresses = directLogs.map((log) => (log as any).args.user as `0x${string}`);
      const direct: TeamMember[] = directAddresses.map((a) => ({ address: a.toLowerCase(), depth: 1 as const }));

      // Step 2: for each direct referral, get their referrals (depth 2)
      const indirectResults = await Promise.all(
        directAddresses.map((ref) =>
          getLogsAll(publicClient as any, {
            address: CONTRACT_ADDRESS,
            event,
            args: { referrer: ref },
            fromBlock: DEPLOY_BLOCK,
          })
        )
      );
      const indirect: TeamMember[] = indirectResults.flat().map((log) => ({
        address: ((log as any).args.user as string).toLowerCase(),
        depth: 2 as const,
      }));

      setMembers([...direct, ...indirect]);
    }).catch(() => setMembers([]))
      .finally(() => setIsLoading(false));
  }, [address, publicClient]);

  const direct   = members.filter((m) => m.depth === 1);
  const indirect = members.filter((m) => m.depth === 2);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.team.title}</h1>
        <p className="text-white/40 text-sm mt-1">{t.team.subtitle}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mb-2">🐝🐝🐝</div>
          <p className="text-2xl font-bold text-white">{members.length}</p>
          <p className="text-white/40 text-xs">{t.team.allBees}</p>
        </div>
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mb-2">🐝</div>
          <p className="text-2xl font-bold text-white">{direct.length}</p>
          <p className="text-white/40 text-xs">{t.team.directBees}</p>
        </div>
        <div className="bg-navy rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-xl mb-2">⚙️</div>
          <p className="text-2xl font-bold text-white">{indirect.length}</p>
          <p className="text-white/40 text-xs">{t.team.workerBees}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <div className="text-4xl mb-3">🐝</div>
          <p>{t.team.empty}</p>
          <p className="text-sm mt-2">{t.team.shareHint}</p>
        </div>
      ) : (
        <div className="bg-navy rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-3 text-xs text-white/30 px-4 py-3 border-b border-white/10">
            <span className="col-span-2">Адрес</span>
            <span>{t.team.type}</span>
          </div>
          {members.map((m, i) => (
            <div
              key={m.address}
              className={`grid grid-cols-3 px-4 py-3 items-center text-sm ${i > 0 ? "border-t border-white/5" : ""}`}
            >
              <div className="col-span-2">
                <AddressDisplay address={m.address as `0x${string}`} />
              </div>
              <span className={m.depth === 1 ? "text-bee-green text-xs font-medium" : "text-white/40 text-xs"}>
                {m.depth === 1 ? t.team.personal : t.team.worker}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
