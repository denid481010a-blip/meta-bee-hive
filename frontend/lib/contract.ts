export const BHS_ABI = [
  // ── Register ──────────────────────────────────────────────────────────────
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "referrer", type: "address" }],
    outputs: [],
  },
  // ── Buy Hive ──────────────────────────────────────────────────────────────
  {
    name: "buyHive",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "level", type: "uint8" }],
    outputs: [],
  },
  // ── Set Auto Buy ──────────────────────────────────────────────────────────
  {
    name: "setAutoBuy",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [{ name: "enabled", type: "bool" }],
    outputs: [],
  },
  // ── Withdraw Pending ──────────────────────────────────────────────────────
  {
    name: "withdrawPending",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [],
    outputs: [],
  },
  // ── Get Stats ─────────────────────────────────────────────────────────────
  {
    name: "getStats",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "user", type: "address" }],
    outputs: [
      { name: "referrer",     type: "address" },
      { name: "registered",   type: "bool" },
      { name: "levels",       type: "bool[10]" },
      { name: "autoBuy",      type: "bool" },
      { name: "totalEarned",  type: "uint256" },
      { name: "totalSpent",   type: "uint256" },
      { name: "pending",      type: "uint256" },
    ],
  },
  // ── Get Matrix ────────────────────────────────────────────────────────────
  {
    name: "getMatrix",
    type: "function",
    stateMutability: "view",
    inputs:  [
      { name: "user",  type: "address" },
      { name: "level", type: "uint8" },
    ],
    outputs: [
      { name: "slots",     type: "address[4]" },
      { name: "slotCount", type: "uint8" },
      { name: "cycles",    type: "uint32" },
    ],
  },
  // ── Get All Prices ────────────────────────────────────────────────────────
  {
    name: "getAllPrices",
    type: "function",
    stateMutability: "view",
    inputs:  [],
    outputs: [{ name: "", type: "uint256[10]" }],
  },
  // ── Get Price ─────────────────────────────────────────────────────────────
  {
    name: "getPrice",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "level", type: "uint8" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  // ── Preview Upline ────────────────────────────────────────────────────────
  {
    name: "previewUpline",
    type: "function",
    stateMutability: "view",
    inputs:  [
      { name: "user",  type: "address" },
      { name: "level", type: "uint8" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  // ── Pending Balance ───────────────────────────────────────────────────────
  {
    name: "pendingBalance",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  // ── Events ────────────────────────────────────────────────────────────────
  {
    name: "UserRegistered",
    type: "event",
    inputs: [
      { name: "user",     type: "address", indexed: true },
      { name: "referrer", type: "address", indexed: true },
    ],
  },
  {
    name: "HiveBought",
    type: "event",
    inputs: [
      { name: "user",  type: "address", indexed: true },
      { name: "level", type: "uint8",   indexed: true },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    name: "PaymentSent",
    type: "event",
    inputs: [
      { name: "from",   type: "address", indexed: true },
      { name: "to",     type: "address", indexed: true },
      { name: "level",  type: "uint8",   indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "slot",   type: "uint8",   indexed: false },
    ],
  },
  {
    name: "HiveCycled",
    type: "event",
    inputs: [
      { name: "user",  type: "address", indexed: true },
      { name: "level", type: "uint8",   indexed: true },
      { name: "cycle", type: "uint32",  indexed: false },
    ],
  },
  {
    name: "AutoBuyTriggered",
    type: "event",
    inputs: [
      { name: "user",  type: "address", indexed: true },
      { name: "level", type: "uint8",   indexed: false },
    ],
  },
  {
    name: "PendingWithdrawn",
    type: "event",
    inputs: [
      { name: "user",   type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

// ── DAI ERC-20 ABI (минимальный) ──────────────────────────────────────────
export const DAI_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs:  [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs:  [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
