const initSqlJs = require("sql.js");
const path      = require("path");
const fs        = require("fs");

const DB_PATH = process.env.DB_PATH ?? "./data/beehive.db";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let db;
let SQL;

// Sync wrapper — we init synchronously via a trick
const { execSync } = require("child_process");

// sql.js is async init, so we expose a promise + sync getter
let _ready = false;
let _db = null;

async function initDB() {
  SQL = await initSqlJs();

  // Load existing DB file or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Schema
  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      address      TEXT PRIMARY KEY,
      referrer     TEXT,
      registered_at INTEGER NOT NULL,
      block_number  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hive_levels (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      address      TEXT NOT NULL,
      level        INTEGER NOT NULL,
      cycle        INTEGER NOT NULL DEFAULT 0,
      bought_at    INTEGER NOT NULL,
      block_number INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      type         TEXT NOT NULL,
      address      TEXT NOT NULL,
      counterpart  TEXT NOT NULL,
      level        INTEGER NOT NULL,
      amount_wei   TEXT NOT NULL,
      tx_hash      TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      timestamp    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS indexer_state (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS global_stats (
      id              INTEGER PRIMARY KEY,
      total_users     INTEGER DEFAULT 0,
      total_volume    TEXT DEFAULT '0',
      total_payments  INTEGER DEFAULT 0,
      last_updated    INTEGER DEFAULT 0
    );

    INSERT OR IGNORE INTO global_stats(id) VALUES(1);
  `);

  _ready = true;
  saveDB();
  return _db;
}

function saveDB() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Save every 10 seconds
setInterval(saveDB, 10_000);

// Proxy object that mirrors synchronous better-sqlite3 API as much as possible
// but uses sql.js under the hood
const dbProxy = {
  prepare(sql) {
    return {
      run(...params) {
        if (!_db) throw new Error("DB not ready");
        _db.run(sql, params);
        saveDB();
        return { changes: 1 };
      },
      get(...params) {
        if (!_db) throw new Error("DB not ready");
        const stmt = _db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        if (!_db) throw new Error("DB not ready");
        const stmt = _db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
    };
  },
  exec(sql) {
    if (!_db) throw new Error("DB not ready");
    _db.run(sql);
    saveDB();
  },
  pragma() {},
  isReady() { return _ready; },
  init: initDB,
};

module.exports = dbProxy;
