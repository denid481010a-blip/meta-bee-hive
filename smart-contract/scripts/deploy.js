/**
 * Скрипт деплоя BeeHiveSystem (UUPS Proxy) на Polygon
 *
 * Использование:
 *   Локально:  npx hardhat run scripts/deploy.js --network localhost
 *   Тестнет:   npx hardhat run scripts/deploy.js --network polygonMumbai
 *   Mainnet:   npx hardhat run scripts/deploy.js --network polygon
 *
 * Переменные окружения (.env):
 *   PRIVATE_KEY        — приватный ключ деплоера
 *   ROOT_ADDRESS       — адрес root-аккаунта
 *   SYSTEM_WALLET      — адрес для 10% комиссии
 *   DAI_ADDRESS        — адрес DAI в сети (не нужен для localhost)
 */

const { ethers, upgrades } = require("hardhat");

const DAI_ADDRESSES = {
  polygon:       "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  polygonMumbai: "0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F",
  hardhat:       null,
  localhost:     null,
};

async function main() {
  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();

  console.log(`\n🚀 Деплой на: ${network}`);
  console.log(`Деплоер: ${deployer.address}\n`);

  // ── DAI ───────────────────────────────────────────────────────────────────
  let daiAddress = DAI_ADDRESSES[network];

  if (!daiAddress) {
    const MockDAI = await ethers.getContractFactory("MockDAI");
    const mock = await MockDAI.deploy();
    await mock.waitForDeployment();
    daiAddress = await mock.getAddress();
    console.log(`MockDAI: ${daiAddress}`);
  }

  const rootAddress  = process.env.ROOT_ADDRESS  || deployer.address;
  const systemWallet = process.env.SYSTEM_WALLET || deployer.address;
  const owner        = process.env.OWNER_ADDRESS || deployer.address;

  // ── Деплой через UUPS Proxy ───────────────────────────────────────────────
  const BHS = await ethers.getContractFactory("BeeHiveSystem");

  const proxy = await upgrades.deployProxy(
    BHS,
    [daiAddress, rootAddress, systemWallet, owner],
    { initializer: "initialize", kind: "uups" }
  );
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implAddress  = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`✅ Proxy (основной адрес): ${proxyAddress}`);
  console.log(`   Implementation:         ${implAddress}`);

  // ── Проверка цен ──────────────────────────────────────────────────────────
  console.log("\nЦены уровней:");
  const prices = await proxy.getAllPrices();
  prices.forEach((p, i) =>
    console.log(`  H${i + 1}: ${ethers.formatEther(p)} DAI`)
  );

  console.log("\n═══════════════════════════════════════════");
  console.log("Для фронтенда:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${proxyAddress}`);
  console.log(`NEXT_PUBLIC_DAI_ADDRESS=${daiAddress}`);
  console.log("═══════════════════════════════════════════");
  console.log("\nЧтобы заморозить контракт навсегда:");
  console.log(`  proxy.renounceOwnership()`);
  console.log("═══════════════════════════════════════════\n");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
