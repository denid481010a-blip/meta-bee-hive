const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const DAI_ADDRESS = "0x5f16136A46E1BFdA83d8D1D8C1f7Ef090Cb5a24f";
  const TO = "0x6cC9A6ff1DFE14D02426F1C8Da3648612BE26c65";
  const AMOUNT = ethers.parseEther("1000");

  const dai = await ethers.getContractAt("MockDAI", DAI_ADDRESS);
  const tx = await dai.mint(TO, AMOUNT);
  await tx.wait();
  console.log(`✅ Заминчено 1000 DAI → ${TO}`);
  console.log("TX:", tx.hash);
}

main().catch(console.error);
