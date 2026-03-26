import type { PublicClient } from "viem";
import { supabase } from "./supabase";
import { CONTRACT_ADDRESS, DEPLOY_BLOCK } from "./constants";
import { BHS_ABI } from "./contract";
import { getLogsAll } from "./getLogs";

export interface TeamMember {
  address: string;
  depth:   1 | 2;
}

interface CacheRow {
  members:   TeamMember[];
  lastBlock: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Load team from Supabase. Returns null if no cache or cache expired. */
async function loadFromSupabase(wallet: string): Promise<{ members: TeamMember[]; lastBlock: bigint } | null> {
  const { data, error } = await supabase
    .from("team_cache")
    .select("members, synced_at")
    .eq("wallet", wallet.toLowerCase())
    .single();

  if (error || !data) return null;

  const age = Date.now() - new Date(data.synced_at).getTime();
  if (age > CACHE_TTL_MS) {
    // expired but return stale data + lastBlock so we can do incremental refresh
    const row = data.members as CacheRow;
    if (row && typeof row === "object" && "members" in row) {
      return { members: row.members, lastBlock: BigInt(row.lastBlock ?? 0) };
    }
    return null;
  }

  const row = data.members as CacheRow;
  if (row && typeof row === "object" && "members" in row) {
    return { members: row.members, lastBlock: BigInt(row.lastBlock ?? 0) };
  }
  // Legacy format (plain array)
  if (Array.isArray(data.members)) {
    return { members: data.members as TeamMember[], lastBlock: 0n };
  }
  return null;
}

/** Fetch only NEW registrations since lastBlock, merge with existing members */
async function incrementalFetch(
  wallet: string,
  publicClient: PublicClient,
  existing: TeamMember[],
  fromBlock: bigint
): Promise<TeamMember[]> {
  const currentBlock = await publicClient.getBlockNumber();
  if (fromBlock > currentBlock) return existing;

  const event = BHS_ABI.find((e) => e.name === "UserRegistered") as any;

  // New direct referrals since lastBlock
  const newDirectLogs = await getLogsAll(publicClient as any, {
    address: CONTRACT_ADDRESS,
    event,
    args: { referrer: wallet as `0x${string}` },
    fromBlock,
  }).catch(() => []);

  const newDirectAddrs = newDirectLogs.map((log: any) => (log.args.user as string).toLowerCase());
  const newDirect: TeamMember[] = newDirectAddrs.map((a) => ({ address: a, depth: 1 as const }));

  // Existing direct members (to find their new indirect refs)
  const allDirectAddrs = [
    ...existing.filter((m) => m.depth === 1).map((m) => m.address),
    ...newDirectAddrs,
  ];

  // New indirect referrals since lastBlock (for ALL direct members)
  const indirectResults = await Promise.all(
    allDirectAddrs.map((ref) =>
      getLogsAll(publicClient as any, {
        address: CONTRACT_ADDRESS,
        event,
        args: { referrer: ref as `0x${string}` },
        fromBlock,
      }).catch(() => [])
    )
  );

  const newIndirect: TeamMember[] = indirectResults.flat().map((log: any) => ({
    address: (log.args.user as string).toLowerCase(),
    depth:   2 as const,
  }));

  // Merge: existing + new (deduplicate by address)
  const existingAddrs = new Set(existing.map((m) => m.address));
  const merged = [
    ...existing,
    ...newDirect.filter((m) => !existingAddrs.has(m.address)),
    ...newIndirect.filter((m) => !existingAddrs.has(m.address)),
  ];

  // Save to Supabase with new lastBlock
  const cacheRow: CacheRow = { members: merged, lastBlock: Number(currentBlock) };
  await supabase.from("team_cache").upsert(
    { wallet: wallet.toLowerCase(), members: cacheRow, synced_at: new Date().toISOString() },
    { onConflict: "wallet" }
  );

  return merged;
}

/** Full fetch from DEPLOY_BLOCK (first time) */
async function fullFetch(wallet: string, publicClient: PublicClient): Promise<TeamMember[]> {
  const currentBlock = await publicClient.getBlockNumber();
  const event = BHS_ABI.find((e) => e.name === "UserRegistered") as any;

  const directLogs = await getLogsAll(publicClient as any, {
    address: CONTRACT_ADDRESS,
    event,
    args: { referrer: wallet as `0x${string}` },
    fromBlock: DEPLOY_BLOCK,
  });

  const directAddrs = directLogs.map((log: any) => (log.args.user as string).toLowerCase());
  const direct: TeamMember[] = directAddrs.map((a) => ({ address: a, depth: 1 as const }));

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

  const indirect: TeamMember[] = indirectResults.flat().map((log: any) => ({
    address: (log.args.user as string).toLowerCase(),
    depth:   2 as const,
  }));

  const members = [...direct, ...indirect];

  const cacheRow: CacheRow = { members, lastBlock: Number(currentBlock) };
  await supabase.from("team_cache").upsert(
    { wallet: wallet.toLowerCase(), members: cacheRow, synced_at: new Date().toISOString() },
    { onConflict: "wallet" }
  );

  return members;
}

/**
 * Returns cached team instantly (if fresh), does incremental refresh in background.
 * First visit: full scan. Subsequent: only new blocks.
 */
export async function getTeam(
  wallet: string,
  publicClient: PublicClient,
  onUpdate: (members: TeamMember[]) => void
): Promise<TeamMember[]> {
  const cached = await loadFromSupabase(wallet);

  if (cached !== null) {
    // Incremental refresh in background
    incrementalFetch(wallet, publicClient, cached.members, cached.lastBlock + 1n)
      .then(onUpdate)
      .catch(() => {});
    return cached.members;
  }

  // First time — full scan
  const members = await fullFetch(wallet, publicClient).catch(() => []);
  return members;
}
