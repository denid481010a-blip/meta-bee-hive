import type { PublicClient } from "viem";
import { supabase } from "./supabase";
import { CONTRACT_ADDRESS, DEPLOY_BLOCK } from "./constants";
import { BHS_ABI } from "./contract";
import { getLogsAll } from "./getLogs";

export interface Payment {
  type:        "income" | "expense";
  level:       number;
  amount:      bigint;
  from:        string;
  to:          string;
  txHash:      string;
  blockNumber: bigint;
}

/** Load payments from Supabase. Returns [] if table empty. */
async function loadFromSupabase(wallet: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("wallet", wallet.toLowerCase())
    .order("block_number", { ascending: false })
    .limit(500);

  if (error || !data) return [];
  return data.map((r) => ({
    type:        r.type as "income" | "expense",
    level:       r.level,
    amount:      BigInt(r.amount),
    from:        r.from_address,
    to:          r.to_address,
    txHash:      r.tx_hash,
    blockNumber: BigInt(r.block_number),
  }));
}

/** Fetch the highest block_number we already have for this wallet */
async function getLastIndexedBlock(wallet: string): Promise<bigint> {
  const { data } = await supabase
    .from("payments")
    .select("block_number")
    .eq("wallet", wallet.toLowerCase())
    .order("block_number", { ascending: false })
    .limit(1);

  if (data && data.length > 0) return BigInt(data[0].block_number);
  return DEPLOY_BLOCK - 1n;
}

/** Fetch new events from blockchain and upsert into Supabase */
async function indexNewEvents(wallet: string, publicClient: PublicClient): Promise<void> {
  const fromBlock = (await getLastIndexedBlock(wallet)) + 1n;
  const currentBlock = await publicClient.getBlockNumber();
  if (fromBlock > currentBlock) return;

  const [incomeLogs, expenseLogs] = await Promise.all([
    getLogsAll(publicClient as any, {
      address: CONTRACT_ADDRESS,
      event: BHS_ABI.find((e) => e.name === "PaymentSent") as any,
      args: { to: wallet as `0x${string}` },
      fromBlock,
    }).catch(() => []),
    getLogsAll(publicClient as any, {
      address: CONTRACT_ADDRESS,
      event: BHS_ABI.find((e) => e.name === "HiveBought") as any,
      args: { user: wallet as `0x${string}` },
      fromBlock,
    }).catch(() => []),
  ]);

  const rows = [
    ...incomeLogs.map((log: any) => ({
      wallet:       wallet.toLowerCase(),
      type:         "income",
      level:        Number(log.args.level),
      amount:       log.args.amount.toString(),
      from_address: (log.args.from as string).toLowerCase(),
      to_address:   (log.args.to as string).toLowerCase(),
      tx_hash:      log.transactionHash,
      block_number: Number(log.blockNumber),
    })),
    ...expenseLogs.map((log: any) => ({
      wallet:       wallet.toLowerCase(),
      type:         "expense",
      level:        Number(log.args.level),
      amount:       log.args.price.toString(),
      from_address: wallet.toLowerCase(),
      to_address:   CONTRACT_ADDRESS.toLowerCase(),
      tx_hash:      log.transactionHash,
      block_number: Number(log.blockNumber),
    })),
  ];

  if (rows.length > 0) {
    await supabase.from("payments").upsert(rows, {
      onConflict: "tx_hash,type,wallet",
      ignoreDuplicates: true,
    });
  }
}

/**
 * Main function: returns cached payments instantly, then refreshes in background.
 * onUpdate is called with fresh data after background sync completes.
 */
export async function getPayments(
  wallet: string,
  publicClient: PublicClient,
  onUpdate: (payments: Payment[]) => void
): Promise<Payment[]> {
  const cached = await loadFromSupabase(wallet);

  // Background sync — does NOT block rendering
  indexNewEvents(wallet, publicClient)
    .then(() => loadFromSupabase(wallet))
    .then(onUpdate)
    .catch(() => {});

  return cached;
}
