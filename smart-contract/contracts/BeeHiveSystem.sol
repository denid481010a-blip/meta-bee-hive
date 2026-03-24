// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title BeeHiveSystem
 * @notice Децентрализованная реферальная матрица S4 на базе DAI (Polygon)
 * @dev    UUPS Upgradeable — владелец может обновить контракт в любой момент.
 *         После финального тестирования вызвать renounceOwnership() —
 *         контракт становится неизменным навсегда.
 *
 * Механика:
 *  - 10 уровней (Hive 1–10), цена: H1=5 DAI, каждый следующий × 1.8
 *  - На каждом уровне 4 слота (S4 матрица)
 *  - Слоты 1–3 → выплата владельцу матрицы (90% цены)
 *  - Слот 4    → выплата аплайну + авто-реактивация матрицы
 *  - 10% с каждой покупки → системный кошелёк
 *  - Перелив: нет уровня у аплайна → ищем выше (макс. MAX_DEPTH шагов)
 *  - ROOT всегда имеет все 10 уровней активными
 *  - Автопокупка: накопление выплат до суммы следующего уровня
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract BeeHiveSystem is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    // ── Reentrancy Guard (ручная реализация для совместимости с UUPS) ──────────
    uint256 private _reentrancyStatus; // 1 = free, 2 = locked

    modifier nonReentrant() {
        require(_reentrancyStatus != 2, "BHS: reentrant call");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }
    // ── Константы ──────────────────────────────────────────────────────────────
    uint8   public constant MAX_LEVEL      = 10;
    uint8   public constant SLOTS_PER_HIVE = 4;
    uint8   public constant MAX_DEPTH      = 50;   // макс. шагов поиска аплайна
    uint256 public constant SYSTEM_FEE_PCT = 10;   // 10% комиссия

    // ── Состояние (задаётся в initialize, не в constructor) ────────────────────
    IERC20  public dai;
    address public root;
    address public systemWallet;

    uint256[MAX_LEVEL] public prices;

    // ── Структуры ──────────────────────────────────────────────────────────────
    struct HiveMatrix {
        address[SLOTS_PER_HIVE] slots;
        uint8   slotCount;
        uint32  cycles;
    }

    struct UserInfo {
        address referrer;
        bool    registered;
        bool[MAX_LEVEL] levels;
        bool    autoBuy;
        uint256 totalEarned;
        uint256 totalSpent;
    }

    // ── Хранилище ──────────────────────────────────────────────────────────────
    mapping(address => UserInfo)                     public userInfo;
    mapping(address => mapping(uint8 => HiveMatrix)) public matrix;
    mapping(address => uint256)                      public pendingBalance;

    // ── События ────────────────────────────────────────────────────────────────
    event UserRegistered   (address indexed user,    address indexed referrer);
    event HiveBought       (address indexed user,    uint8 indexed level, uint256 price);
    event PaymentSent      (address indexed from,    address indexed to, uint8 indexed level, uint256 amount, uint8 slot);
    event OverflowSkip     (address indexed skipped, uint8 level);
    event HiveCycled       (address indexed user,    uint8 indexed level, uint32 cycle);
    event AutoBuyTriggered (address indexed user,    uint8 level);
    event PendingWithdrawn (address indexed user,    uint256 amount);

    // ── /// @custom:oz-upgrades-unsafe-allow constructor ──────────────────────
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ── Инициализация (вместо constructor для Proxy) ───────────────────────────
    function initialize(
        address _dai,
        address _root,
        address _systemWallet,
        address _owner
    ) external initializer {
        require(_dai          != address(0), "BHS: DAI zero");
        require(_root         != address(0), "BHS: root zero");
        require(_systemWallet != address(0), "BHS: system wallet zero");
        require(_owner        != address(0), "BHS: owner zero");

        __Ownable_init(_owner);
        _reentrancyStatus = 1;

        dai          = IERC20(_dai);
        root         = _root;
        systemWallet = _systemWallet;

        // Цены: H1=5, H(n) = H(n-1) * 9/5
        prices[0] = 5 ether;
        for (uint8 i = 1; i < MAX_LEVEL; i++) {
            prices[i] = prices[i - 1] * 9 / 5;
        }

        // Инициализируем ROOT
        UserInfo storage r = userInfo[_root];
        r.registered = true;
        r.referrer   = _root;
        for (uint8 i = 0; i < MAX_LEVEL; i++) {
            r.levels[i] = true;
        }
    }

    // ── Разрешение апгрейдов только владельцу ─────────────────────────────────
    // После renounceOwnership() — апгрейды станут невозможны навсегда
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // ── Модификаторы ───────────────────────────────────────────────────────────
    modifier onlyRegistered() {
        require(userInfo[msg.sender].registered, "BHS: not registered");
        _;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ПУБЛИЧНЫЕ ФУНКЦИИ
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Регистрация участника
     * @param referrer Реферер. Если 0 или незарегистрирован → ROOT
     */
    function register(address referrer) external {
        require(!userInfo[msg.sender].registered, "BHS: already registered");
        require(msg.sender != referrer,           "BHS: self-referral");

        if (referrer == address(0) || !userInfo[referrer].registered) {
            referrer = root;
        }

        UserInfo storage u = userInfo[msg.sender];
        u.registered = true;
        u.referrer   = referrer;

        emit UserRegistered(msg.sender, referrer);
    }

    /**
     * @notice Покупка уровня улья
     * @param level Уровень 1–10. Покупать строго по порядку.
     */
    function buyHive(uint8 level) external nonReentrant onlyRegistered {
        _buyHive(msg.sender, level, true);
    }

    /**
     * @notice Включить / выключить автопокупку следующего уровня
     */
    function setAutoBuy(bool enabled) external onlyRegistered {
        userInfo[msg.sender].autoBuy = enabled;
    }

    /**
     * @notice Вывести накопленный pending баланс вручную
     *         (если autoBuy выключена или не хватает на следующий уровень)
     */
    function withdrawPending() external nonReentrant onlyRegistered {
        uint256 amount = pendingBalance[msg.sender];
        require(amount > 0, "BHS: nothing to withdraw");

        pendingBalance[msg.sender] = 0;
        _safeDaiTransfer(msg.sender, amount);

        emit PendingWithdrawn(msg.sender, amount);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ВНУТРЕННЯЯ ЛОГИКА
    // ══════════════════════════════════════════════════════════════════════════

    function _buyHive(address user, uint8 level, bool pullDai) internal {
        require(level >= 1 && level <= MAX_LEVEL, "BHS: invalid level");

        uint8 idx = level - 1;
        UserInfo storage u = userInfo[user];

        require(!u.levels[idx], "BHS: level already active");
        if (idx > 0) {
            require(u.levels[idx - 1], "BHS: buy previous level first");
        }

        uint256 price = prices[idx];

        if (pullDai) {
            require(
                dai.transferFrom(user, address(this), price),
                "BHS: DAI transfer failed"
            );
        } else {
            require(pendingBalance[user] >= price, "BHS: insufficient pending");
            pendingBalance[user] -= price;
        }

        u.levels[idx]  = true;
        u.totalSpent  += price;

        uint256 fee = price * SYSTEM_FEE_PCT / 100;
        uint256 net = price - fee;
        _safeDaiTransfer(systemWallet, fee);

        address receiver = _findUpline(user, level);
        _placeInMatrix(user, receiver, level, net);

        emit HiveBought(user, level, price);
    }

    /**
     * @dev Найти ближайшего аплайна с активным уровнем.
     *      Максимум MAX_DEPTH (50) шагов — защита от Out of Gas.
     */
    function _findUpline(address user, uint8 level) internal returns (address) {
        address current = userInfo[user].referrer;
        uint8   idx     = level - 1;
        uint8   depth   = 0;

        while (current != root && depth < MAX_DEPTH) {
            if (userInfo[current].levels[idx]) {
                return current;
            }
            emit OverflowSkip(current, level);
            current = userInfo[current].referrer;
            depth++;
        }

        return root;
    }

    function _placeInMatrix(
        address buyer,
        address receiver,
        uint8   level,
        uint256 net
    ) internal {
        HiveMatrix storage m = matrix[receiver][level];

        uint8 slot = m.slotCount;
        m.slots[slot] = buyer;
        m.slotCount++;

        if (slot < 3) {
            // Слоты 1–3 → владельцу матрицы
            _payOrAccumulate(receiver, net);
            emit PaymentSent(buyer, receiver, level, net, slot + 1);
        } else {
            // Слот 4 → аплайну + реактивация
            m.slotCount = 0;
            m.cycles++;

            address upline = _findUpline(receiver, level);
            _payOrAccumulate(upline, net);
            emit PaymentSent(buyer, upline, level, net, 4);
            emit HiveCycled(receiver, level, m.cycles);
        }
    }

    function _payOrAccumulate(address user, uint256 amount) internal {
        UserInfo storage u = userInfo[user];
        u.totalEarned += amount;

        if (u.autoBuy && _needsNextLevel(user)) {
            pendingBalance[user] += amount;
            _tryAutoBuy(user);
        } else {
            _safeDaiTransfer(user, amount);
        }
    }

    function _tryAutoBuy(address user) internal {
        uint8 nextLevel = _getNextNeededLevel(user);
        if (nextLevel == 0) return;

        uint256 price = prices[nextLevel - 1];
        if (pendingBalance[user] < price) return;

        emit AutoBuyTriggered(user, nextLevel);
        _buyHive(user, nextLevel, false);
    }

    function _needsNextLevel(address user) internal view returns (bool) {
        bool[MAX_LEVEL] storage levels = userInfo[user].levels;
        for (uint8 i = 0; i < MAX_LEVEL - 1; i++) {
            if (levels[i] && !levels[i + 1]) return true;
        }
        return false;
    }

    function _getNextNeededLevel(address user) internal view returns (uint8) {
        bool[MAX_LEVEL] storage levels = userInfo[user].levels;
        for (uint8 i = 0; i < MAX_LEVEL - 1; i++) {
            if (levels[i] && !levels[i + 1]) return i + 2;
        }
        return 0;
    }

    function _safeDaiTransfer(address to, uint256 amount) internal {
        require(dai.transfer(to, amount), "BHS: DAI send failed");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VIEW ФУНКЦИИ
    // ══════════════════════════════════════════════════════════════════════════

    function getMatrix(address user, uint8 level) external view returns (
        address[4] memory slots,
        uint8  slotCount,
        uint32 cycles
    ) {
        HiveMatrix storage m = matrix[user][level];
        return (m.slots, m.slotCount, m.cycles);
    }

    function getUserLevels(address user) external view returns (bool[10] memory) {
        return userInfo[user].levels;
    }

    function getAllPrices() external view returns (uint256[10] memory) {
        return prices;
    }

    function getPrice(uint8 level) external view returns (uint256) {
        require(level >= 1 && level <= MAX_LEVEL, "BHS: invalid level");
        return prices[level - 1];
    }

    function getStats(address user) external view returns (
        address referrer,
        bool    registered,
        bool[10] memory levels,
        bool    autoBuy,
        uint256 totalEarned,
        uint256 totalSpent,
        uint256 pending
    ) {
        UserInfo storage u = userInfo[user];
        return (
            u.referrer,
            u.registered,
            u.levels,
            u.autoBuy,
            u.totalEarned,
            u.totalSpent,
            pendingBalance[user]
        );
    }

    function previewUpline(address user, uint8 level) external view returns (address) {
        address current = userInfo[user].referrer;
        uint8   idx     = level - 1;
        uint8   depth   = 0;

        while (current != root && depth < MAX_DEPTH) {
            if (userInfo[current].levels[idx]) return current;
            current = userInfo[current].referrer;
            depth++;
        }
        return root;
    }
}
