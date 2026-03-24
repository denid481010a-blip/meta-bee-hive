const BHS_ABI = [
  // Events
  {
    type: "event",
    name: "UserRegistered",
    inputs: [
      { name: "user",     type: "address", indexed: true },
      { name: "referrer", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "HiveBought",
    inputs: [
      { name: "user",  type: "address", indexed: true },
      { name: "level", type: "uint8",   indexed: false },
      { name: "cycle", type: "uint32",  indexed: false },
    ],
  },
  {
    type: "event",
    name: "PaymentSent",
    inputs: [
      { name: "from",   type: "address", indexed: true  },
      { name: "to",     type: "address", indexed: true  },
      { name: "level",  type: "uint8",   indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OverflowSkip",
    inputs: [
      { name: "from",   type: "address", indexed: true  },
      { name: "to",     type: "address", indexed: true  },
      { name: "level",  type: "uint8",   indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "HiveCycled",
    inputs: [
      { name: "user",  type: "address", indexed: true  },
      { name: "level", type: "uint8",   indexed: false },
      { name: "cycle", type: "uint32",  indexed: false },
    ],
  },
];

module.exports = { BHS_ABI };
