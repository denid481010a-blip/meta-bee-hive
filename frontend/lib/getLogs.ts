import type { PublicClient } from "viem";

// Simple in-memory cache: key → { data, expiresAt }
const cache = new Map<string, { data: any[]; expiresAt: number }>();
const CACHE_TTL = 5 * 60_000; // 5 minutes

function cacheKey(address: string, eventName: string, args: any, fromBlock: bigint): string {
  return `${address}-${eventName}-${JSON.stringify(args ?? {})}-${fromBlock}`;
}

/**
 * Single getLogs call. Returns logs or throws.
 */
async function fetchRange(
  publicClient: PublicClient,
  params: { address: `0x${string}`; event: any; args?: Record<string, any> },
  from: bigint,
  to: bigint
): Promise<any[]> {
  return publicClient.getLogs({
    address: params.address,
    event: params.event,
    args: params.args,
    fromBlock: from,
    toBlock: to,
  });
}

/**
 * Fetch a range, splitting recursively on failure until chunks are small enough.
 */
async function fetchSplit(
  publicClient: PublicClient,
  params: { address: `0x${string}`; event: any; args?: Record<string, any> },
  from: bigint,
  to: bigint
): Promise<any[]> {
  try {
    return await fetchRange(publicClient, params, from, to);
  } catch {
    const size = to - from;
    if (size < 100n) return [];
    const mid = from + size / 2n;
    const [a, b] = await Promise.all([
      fetchSplit(publicClient, params, from, mid),
      fetchSplit(publicClient, params, mid + 1n, to),
    ]);
    return [...a, ...b];
  }
}

/**
 * Fetches logs efficiently:
 * 1. First tries full range in one call (works for indexed/specific filters).
 * 2. On failure, splits into parallel chunks of CHUNK_SIZE and recurse-splits on error.
 * Results are cached for 5 minutes.
 */
export async function getLogsAll(
  publicClient: PublicClient,
  params: {
    address: `0x${string}`;
    event: any;
    args?: Record<string, any>;
    fromBlock: bigint;
  }
): Promise<any[]> {
  const eventName = params.event?.name ?? "unknown";
  const key = cacheKey(params.address, eventName, params.args, params.fromBlock);

  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const toBlock = await publicClient.getBlockNumber();

  // Step 1: try full range (best case — 1 request)
  let results: any[];
  try {
    results = await fetchRange(publicClient, params, params.fromBlock, toBlock);
  } catch {
    // Step 2: split into parallel chunks of 100k blocks
    const CHUNK = 100_000n;
    const ranges: Array<[bigint, bigint]> = [];
    for (let from = params.fromBlock; from <= toBlock; from += CHUNK) {
      const to = from + CHUNK - 1n < toBlock ? from + CHUNK - 1n : toBlock;
      ranges.push([from, to]);
    }

    // Fetch all chunks in parallel, each will auto-split on error
    const BATCH = 10;
    const allLogs: any[] = [];
    for (let i = 0; i < ranges.length; i += BATCH) {
      const batch = ranges.slice(i, i + BATCH);
      const batchResults = await Promise.all(
        batch.map(([from, to]) => fetchSplit(publicClient, params, from, to))
      );
      allLogs.push(...batchResults.flat());
    }
    results = allLogs;
  }

  cache.set(key, { data: results, expiresAt: Date.now() + CACHE_TTL });
  return results;
}

/** Clear cached logs for a specific address (call after user action like buy/register) */
export function clearLogsCache(address?: string) {
  if (!address) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(address.toLowerCase()) || key.includes(address)) {
      cache.delete(key);
    }
  }
}
