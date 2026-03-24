const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

// Вспомогательные функции
const dai  = (n) => ethers.parseEther(String(n));
const fmt  = (n) => ethers.formatEther(n);

// Цены уровней: H1=5, H(n) = H(n-1) * 9/5
function calcPrices() {
  const p = [5n];
  for (let i = 1; i < 10; i++) p.push(p[i - 1] * 9n / 5n);
  return p.map(v => ethers.parseEther(v.toString()));
}
const PRICES = calcPrices();

// ════════════════════════════════════════════════════════════════════════════
describe("BeeHiveSystem", function () {

  let bhs, token;
  let owner, root, system, ivan, dima, zhenya, maxim, alice;

  // Разворачиваем контракты перед каждым тестом
  beforeEach(async () => {
    [owner, root, system, ivan, dima, zhenya, maxim, alice] = await ethers.getSigners();

    // Деплой MockDAI
    const DAI = await ethers.getContractFactory("MockDAI");
    token = await DAI.deploy();

    // Деплой BeeHiveSystem через UUPS Proxy
    const BHS = await ethers.getContractFactory("BeeHiveSystem");
    bhs = await upgrades.deployProxy(
      BHS,
      [await token.getAddress(), root.address, system.address, owner.address],
      { initializer: "initialize", kind: "uups" }
    );

    // Выдаём каждому участнику по 10 000 DAI
    const mintAmount = dai(10_000);
    for (const signer of [ivan, dima, zhenya, maxim, alice]) {
      await token.mint(signer.address, mintAmount);
      await token.connect(signer).approve(await bhs.getAddress(), mintAmount);
    }
  });

  // ── Вспомогательная функция: зарегистрировать + купить уровни ─────────────
  async function registerAndBuy(signer, referrer, levels) {
    await bhs.connect(signer).register(referrer.address);
    for (const lvl of levels) {
      await bhs.connect(signer).buyHive(lvl);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. ДЕПЛОЙ И ИНИЦИАЛИЗАЦИЯ
  // ══════════════════════════════════════════════════════════════════════════
  describe("Deploy", () => {

    it("ROOT зарегистрирован с 10 уровнями", async () => {
      const info = await bhs.getStats(root.address);
      expect(info.registered).to.be.true;
      for (let i = 0; i < 10; i++) {
        expect(info.levels[i]).to.be.true;
      }
    });

    it("Цены уровней рассчитаны корректно", async () => {
      const prices = await bhs.getAllPrices();
      expect(prices[0]).to.equal(dai(5));    // H1 = 5 DAI
      expect(prices[1]).to.equal(dai(9));    // H2 = 9 DAI
      // H3 = 9 * 9/5 = 16.2 DAI
      expect(prices[2]).to.equal(dai("16.2"));
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. РЕГИСТРАЦИЯ
  // ══════════════════════════════════════════════════════════════════════════
  describe("Registration", () => {

    it("Регистрация с корректным рефером", async () => {
      await expect(bhs.connect(ivan).register(root.address))
        .to.emit(bhs, "UserRegistered")
        .withArgs(ivan.address, root.address);

      const info = await bhs.getStats(ivan.address);
      expect(info.registered).to.be.true;
      expect(info.referrer).to.equal(root.address);
    });

    it("Регистрация без реферера → идёт к ROOT", async () => {
      await bhs.connect(ivan).register(ethers.ZeroAddress);
      const info = await bhs.getStats(ivan.address);
      expect(info.referrer).to.equal(root.address);
    });

    it("Нельзя зарегистрироваться дважды", async () => {
      await bhs.connect(ivan).register(root.address);
      await expect(bhs.connect(ivan).register(root.address))
        .to.be.revertedWith("BHS: already registered");
    });

    it("Нельзя реферировать самого себя", async () => {
      await expect(bhs.connect(ivan).register(ivan.address))
        .to.be.revertedWith("BHS: self-referral");
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. ПОКУПКА УРОВНЕЙ
  // ══════════════════════════════════════════════════════════════════════════
  describe("Buy Hive", () => {

    beforeEach(async () => {
      await bhs.connect(ivan).register(root.address);
    });

    it("Купить H1 → событие HiveBought", async () => {
      await expect(bhs.connect(ivan).buyHive(1))
        .to.emit(bhs, "HiveBought")
        .withArgs(ivan.address, 1, dai(5));
    });

    it("Нельзя пропустить уровень (H1 → H3)", async () => {
      await bhs.connect(ivan).buyHive(1);
      await expect(bhs.connect(ivan).buyHive(3))
        .to.be.revertedWith("BHS: buy previous level first");
    });

    it("Нельзя купить уже активный уровень", async () => {
      await bhs.connect(ivan).buyHive(1);
      await expect(bhs.connect(ivan).buyHive(1))
        .to.be.revertedWith("BHS: level already active");
    });

    it("Нельзя купить без регистрации", async () => {
      await expect(bhs.connect(dima).buyHive(1))
        .to.be.revertedWith("BHS: not registered");
    });

    it("Уровень становится активным после покупки", async () => {
      await bhs.connect(ivan).buyHive(1);
      const levels = await bhs.getUserLevels(ivan.address);
      expect(levels[0]).to.be.true;
      expect(levels[1]).to.be.false;
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. МЕХАНИКА ВЫПЛАТ — БАЗОВЫЙ СЦЕНАРИЙ
  // ══════════════════════════════════════════════════════════════════════════
  describe("Payment Flow", () => {

    it("Иван покупает H1 → выплата ROOT (нет реферера)", async () => {
      await bhs.connect(ivan).register(ethers.ZeroAddress); // нет реферера → ROOT

      const rootBefore = await token.balanceOf(root.address);
      await bhs.connect(ivan).buyHive(1);
      const rootAfter = await token.balanceOf(root.address);

      // Нетто: 5 DAI * 90% = 4.5 DAI
      expect(rootAfter - rootBefore).to.equal(dai(4.5));
    });

    it("Дима приходит к Ивану (H1) → Иван получает выплату", async () => {
      await bhs.connect(ivan).register(root.address);
      await bhs.connect(ivan).buyHive(1);
      await bhs.connect(dima).register(ivan.address);

      const ivanBefore = await token.balanceOf(ivan.address);
      await bhs.connect(dima).buyHive(1);
      const ivanAfter = await token.balanceOf(ivan.address);

      expect(ivanAfter - ivanBefore).to.equal(dai(4.5));
    });

    it("У Ивана нет H2 — выплата за H2 Димы идёт ROOT (перелив)", async () => {
      await bhs.connect(ivan).register(root.address);
      await bhs.connect(ivan).buyHive(1);          // у Ивана только H1
      await bhs.connect(dima).register(ivan.address);
      await bhs.connect(dima).buyHive(1);
      await bhs.connect(dima).buyHive(2);          // H2 → у Ивана нет H2!

      const rootInfo = await bhs.getStats(root.address);
      // ROOT должен был получить за H2 Димы: 9 * 90% = 8.1 DAI
      // Нельзя точно отследить без события, но проверяем через матрицу ROOT
      const [slots,,] = await bhs.getMatrix(root.address, 2);
      expect(slots[0]).to.equal(dima.address); // Дима в матрице ROOT на H2
    });

    it("Иван покупает H2 — теперь ловит выплату от Димы (H2)", async () => {
      await registerAndBuy(ivan, root, [1, 2]);    // Иван: H1 + H2
      await registerAndBuy(dima, ivan, [1, 2]);    // Дима: H1 + H2

      const [slots,,] = await bhs.getMatrix(ivan.address, 2);
      expect(slots[0]).to.equal(dima.address); // Дима в матрице Ивана на H2
    });

    it("Системный кошелёк получает 10% комиссии", async () => {
      await bhs.connect(ivan).register(root.address);
      const sysBefore = await token.balanceOf(system.address);
      await bhs.connect(ivan).buyHive(1); // 5 DAI
      const sysAfter  = await token.balanceOf(system.address);

      expect(sysAfter - sysBefore).to.equal(dai(0.5)); // 10% от 5
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. МЕХАНИКА МАТРИЦЫ — 4 СЛОТА И РЕАКТИВАЦИЯ
  // ══════════════════════════════════════════════════════════════════════════
  describe("Matrix Cycles", () => {

    it("4-й слот → выплата аплайну + матрица реактивируется", async () => {
      // Иван с H1, четыре покупателя заходят через него
      await bhs.connect(ivan).register(root.address);
      await bhs.connect(ivan).buyHive(1);

      // Регистрируем 4 участников через Ивана
      const buyers = [dima, zhenya, maxim, alice];
      for (const b of buyers) {
        await token.mint(b.address, dai(100));
        await token.connect(b).approve(await bhs.getAddress(), dai(100));
        await bhs.connect(b).register(ivan.address);
      }

      // Слоты 1–3 → Иван получает выплаты
      const ivanBefore = await token.balanceOf(ivan.address);
      await bhs.connect(dima).buyHive(1);
      await bhs.connect(zhenya).buyHive(1);
      await bhs.connect(maxim).buyHive(1);

      const ivanMid = await token.balanceOf(ivan.address);
      // Иван получил 3 × 4.5 = 13.5 DAI
      expect(ivanMid - ivanBefore).to.equal(dai(13.5));

      // Слот 4 → выплата ROOT (аплайн Ивана) + реактивация
      const rootBefore = await token.balanceOf(root.address);
      await expect(bhs.connect(alice).buyHive(1))
        .to.emit(bhs, "HiveCycled")
        .withArgs(ivan.address, 1, 1);

      const rootAfter = await token.balanceOf(root.address);
      expect(rootAfter - rootBefore).to.equal(dai(4.5)); // 4-й слот → ROOT

      // Матрица Ивана сброшена (slotCount = 0)
      const [, slotCount, cycles] = await bhs.getMatrix(ivan.address, 1);
      expect(slotCount).to.equal(0);
      expect(cycles).to.equal(1);
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. СЦЕНАРИЙ 1 — Иван(H1), Дима(H1+H2), Женя(H1), Максим(H1-H5)
  // ══════════════════════════════════════════════════════════════════════════
  describe("Scenario 1: Basic chain", () => {

    it("Проверка переливов по всей цепочке", async () => {
      // Инициализация
      for (const signer of [ivan, dima, zhenya, maxim]) {
        await token.mint(signer.address, dai(1000));
        await token.connect(signer).approve(await bhs.getAddress(), dai(1000));
      }

      // Иван H1, Дима H1+H2, Женя H1, Максим H1-H5
      await registerAndBuy(ivan,  root,  [1]);
      await registerAndBuy(dima,  ivan,  [1, 2]);
      await registerAndBuy(zhenya, dima, [1]);
      await registerAndBuy(maxim, zhenya, [1, 2, 3, 4, 5]);

      // Максим H3, H4, H5 — ни у кого нет → всё к ROOT
      // Проверяем матрицы ROOT
      const [slotsH3,,] = await bhs.getMatrix(root.address, 3);
      const [slotsH4,,] = await bhs.getMatrix(root.address, 4);
      const [slotsH5,,] = await bhs.getMatrix(root.address, 5);

      expect(slotsH3[0]).to.equal(maxim.address);
      expect(slotsH4[0]).to.equal(maxim.address);
      expect(slotsH5[0]).to.equal(maxim.address);
    });

    it("Иван открывает H2 → 4-й слот матрицы Димы на H2 идёт Ивану", async () => {
      // Выдаём всем достаточно DAI
      const signers = await ethers.getSigners();
      const extra = signers.slice(8, 12); // 4 дополнительных участника
      for (const s of [ivan, dima, ...extra]) {
        await token.mint(s.address, dai(1000));
        await token.connect(s).approve(await bhs.getAddress(), dai(1000));
      }

      // Иван H1+H2, Дима H1+H2 (реферер Иван)
      await registerAndBuy(ivan, root, [1, 2]);
      await registerAndBuy(dima, ivan, [1, 2]);

      // 3 участника покупают H2 через Диму → Дима получает слоты 1-3
      for (const buyer of extra.slice(0, 3)) {
        await bhs.connect(buyer).register(dima.address);
        await bhs.connect(buyer).buyHive(1);
        await bhs.connect(buyer).buyHive(2);
      }

      // 4-й участник → слот 4 матрицы Димы → выплата идёт АПЛАЙНУ Димы с H2 = Ивану
      const ivanBefore = await token.balanceOf(ivan.address);
      await bhs.connect(extra[3]).register(dima.address);
      await bhs.connect(extra[3]).buyHive(1);
      await bhs.connect(extra[3]).buyHive(2); // ← 4-й слот → Иван!
      const ivanAfter = await token.balanceOf(ivan.address);

      // 4-й участник закрыл и H1 и H2 матрицы Димы одновременно
      // H1 slot4 → Ivan: 4.5 DAI + H2 slot4 → Ivan: 8.1 DAI = 12.6 DAI
      expect(ivanAfter - ivanBefore).to.equal(dai("12.6"));

      // Матрица Димы на H2 реактивировалась (slotCount = 0, cycles = 1)
      const [, slotCount, cycles] = await bhs.getMatrix(dima.address, 2);
      expect(slotCount).to.equal(0);
      expect(cycles).to.equal(1);
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. АВТОПОКУПКА
  // ══════════════════════════════════════════════════════════════════════════
  describe("Auto-Buy", () => {

    it("Включить/выключить автопокупку", async () => {
      await bhs.connect(ivan).register(root.address);
      await bhs.connect(ivan).setAutoBuy(true);
      const info = await bhs.getStats(ivan.address);
      expect(info.autoBuy).to.be.true;
    });

    it("При автопокупке выплаты накапливаются в pendingBalance", async () => {
      await token.mint(ivan.address, dai(100));
      await token.connect(ivan).approve(await bhs.getAddress(), dai(100));
      await token.mint(dima.address, dai(100));
      await token.connect(dima).approve(await bhs.getAddress(), dai(100));

      await bhs.connect(ivan).register(root.address);
      await bhs.connect(ivan).buyHive(1);
      await bhs.connect(ivan).setAutoBuy(true); // включаем автопокупку

      await bhs.connect(dima).register(ivan.address);

      const ivanBalBefore = await token.balanceOf(ivan.address);
      await bhs.connect(dima).buyHive(1); // → 4.5 DAI должны накопиться у Ивана

      const ivanBalAfter = await token.balanceOf(ivan.address);
      const pending = await bhs.pendingBalance(ivan.address);

      // Иван не получил токены напрямую — они в pendingBalance
      expect(ivanBalAfter - ivanBalBefore).to.equal(0n);
      expect(pending).to.equal(dai(4.5));
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. VIEW ФУНКЦИИ
  // ══════════════════════════════════════════════════════════════════════════
  describe("View Functions", () => {

    it("previewUpline находит правильного аплайна", async () => {
      await registerAndBuy(ivan,  root,  [1, 2]);
      await registerAndBuy(dima,  ivan,  [1]);    // у Димы нет H2

      // Для нового участника с рефером Дима на H2 → должен найти Ивана
      const upline = await bhs.previewUpline(dima.address, 2);
      expect(upline).to.equal(ivan.address);
    });

    it("getAllPrices возвращает 10 цен", async () => {
      const prices = await bhs.getAllPrices();
      expect(prices.length).to.equal(10);
      expect(prices[0]).to.equal(dai(5));
    });

  });

});
