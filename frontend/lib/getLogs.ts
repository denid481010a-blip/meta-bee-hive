import type { PublicClient } from "viem";

const CHUNK = 9_000n; // publicnode supports up to ~10k blocks
const BATCH_SIZE = 4;  // parallel requests per batch (was 10 — too aggressive)
const BATCH_DELAY = 250; // ms between batches to avoid rate-limit
const MAX_SPLIT_DEPTH = 2; // cap recursion depth to prevent exponential explosion on rate-limit
const CACHE_TTL = 5 * 60_000; // 5 minutes

const cache = new Map<string, { data: any[]; expiresAt: number }>();

function cacheKey(address: string, eventName: string, args: any, fromBlock: bigint): string {
  return `${address}-${eventName}-${JSON.stringify(args ?? {})}-${fromBlock}`;
}

async function fetchChunk(
  publicClient: PublicClient,
  params: { address: `0x${string}`; event: any; args?: Record<string, any> },
  from: bigint,
  to: bigint,
  depth = 0
): Promise<any[]> {
  try {
    return await publicClient.getLogs({
      address: params.address,
      event: params.event,
      args: params.args,
      fromBlock: from,
      toBlock: to,
    });
  } catch {
    // Stop splitting if range is tiny or depth limit reached (prevents exponential explosion on rate-limit)
    if (depth >= MAX_SPLIT_DEPTH || to - from < 500n) return [];
    const mid = from + (to - from) / 2n;
    const [a, b] = await Promise.all([
      fetchChunk(publicClient, params, from, mid, depth + 1),
      fetchChunk(publicClient, params, mid + 1n, to, depth + 1),
    ]);
    return [...a, ...b];
  }
}

export async function getLogsAll(
  publicClient: PublicClient,
  params: {
    address: `0x${string}`;
    event: any;
    args?: Record<string, any>;
    fromBlock: bigint;
  }
): Promise<any[]> {
  const key = cacheKey(params.address, params.event?.name ?? "?", params.args, params.fromBlock);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const toBlock = await publicClient.getBlockNumber();

  // Build chunk ranges
  const ranges: [bigint, bigint][] = [];
  for (let from = params.fromBlock; from <= toBlock; from += CHUNK) {
    const to = from + CHUNK - 1n < toBlock ? from + CHUNK - 1n : toBlock;
    ranges.push([from, to]);
  }

  // Fetch in parallel batches with delay to avoid rate-limiting
  const results: any[] = [];
  for (let i = 0; i < ranges.length; i += BATCH_SIZE) {
    const batch = ranges.slice(i, i + BATCH_SIZE);
    const batchLogs = await Promise.all(
      batch.map(([from, to]) => fetchChunk(publicClient, params, from, to))
    );
    results.push(...batchLogs.flat());
    if (i + BATCH_SIZE < ranges.length) {
      await new Promise<void>((r) => setTimeout(r, BATCH_DELAY));
    }
  }

  cache.set(key, { data: results, expiresAt: Date.now() + CACHE_TTL });
  return results;
}

export function clearLogsCache(address?: string) {
  if (!address) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(address)) cache.delete(key);
  }
}
