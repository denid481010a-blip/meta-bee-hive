# 🐝 BEE HIVE SYSTEM

Децентрализованная реферальная матрица S4 на Polygon + DAI.

---

## Структура проекта

```
meta bee/
├── smart-contract/          ← Solidity контракт + тесты
│   ├── contracts/
│   │   ├── BeeHiveSystem.sol   ← Основной контракт (UUPS Proxy)
│   │   └── mocks/MockDAI.sol   ← ERC-20 мок для тестов
│   ├── test/BeeHiveSystem.test.js
│   ├── scripts/deploy.js
│   └── hardhat.config.js
│
├── frontend/                ← Next.js Web3 dApp
│   ├── app/
│   │   ├── page.tsx            ← Лендинг
│   │   ├── dashboard/          ← Личный кабинет
│   │   │   ├── page.tsx           ← Главный дашборд "Мой улей"
│   │   │   ├── levels/page.tsx    ← Покупка уровней
│   │   │   ├── matrix/page.tsx    ← Матрица S4
│   │   │   ├── payments/page.tsx  ← История платежей
│   │   │   ├── team/page.tsx      ← Команда/рефералы
│   │   │   └── achievements/page.tsx ← Достижения
│   │   └── ref/[address]/page.tsx ← Реферальная ссылка
│   ├── components/
│   ├── hooks/               ← wagmi хуки
│   └── lib/                 ← ABIs, константы, форматтеры
│
└── backend/                 ← Node.js индексер + API
    └── src/
        ├── index.js         ← Express сервер
        ├── db.js            ← SQLite схема
        ├── indexer.js       ← Blockchain event indexer
        └── routes.js        ← REST API
```

---

## Быстрый старт

### 1. Смарт-контракт

```bash
cd smart-contract
# Создай node_modules (или скопируй из существующей папки)
npm install
npx hardhat test          # Запустить 23 теста
npx hardhat node          # Локальная нода
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Фронтенд

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Заполни .env.local: адрес контракта, WalletConnect Project ID
npm run dev               # http://localhost:3000
```

### 3. Бэкенд (индексер)

```bash
cd backend
npm install
cp .env.example .env
# Заполни .env: адрес контракта, RPC URL
npm start                 # http://localhost:3001
```

---

## API Endpoints

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/stats` | Глобальная статистика |
| GET | `/api/user/:address` | Данные пользователя |
| GET | `/api/payments/:address` | История платежей |
| GET | `/api/team/:address` | Структура команды |
| GET | `/api/leaderboard` | Топ-50 участников |
| GET | `/api/health` | Статус индексера |

---

## Деплой на Polygon

1. Получи DAI на Polygon mainnet
2. В `hardhat.config.js` установи свой PRIVATE_KEY в env
3. `npx hardhat run scripts/deploy.js --network polygon`
4. Запиши адрес прокси в `.env.local` фронтенда и `.env` бэкенда
5. После 1-2 месяцев тестирования: `contract.renounceOwnership()` — контракт заморожен навсегда

---

## Матрица S4

- **Слоты 1-3**: 90% выплаты → тебе, 10% → системная комиссия
- **Слот 4**: Перезапуск цикла, выплата аплайну
- **Перелив**: Если у реферера нет нужного уровня — ищем выше (до 50 шагов)
- **Авто-покупка**: Накапливаем входящие → автоматически покупаем следующий уровень
