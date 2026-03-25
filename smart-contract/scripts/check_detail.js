const { ethers } = require("hardhat");

async function main() {
  const CONTRACT = "0x6C5801296b1B010B13dB4d758eB153D3F4167082";
  const SYSTEM   = "0xd640bfA4D359f17b637Ba80423C322c4dCcD0D15";
  const UNKNOWN  = "0xF238Da6BCF9D657add6F1644318223b6E3256438";

  const bhs = await ethers.getContractAt("BeeHiveSystem", CONTRACT);

  // Уровни systemWallet
  const stats = await bhs.getStats(SYSTEM);
  console.log("=== SYSTEM_WALLET ===");
  console.log("registered:", stats.registered);
  console.log("referrer:  ", stats.referrer);
  const levels = stats.levels.map((v, i) => v ? `H${i+1}` : null).filter(Boolean);
  console.log("active levels:", levels.join(", ") || "none");
  console.log("totalEarned:", ethers.formatEther(stats.totalEarned));

  // Кто такой неизвестный рефер?
  const unknownStats = await bhs.getStats(UNKNOWN);
  console.log("\n=== REFERRER of SYSTEM_WALLET ===");
  console.log("address:    ", UNKNOWN);
  console.log("registered:", unknownStats.registered);
  console.log("totalEarned:", ethers.formatEther(unknownStats.totalEarned));
}

main().catch(console.error);
