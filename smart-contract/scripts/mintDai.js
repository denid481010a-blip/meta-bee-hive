// Минтим DAI тестовым аккаунтам для тестирования
const { ethers } = require("hardhat");

async function main() {
  const [deployer, a1, a2, a3, a4, a5] = await ethers.getSigners();

  // Найдём MockDAI — он задеплоен первым на localhost
  const MockDAI = await ethers.getContractFactory("MockDAI");
  const dai = MockDAI.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  const amount = ethers.parseEther("10000"); // 10,000 DAI каждому

  const accounts = [deployer, a1, a2, a3, a4, a5];
  for (const acc of accounts) {
    await dai.mint(acc.address, amount);
    console.log(`✅ Заминчено 10,000 DAI → ${acc.address}`);
  }

  console.log("\nЭти аккаунты теперь могут покупать уровни!");
  console.log("Добавь их в MetaMask через приватные ключи из вывода hardhat node");
}

main().catch(console.error);
