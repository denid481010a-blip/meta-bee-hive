const { ethers } = require("hardhat");
async function main() {
  const dai = await ethers.getContractAt("MockDAI", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const to = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const amount = ethers.parseEther("10000");
  await dai.mint(to, amount);
  const bal = await dai.balanceOf(to);
  console.log(`✅ Баланс ${to}: ${ethers.formatEther(bal)} DAI`);
}
main().catch(console.error);
