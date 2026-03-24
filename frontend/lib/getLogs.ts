import type { PublicClient } from "viem";

const CHUNK = 9000n;

/**
 * Fetches logs in chunks to work around public RPC block range limits.
 * publicnode.com allows up to 10,000 blocks per request.
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
      // skip failed chunk
    }
  }

  return results;
}
