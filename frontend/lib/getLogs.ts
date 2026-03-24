import type { PublicClient } from "viem";

const CHUNK = 9000n;

// Simple in-memory cache: key → { data, expiresAt }
const cache = new Map<string, { data: any[]; expiresAt: number }>();
const CACHE_TTL = 60_000; // 60 seconds

function cacheKey(address: string, eventName: string, args: any, fromBlock: bigint): string {
  return `${address}-${eventName}-${JSON.stringify(args ?? {})}-${fromBlock}`;
}

/**
 * Fetches logs in 9000-block chunks to work around public RPC block range limits.
 * Results are cached for 60 seconds to prevent redundant full-history scans.
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

  // Return cached result if still fresh
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const toBlock = await publicClient.getBlockNumber();
  const results: any[] = [];

  for (let from = params.fromBlock; from <= toBlock; from += CHUNK) {
    const to = from + CHUNK - 1n < toBlock ? from + CHUNK - 1n : toBlock;
    try {
      const logs = await publicClient.getLogs({
        address: params.address,
        event: params.event,
        args: params.args,
        fromBlock: from,
        toBlock: to,
      });
      results.push(...logs);
    } catch {
      // retry once on failure
      try {
        const logs = await publicClient.getLogs({
          address: params.address,
          event: params.event,
          args: params.args,
          fromBlock: from,
          toBlock: to,
        });
        results.push(...logs);
      } catch {
        // skip chunk if retry also fails
      }
    }
  }

  // Store in cache
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
