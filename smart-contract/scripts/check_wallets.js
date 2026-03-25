const { ethers } = require("hardhat");

async function main() {
  const CONTRACT = "0x6C5801296b1B010B13dB4d758eB153D3F4167082";
  const DAI      = "0x5f16136A46E1BFdA83d8D1D8C1f7Ef090Cb5a24f";
  const SYSTEM   = "0xd640bfA4D359f17b637Ba80423C322c4dCcD0D15";
  const ROOT     = "0x48aC1958e1454921d20C0801f392a130210D8930";
  const USER     = "0x6cC9A6ff1DFE14D02426F1C8Da3648612BE26c65";

  const bhs = await ethers.getContractAt("BeeHiveSystem", CONTRACT);
  const dai = await ethers.getContractAt("MockDAI", DAI);

  const rootAddr  = await bhs.root();
  const sysWallet = await bhs.systemWallet();
  console.log("root:        ", rootAddr);
  console.log("systemWallet:", sysWallet);

  for (const [name, addr] of [["SYSTEM_WALLET", SYSTEM], ["ROOT", ROOT], ["USER", USER]]) {
    const stats      = await bhs.getStats(addr);
    const daiBalance = await dai.balanceOf(addr);
    console.log(`\n[${name}] ${addr}`);
    console.log("  registered: ", stats.registered);
    console.log("  referrer:   ", stats.referrer);
    console.log("  DAI balance:", ethers.formatEther(daiBalance));
    console.log("  pending:    ", ethers.formatEther(stats.pending));
    console.log("  totalEarned:", ethers.formatEther(stats.totalEarned));
  }
}

main().catch(console.error);
