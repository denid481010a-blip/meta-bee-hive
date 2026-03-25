require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64); // заглушка для локального запуска

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    // Локальная сеть (hardhat node)
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Polygon testnet (Amoy)
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gasPrice: 30_000_000_000, // 30 gwei
    },

    // Polygon testnet (Mumbai)
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_RPC || "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gasPrice: 3_000_000_000, // 3 gwei
    },

    // Polygon mainnet
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC || "https://rpc-mainnet.matic.quiknode.pro",
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gasPrice: 200_000_000_000, // 200 gwei
    },
  },

  // Верификация на Polygonscan
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY || "",
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    token: "MATIC",
  },
};
