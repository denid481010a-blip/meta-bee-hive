import type { PublicClient } from "viem";

const CHUNK = 1500n; // Alchemy free plan limits eth_getLogs to ~2000 blocks

// Simple in-memory cache: key → { data, expiresAt }
const cache = new Map<string, { data: any[]; expiresAt: number }>();
const CACHE_TTL = 60_000; // 60 seconds

function cacheKey(address: string, eventName: string, args: any, fromBlock: bigint): string {
  return `${address}-${eventName}-${JSON.stringify(args ?? {})}-${fromBlock}`;
}

async function fetchChunk(
  publicClient: PublicClient,
  params: { address: `0x${string}`; event: any; args?: Record<string, any> },
  from: bigint,
  to: bigint,
  chunkSize: bigint
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
    // On failure, halve the chunk and retry both halves
    if (chunkSize <= 100n) return []; // give up on very small chunks
    const mid = from + chunkSize / 2n;
    if (mid >= to) return [];
    const [a, b] = await Promise.all([
      fetchChunk(publicClient, params, from, mid, chunkSize / 2n),
      fetchChunk(publicClient, params, mid + 1n, to, chunkSize / 2n),
    ]);
    return [...a, ...b];
  }
}

/**
 * Fetches logs in chunks to work around RPC block range limits.
 * On chunk failure, halves the range and retries.
 * Results are cached for 60 seconds.
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
  const results: any[] = [];

  for (let from = params.fromBlock; from <= toBlock; from += CHUNK) {
    const to = from + CHUNK - 1n < toBlock ? from + CHUNK - 1n : toBlock;
    const logs = await fetchChunk(publicClient, params, from, to, CHUNK);
    results.push(...logs);
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
