const { createPublicClient, http, keccak256, toBytes } = require("viem");
const { hardhat, polygon } = require("viem/chains");
const db = require("./db");

const CONTRACT_ADDRESS = /** @type {`0x${string}`} */ (process.env.CONTRACT_ADDRESS);
const RPC_URL          = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const START_BLOCK      = BigInt(process.env.START_BLOCK ?? "0");
const CHUNK_SIZE       = 2000n;
const POLL_INTERVAL_MS = 10_000;

// Use hardhat chain for local, polygon for mainnet
const chain = RPC_URL.includes("127.0.0.1") || RPC_URL.includes("localhost") ? hardhat : polygon;

const client = createPublicClient({
  chain,
  transport: http(RPC_URL),
});

// Compute event topic signatures — must match exactly what's in the contract
// event UserRegistered(address indexed user, address indexed referrer)
// event HiveBought(address indexed user, uint8 indexed level, uint256 price)
// event PaymentSent(address indexed from, address indexed to, uint8 indexed level, uint256 amount, uint8 slot)
// event OverflowSkip(address indexed skipped, uint8 level)
// event HiveCycled(address indexed user, uint8 indexed level, uint32 cycles)
const TOPICS = {
  UserRegistered: keccak256(toBytes("UserRegistered(address,address)")),
  HiveBought:     keccak256(toBytes("HiveBought(address,uint8,uint256)")),
  PaymentSent:    keccak256(toBytes("PaymentSent(address,address,uint8,uint256,uint8)")),
  OverflowSkip:   keccak256(toBytes("OverflowSkip(address,uint8)")),
  HiveCycled:     keccak256(toBytes("HiveCycled(address,uint8,uint32)")),
};

// Reverse lookup
const TOPIC_NAMES = Object.fromEntries(Object.entries(TOPICS).map(([k, v]) => [v, k]));

function getLastBlock() {
  const row = db.prepare("SELECT value FROM indexer_state WHERE key = 'last_block'").get();
  return row ? BigInt(row.value) : START_BLOCK - 1n;
}

function setLastBlock(block) {
  db.prepare("INSERT OR REPLACE INTO indexer_state(key, value) VALUES('last_block', ?)").run(String(block));
}

async function getBlockTimestamp(blockNumber) {
  try {
    const block = await client.getBlock({ blockNumber });
    return Number(block.timestamp);
  } catch {
    return Math.floor(Date.now() / 1000);
  }
}

// Helper to decode address from topic (32-byte topic -> 20-byte address)
function topicToAddress(topic) {
  return ("0x" + topic.slice(26)).toLowerCase();
}

// Helper to decode uint from 32-byte hex data chunk
function decodeUint(hex32) {
  return parseInt(hex32, 16);
}

async function processLogs(fromBlock, toBlock) {
  let logs;
  try {
    logs = await client.getLogs({ address: CONTRACT_ADDRESS, fromBlock, toBlock });
  } catch (e) {
    console.error("getLogs error:", e.message);
    return;
  }

  if (logs.length === 0) return;

  // Fetch timestamps
  const blockTimestamps = new Map();
  for (const log of logs) {
    if (!blockTimestamps.has(log.blockNumber)) {
      const ts = await getBlockTimestamp(log.blockNumber);
      blockTimestamps.set(log.blockNumber, ts);
    }
  }

  for (const log of logs) {
    const ts    = blockTimestamps.get(log.blockNumber) ?? Math.floor(Date.now() / 1000);
    const bn    = Number(log.blockNumber);
    const tx    = log.transactionHash;
    const topic = log.topics[0];
    const name  = TOPIC_NAMES[topic];

    if (!name) continue;

    // Strip 0x from data for hex parsing
    const data = log.data ? log.data.slice(2) : "";

    try {
      if (name === "UserRegistered") {
        // topics: [sig, indexed user, indexed referrer]
        const user     = topicToAddress(log.topics[1]);
        const referrer = topicToAddress(log.topics[2]);
        db.prepare("INSERT OR IGNORE INTO users(address,referrer,registered_at,block_number) VALUES(?,?,?,?)")
          .run(user, referrer, ts, bn);
        console.log(`  [UserRegistered] ${user} <- ${referrer}`);
      }
      else if (name === "HiveBought") {
        // topics: [sig, indexed user, indexed level]
        // data: [price uint256]
        const user  = topicToAddress(log.topics[1]);
        const level = decodeUint(log.topics[2].slice(2)); // level is indexed uint8
        const price = data.length >= 64 ? BigInt("0x" + data.slice(0, 64)).toString() : "0";
        db.prepare("INSERT OR IGNORE INTO hive_levels(address,level,cycle,bought_at,block_number) VALUES(?,?,?,?,?)")
          .run(user, level, 0, ts, bn);
        console.log(`  [HiveBought] ${user} level=${level} price=${price}`);
      }
      else if (name === "PaymentSent") {
        // topics: [sig, indexed from, indexed to, indexed level]
        // data: [amount uint256, slot uint8]
        const from   = topicToAddress(log.topics[1]);
        const to     = topicToAddress(log.topics[2]);
        const level  = decodeUint(log.topics[3].slice(2)); // level is indexed uint8
        const amount = data.length >= 64 ? BigInt("0x" + data.slice(0, 64)).toString() : "0";
        const slot   = data.length >= 128 ? decodeUint(data.slice(64, 128)) : 0;
        db.prepare("INSERT OR IGNORE INTO payments(type,address,counterpart,level,amount_wei,tx_hash,block_number,timestamp) VALUES(?,?,?,?,?,?,?,?)")
          .run("income",  to,   from, level, amount, tx, bn, ts);
        db.prepare("INSERT OR IGNORE INTO payments(type,address,counterpart,level,amount_wei,tx_hash,block_number,timestamp) VALUES(?,?,?,?,?,?,?,?)")
          .run("expense", from, to,   level, amount, tx, bn, ts);
        console.log(`  [PaymentSent] ${from} -> ${to} level=${level} amount=${amount} slot=${slot}`);
      }
      else if (name === "HiveCycled") {
        // topics: [sig, indexed user, indexed level]
        // data: [cycles uint32]
        const user   = topicToAddress(log.topics[1]);
        const level  = decodeUint(log.topics[2].slice(2));
        const cycles = data.length >= 64 ? decodeUint(data.slice(0, 64)) : 0;
        db.prepare("UPDATE hive_levels SET cycle=? WHERE address=? AND level=?").run(cycles, user, level);
        console.log(`  [HiveCycled] ${user} level=${level} cycles=${cycles}`);
      }
      else if (name === "OverflowSkip") {
        // topics: [sig, indexed skipped]
        // data: [level uint8]
        const skipped = topicToAddress(log.topics[1]);
        const level   = data.length >= 64 ? decodeUint(data.slice(0, 64)) : 0;
        console.log(`  [OverflowSkip] ${skipped} level=${level}`);
      }
    } catch (e) {
      console.error("Log parse error:", name, e.message);
    }
  }

  db.prepare("UPDATE global_stats SET total_users=(SELECT COUNT(*) FROM users), total_payments=(SELECT COUNT(*) FROM payments WHERE type='income'), last_updated=? WHERE id=1")
    .run(Math.floor(Date.now() / 1000));

  console.log(`Indexed blocks ${fromBlock}->${toBlock} (${logs.length} events)`);
}

async function runOnce() {
  const latestBlock = await client.getBlockNumber();
  let fromBlock = getLastBlock() + 1n;

  if (fromBlock > latestBlock) return;

  while (fromBlock <= latestBlock) {
    const toBlock = fromBlock + CHUNK_SIZE - 1n < latestBlock
      ? fromBlock + CHUNK_SIZE - 1n
      : latestBlock;
    await processLogs(fromBlock, toBlock);
    setLastBlock(toBlock);
    fromBlock = toBlock + 1n;
  }
}

async function ensureRootUser() {
  // ROOT регистрируется в контракте без события UserRegistered
  // Получим root адрес из контракта и добавим в БД если отсутствует
  try {
    const rootAddress = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: [{ name: "root", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }],
      functionName: "root",
    });
    const rootLower = rootAddress.toLowerCase();

    // Добавим пользователя
    const ts = Math.floor(Date.now() / 1000);
    db.prepare("INSERT OR IGNORE INTO users(address,referrer,registered_at,block_number) VALUES(?,?,?,?)")
      .run(rootLower, rootLower, ts, 0);

    // Добавим все 10 уровней root (они активны с самого начала)
    for (let level = 1; level <= 10; level++) {
      db.prepare("INSERT OR IGNORE INTO hive_levels(address,level,cycle,bought_at,block_number) VALUES(?,?,?,?,?)")
        .run(rootLower, level, 0, ts, 0);
    }

    console.log(`Root user ensured in DB: ${rootLower}`);
  } catch (e) {
    console.error("ensureRootUser error:", e.message);
  }
}

async function startIndexer() {
  console.log("Starting indexer...");
  console.log("   Topics:", TOPICS);

  await ensureRootUser().catch(console.error);
  await runOnce().catch(console.error);

  setInterval(async () => {
    await runOnce().catch(console.error);
  }, POLL_INTERVAL_MS);
}

module.exports = { startIndexer };
