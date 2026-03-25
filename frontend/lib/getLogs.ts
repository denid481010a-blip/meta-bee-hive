import type { PublicClient } from "viem";

const CHUNK = 9000n; // Polygon Amoy official RPC limit is 10k
const CACHE_TTL = 5 * 60_000;

const cache = new Map<string, { data: any[]; expiresAt: number }>();

function cacheKey(address: string, eventName: string, args: any, fromBlock: bigint): string {
  return `${address}-${eventName}-${JSON.stringify(args ?? {})}-${fromBlock}`;
}

async function fetchChunk(
  publicClient: PublicClient,
  params: { address: `0x${string}`; event: any; args?: Record<string, any> },
  from: bigint,
  to: bigint
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
    if (to - from < 100n) return [];
    const mid = from + (to - from) / 2n;
    const [a, b] = await Promise.all([
      fetchChunk(publicClient, params, from, mid),
      fetchChunk(publicClient, params, mid + 1n, to),
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
  const results: any[] = [];

  // Parallel batches of 10 chunks
  const ranges: [bigint, bigint][] = [];
  for (let from = params.fromBlock; from <= toBlock; from += CHUNK) {
    const to = from + CHUNK - 1n < toBlock ? from + CHUNK - 1n : toBlock;
    ranges.push([from, to]);
  }

  for (let i = 0; i < ranges.length; i += 10) {
    const batch = ranges.slice(i, i + 10);
    const batchLogs = await Promise.all(
      batch.map(([from, to]) => fetchChunk(publicClient, params, from, to))
    );
    results.push(...batchLogs.flat());
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
