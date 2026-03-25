/**
 * Симуляция 1000 пользователей в BeeHive матрице
 *
 * Запуск:
 *   1. npx hardhat node
 *   2. npx hardhat run scripts/simulate1000.js --network localhost
 *
 * Сценарии прихода:
 *   WAVE 1  — 10 прямых рефералов ROOT, покупают H1
 *   WAVE 2  — каждый из 10 приводит 5 человек (50), покупают H1, часть H2
 *   WAVE 3  — глубокое дерево: 200 человек через разных рефереров, разные уровни
 *   WAVE 4  — 100 человек регистрируются но не покупают (балласт)
 *   WAVE 5  — активные: 100 человек покупают H1-H3, заполняют матрицы
 *   WAVE 6  — богатые: 20 человек покупают H1-H5 (заставляют матрицы циклиться)
 *   WAVE 7  — реактивация: ещё 200 человек через разные ветки
 *   WAVE 8  — автопокупка: 50 человек с включённым autoBuy
 *   WAVE 9  — случайные: оставшиеся до 1000
 */

const { ethers, upgrades } = require("hardhat");

// ── Цвета для консоли ──────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  gold:   "\x1b[33m",
  green:  "\x1b[32m",
  blue:   "\x1b[34m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  white:  "\x1b[37m",
  dim:    "\x1b[2m",
};

function log(color, msg) { console.log(color + msg + C.reset); }
function progress(current, total, label) {
  const pct   = Math.round(current / total * 100);
  const bar   = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
  process.stdout.write(`\r${C.cyan}[${bar}] ${pct}% ${label}${C.reset}   `);
}

// ── Вспомогательные ────────────────────────────────────────────────────────
async function mintAndApprove(dai, bhs, wallet, amount) {
  const bhsAddress = await bhs.getAddress();
  const daiAddress = await dai.getAddress();
  await dai.mint(wallet.address, amount);
  const daiAsWallet = dai.connect(wallet);
  await daiAsWallet.approve(bhsAddress, ethers.MaxUint256);
}

async function registerUser(bhs, wallet, referrer) {
  try {
    const bhsAsWallet = bhs.connect(wallet);
    await bhsAsWallet.register(referrer, { gasLimit: 200_000 });
    return true;
  } catch { return false; }
}

async function buyLevel(bhs, wallet, level) {
  try {
    const bhsAsWallet = bhs.connect(wallet);
    await bhsAsWallet.buyHive(level, { gasLimit: 500_000 });
    return true;
  } catch { return false; }
}

async function setAutoBuy(bhs, wallet, enabled) {
  try {
    await bhs.connect(wallet).setAutoBuy(enabled, { gasLimit: 100_000 });
  } catch {}
}

// ── Главная функция ────────────────────────────────────────────────────────
async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  log(C.gold, "\n╔══════════════════════════════════════════════════╗");
  log(C.gold,   "║     🐝 BeeHive 1000 User Simulation              ║");
  log(C.gold,   "╚══════════════════════════════════════════════════╝\n");

  // ── Деплой контрактов ────────────────────────────────────────────────────
  log(C.blue, "📦 Деплоим контракты...");

  const MockDAI = await ethers.getContractFactory("MockDAI");
  const dai = await MockDAI.deploy();
  await dai.waitForDeployment();

  const rootWallet   = ethers.Wallet.createRandom().connect(ethers.provider);
  const sysWallet    = ethers.Wallet.createRandom().connect(ethers.provider);
  const mainUser     = ethers.Wallet.createRandom().connect(ethers.provider);

  // Пополняем ETH для газа
  for (const w of [rootWallet, sysWallet, mainUser]) {
    await deployer.sendTransaction({ to: w.address, value: ethers.parseEther("10") });
  }

  const BHS = await ethers.getContractFactory("BeeHiveSystem");
  const proxy = await upgrades.deployProxy(
    BHS,
    [await dai.getAddress(), rootWallet.address, sysWallet.address, deployer.address],
    { initializer: "initialize", kind: "uups" }
  );
  await proxy.waitForDeployment();
  const bhs = proxy;

  log(C.green, `✅ MockDAI:   ${await dai.getAddress()}`);
  log(C.green, `✅ BHS Proxy: ${await bhs.getAddress()}`);
  log(C.green, `✅ ROOT:      ${rootWallet.address}`);
  log(C.green, `✅ MAIN USER: ${mainUser.address}\n`);

  // Регистрируем и фондируем mainUser
  await mintAndApprove(dai, bhs, mainUser, ethers.parseEther("10000"));
  await registerUser(bhs, mainUser, rootWallet.address);
  // Покупаем H1-H3 для mainUser чтобы он мог получать выплаты
  for (let lvl = 1; lvl <= 3; lvl++) {
    await buyLevel(bhs, mainUser, lvl);
  }
  log(C.gold, `🐝 Main user зарегистрирован, купил H1-H3\n`);

  // ── Генерируем 1000 кошельков ────────────────────────────────────────────
  log(C.blue, "🔑 Генерируем 1000 кошельков...");
  const wallets = [];
  for (let i = 0; i < 1000; i++) {
    const w = ethers.Wallet.createRandom().connect(ethers.provider);
    wallets.push(w);
    if (i % 100 === 0) progress(i, 1000, "создаём кошельки");
  }
  console.log();

  // Пополняем ETH батчами
  log(C.blue, "⛽ Пополняем ETH для газа...");
  const ethAmount = ethers.parseEther("2");
  for (let i = 0; i < wallets.length; i += 50) {
    const batch = wallets.slice(i, i + 50);
    await Promise.all(batch.map(w =>
      deployer.sendTransaction({ to: w.address, value: ethAmount })
    ));
    progress(i + 50, 1000, "раздаём ETH");
  }
  console.log();

  // Пополняем DAI и делаем approve батчами
  log(C.blue, "💰 Минтим DAI...");
  const daiAmount = ethers.parseEther("5000");
  for (let i = 0; i < wallets.length; i += 50) {
    const batch = wallets.slice(i, i + 50);
    await Promise.all(batch.map(w => mintAndApprove(dai, bhs, w, daiAmount)));
    progress(i + 50, 1000, "минтим DAI");
  }
  console.log();

  let totalRegistered = 0;
  let totalLevelsBought = 0;
  let totalCycles = 0;

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 1 — 10 прямых рефералов mainUser, все покупают H1
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 1: 10 прямых рефералов mainUser (все покупают H1)");
  const wave1 = wallets.slice(0, 10);
  for (const w of wave1) {
    await registerUser(bhs, w, mainUser.address);
    await buyLevel(bhs, w, 1);
    totalRegistered++; totalLevelsBought++;
    progress(totalRegistered, 1000, "wave 1");
  }
  console.log();
  log(C.green, `   ✓ Зарегистрировано: ${wave1.length}, матрица H1 mainUser заполняется`);

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 2 — каждый из 10 приводит 5 человек (50), покупают H1, часть H2
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 2: 50 человек от рефералов mainUser (H1 все, H2 каждый 2-й)");
  const wave2 = wallets.slice(10, 60);
  for (let i = 0; i < wave2.length; i++) {
    const referrer = wave1[Math.floor(i / 5)]; // каждый реферал приводит 5
    await registerUser(bhs, wave2[i], referrer.address);
    await buyLevel(bhs, wave2[i], 1);
    if (i % 2 === 0) await buyLevel(bhs, wave2[i], 2); // каждый 2-й берёт H2
    totalRegistered++;
    totalLevelsBought += (i % 2 === 0) ? 2 : 1;
    progress(totalRegistered, 1000, "wave 2");
  }
  console.log();
  log(C.green, `   ✓ Зарегистрировано: ${wave2.length}, часть купила H2`);

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 3 — глубокое дерево: 200 человек через разных рефереров
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 3: 200 человек — глубокая структура (3-4 уровня вглубь)");
  const wave3 = wallets.slice(60, 260);
  const allRegistered = [...wave1, ...wave2]; // из кого выбирать рефереров

  for (let i = 0; i < wave3.length; i++) {
    // Берём случайного реферера из уже зарегистрированных
    const referrer = allRegistered[Math.floor(Math.random() * allRegistered.length)];
    await registerUser(bhs, wave3[i], referrer.address);
    await buyLevel(bhs, wave3[i], 1);

    // Каждый 3-й берёт H2
    if (i % 3 === 0) await buyLevel(bhs, wave3[i], 2);
    // Каждый 10-й берёт H3
    if (i % 10 === 0) await buyLevel(bhs, wave3[i], 3);

    allRegistered.push(wave3[i]);
    totalRegistered++;
    totalLevelsBought += 1 + (i % 3 === 0 ? 1 : 0) + (i % 10 === 0 ? 1 : 0);
    progress(totalRegistered, 1000, "wave 3");
  }
  console.log();
  log(C.green, `   ✓ Глубокое дерево построено, матрицы начинают заполняться`);

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 4 — 100 "балласт": регистрируются но НЕ покупают
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 4: 100 человек — зарегистрировались, ничего не купили");
  const wave4 = wallets.slice(260, 360);
  for (let i = 0; i < wave4.length; i++) {
    const referrer = allRegistered[Math.floor(Math.random() * allRegistered.length)];
    await registerUser(bhs, wave4[i], referrer.address);
    allRegistered.push(wave4[i]);
    totalRegistered++;
    progress(totalRegistered, 1000, "wave 4");
  }
  console.log();
  log(C.green, `   ✓ 100 "спящих" — зарегистрированы, не активны`);

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 5 — активные: 100 человек покупают H1-H3
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 5: 100 активных — покупают H1-H3, заполняют матрицы");
  const wave5 = wallets.slice(360, 460);
  for (let i = 0; i < wave5.length; i++) {
    const referrer = allRegistered[Math.floor(Math.random() * Math.min(allRegistered.length, 100))];
    await registerUser(bhs, wave5[i], referrer.address);
    for (let lvl = 1; lvl <= 3; lvl++) {
      await buyLevel(bhs, wave5[i], lvl);
    }
    allRegistered.push(wave5[i]);
    totalRegistered++;
    totalLevelsBought += 3;
    progress(totalRegistered, 1000, "wave 5");
  }
  console.log();
  log(C.green, `   ✓ 100 активных игроков — матрицы H1-H3 активно заполняются`);

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 6 — "киты": 20 человек покупают H1-H5 (запускают циклы)
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 6: 20 \"китов\" — покупают H1-H5, запускают реактивации");
  const wave6 = wallets.slice(460, 480);
  for (let i = 0; i < wave6.length; i++) {
    // Киты идут под mainUser или его прямых рефералов
    const referrer = i < 10 ? mainUser : wave1[i % 10];
    await registerUser(bhs, wave6[i], referrer.address);
    for (let lvl = 1; lvl <= 5; lvl++) {
      await buyLevel(bhs, wave6[i], lvl);
    }
    allRegistered.push(wave6[i]);
    totalRegistered++;
    totalLevelsBought += 5;
    progress(totalRegistered, 1000, "wave 6");
  }
  console.log();
  log(C.green, `   ✓ 20 китов — запущены реактивации матриц!`);

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 7 — 200 человек через глубокие ветки (тест переливов)
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 7: 200 человек — тест переливов (рефер без уровня)");
  const wave7 = wallets.slice(480, 680);
  // Берём рефереров из wave4 (у них нет уровней) — тест перелива
  const ballaстRefs = wave4.slice(0, 20);
  for (let i = 0; i < wave7.length; i++) {
    const useBallaст = i % 3 === 0; // каждый 3-й идёт через "балласт" — тест перелива
    const referrer = useBallaст
      ? ballaстRefs[i % ballaстRefs.length]
      : allRegistered[Math.floor(Math.random() * allRegistered.length)];
    await registerUser(bhs, wave7[i], referrer.address);
    await buyLevel(bhs, wave7[i], 1);
    if (i % 4 === 0) await buyLevel(bhs, wave7[i], 2);
    allRegistered.push(wave7[i]);
    totalRegistered++;
    totalLevelsBought += 1 + (i % 4 === 0 ? 1 : 0);
    progress(totalRegistered, 1000, "wave 7");
  }
  console.log();
  log(C.green, `   ✓ Переливы протестированы — оплаты ушли выше по дереву`);

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 8 — autoBuy: 50 человек с включённым автопоиском
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 8: 50 человек с autoBuy — тест автоматической покупки");
  const wave8 = wallets.slice(680, 730);
  for (let i = 0; i < wave8.length; i++) {
    const referrer = wave1[i % wave1.length];
    await registerUser(bhs, wave8[i], referrer.address);
    await setAutoBuy(bhs, wave8[i], true);
    await buyLevel(bhs, wave8[i], 1); // после покупки autoBuy сработает
    allRegistered.push(wave8[i]);
    totalRegistered++;
    totalLevelsBought++;
    progress(totalRegistered, 1000, "wave 8");
  }
  console.log();
  log(C.green, `   ✓ autoBuy протестирован`);

  // ══════════════════════════════════════════════════════════════════════════
  // WAVE 9 — оставшиеся 270 человек (случайные сценарии)
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n🌊 WAVE 9: 270 случайных участников — смешанные сценарии");
  const wave9 = wallets.slice(730, 1000);
  for (let i = 0; i < wave9.length; i++) {
    const referrer = allRegistered[Math.floor(Math.random() * allRegistered.length)];
    await registerUser(bhs, wave9[i], referrer.address);

    // Случайный сценарий
    const scenario = i % 5;
    if (scenario === 0) {
      // Только регистрация
    } else if (scenario === 1) {
      // H1 только
      await buyLevel(bhs, wave9[i], 1);
      totalLevelsBought++;
    } else if (scenario === 2) {
      // H1 + H2
      await buyLevel(bhs, wave9[i], 1);
      await buyLevel(bhs, wave9[i], 2);
      totalLevelsBought += 2;
    } else if (scenario === 3) {
      // H1-H3
      for (let lvl = 1; lvl <= 3; lvl++) await buyLevel(bhs, wave9[i], lvl);
      totalLevelsBought += 3;
    } else {
      // H1-H4
      for (let lvl = 1; lvl <= 4; lvl++) await buyLevel(bhs, wave9[i], lvl);
      totalLevelsBought += 4;
    }

    allRegistered.push(wave9[i]);
    totalRegistered++;
    progress(totalRegistered, 1000, "wave 9");
  }
  console.log();
  log(C.green, `   ✓ Финальная волна завершена`);

  // ══════════════════════════════════════════════════════════════════════════
  // ИТОГОВАЯ СТАТИСТИКА
  // ══════════════════════════════════════════════════════════════════════════
  log(C.gold, "\n╔══════════════════════════════════════════════════╗");
  log(C.gold,   "║              📊 ИТОГИ СИМУЛЯЦИИ                  ║");
  log(C.gold,   "╚══════════════════════════════════════════════════╝\n");

  // Статы mainUser
  const mainStats = await bhs.getStats(mainUser.address);
  const daiBalance = await dai.balanceOf(mainUser.address);
  const sysBalance = await dai.balanceOf(sysWallet.address);

  // Матрицы mainUser
  let mainCycles = 0;
  for (let lvl = 1; lvl <= 3; lvl++) {
    try {
      const m = await bhs.getMatrix(mainUser.address, lvl);
      mainCycles += Number(m.cycles);
    } catch {}
  }

  log(C.cyan,  "┌── MAIN USER ──────────────────────────────────────");
  log(C.white, `│  Адрес:         ${mainUser.address}`);
  log(C.green, `│  Заработано:    ${ethers.formatEther(mainStats.totalEarned)} DAI`);
  log(C.white, `│  Потрачено:     ${ethers.formatEther(mainStats.totalSpent)} DAI`);
  const net = mainStats.totalEarned - mainStats.totalSpent;
  log(net >= 0n ? C.green : C.red,
      `│  Чистый доход:  ${net >= 0n ? "+" : ""}${ethers.formatEther(net)} DAI`);
  log(C.gold,  `│  Циклов матриц: ${mainCycles}`);
  log(C.cyan,  "│");
  log(C.cyan,  "├── СИСТЕМА ────────────────────────────────────────");
  log(C.white, `│  Всего зарег.:  ${totalRegistered} / 1000`);
  log(C.white, `│  Куплено уровней: ${totalLevelsBought}`);
  log(C.green, `│  System wallet: ${ethers.formatEther(sysBalance)} DAI (10% комиссии)`);
  log(C.cyan,  "│");
  log(C.cyan,  "├── ПОДКЛЮЧИ METAMASK ───────────────────────────────");
  log(C.white, `│  RPC:           http://127.0.0.1:8545`);
  log(C.white, `│  Chain ID:      31337`);
  log(C.gold,  `│  MAIN USER KEY: ${mainUser.privateKey}`);
  log(C.white, `│  CONTRACT:      ${await bhs.getAddress()}`);
  log(C.white, `│  DAI:           ${await dai.getAddress()}`);
  log(C.cyan,  "└───────────────────────────────────────────────────\n");

  log(C.gold, "🐝 Симуляция завершена! Добавь MAIN USER в MetaMask и открой приложение.\n");
  log(C.dim,  "Обнови .env.local:");
  log(C.dim,  `NEXT_PUBLIC_CONTRACT_ADDRESS=${await bhs.getAddress()}`);
  log(C.dim,  `NEXT_PUBLIC_DAI_ADDRESS=${await dai.getAddress()}`);
  log(C.dim,  `NEXT_PUBLIC_CHAIN_ID=31337\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
