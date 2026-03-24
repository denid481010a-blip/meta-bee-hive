const express = require("express");
const db      = require("./db");

const router = express.Router();

// ── Global stats ──────────────────────────────────────────────────────────────
router.get("/stats", (req, res) => {
  const stats = db.prepare("SELECT * FROM global_stats WHERE id = 1").get();
  const topUsers = db.prepare(`
    SELECT u.address,
           (SELECT COUNT(DISTINCT level) FROM hive_levels WHERE address = u.address) AS active_levels,
           (SELECT COALESCE(SUM(CAST(amount_wei AS REAL)), 0) / 1e18 FROM payments WHERE address = u.address AND type = 'income') AS total_earned
    FROM users u
    ORDER BY active_levels DESC, total_earned DESC
    LIMIT 10
  `).all();

  res.json({ stats, topUsers });
});

// ── User stats ────────────────────────────────────────────────────────────────
router.get("/user/:address", (req, res) => {
  const addr = req.params.address.toLowerCase();

  const user = db.prepare("SELECT * FROM users WHERE LOWER(address) = ?").get(addr);
  if (!user) return res.json({ isRegistered: false });

  const levels = db.prepare("SELECT level, cycle FROM hive_levels WHERE LOWER(address) = ?").all(addr);
  const activeLevelsList = [...new Set(levels.map((l) => l.level))].sort((a, b) => a - b);

  const totalEarned = db.prepare(`
    SELECT COALESCE(SUM(CAST(amount_wei AS REAL)), 0) / 1e18 AS val
    FROM payments WHERE LOWER(address) = ? AND type = 'income'
  `).get(addr)?.val ?? 0;

  const totalSpent = db.prepare(`
    SELECT COALESCE(SUM(CAST(amount_wei AS REAL)), 0) / 1e18 AS val
    FROM payments WHERE LOWER(address) = ? AND type = 'expense'
  `).get(addr)?.val ?? 0;

  const totalCycles = levels.reduce((s, l) => s + l.cycle, 0);

  // Прямые рефералы (глубина 1) — рекурсивный CTE может зависать в sql.js
  const directReferrals = db.prepare(`
    SELECT COUNT(*) AS cnt FROM users WHERE LOWER(referrer) = ? AND LOWER(address) != LOWER(referrer)
  `).get(addr)?.cnt ?? 0;
  const teamSize = directReferrals;

  res.json({
    isRegistered: true,
    address: user.address,
    referrer: user.referrer,
    registeredAt: user.registered_at,
    activeLevelsList,
    activeLevels: activeLevelsList.length,
    totalCycles,
    totalEarned: totalEarned.toFixed(4),
    totalSpent: totalSpent.toFixed(4),
    netProfit: (totalEarned - totalSpent).toFixed(4),
    teamSize,
  });
});

// ── Payment history ───────────────────────────────────────────────────────────
router.get("/payments/:address", (req, res) => {
  const addr  = req.params.address.toLowerCase();
  const limit = Math.min(parseInt(req.query.limit ?? "50"), 200);
  const page  = parseInt(req.query.page ?? "0");

  const payments = db.prepare(`
    SELECT id, type, counterpart, level, amount_wei, tx_hash, timestamp
    FROM payments
    WHERE LOWER(address) = ?
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `).all(addr, limit, page * limit);

  const formatted = payments.map((p) => ({
    id:        p.id,
    type:      p.type,
    from:      p.type === "income" ? p.counterpart : addr,
    to:        p.type === "income" ? addr : p.counterpart,
    level:     p.level,
    amount:    (parseFloat(p.amount_wei) / 1e18).toFixed(4),
    txHash:    p.tx_hash,
    timestamp: p.timestamp,
  }));

  res.json({ payments: formatted });
});

// ── Team / referrals ──────────────────────────────────────────────────────────
router.get("/team/:address", (req, res) => {
  const addr = req.params.address.toLowerCase();

  // Прямые рефералы (depth=1) — рекурсивный CTE зависает в sql.js
  const members = db.prepare(`
    SELECT
      u.address,
      u.registered_at,
      1 AS depth,
      COUNT(DISTINCT h.level) AS active_levels,
      COALESCE(SUM(CAST(p.amount_wei AS REAL)), 0) / 1e18 AS total_earned
    FROM users u
    LEFT JOIN hive_levels h ON LOWER(h.address) = LOWER(u.address)
    LEFT JOIN payments p ON LOWER(p.address) = LOWER(u.address) AND p.type = 'income'
    WHERE LOWER(u.referrer) = ? AND LOWER(u.address) != ?
    GROUP BY u.address
    ORDER BY active_levels DESC
    LIMIT 500
  `).all(addr, addr);

  res.json({
    members: members.map((m) => ({
      address:     m.address,
      depth:       m.depth,
      activeLevels: m.active_levels,
      joinedAt:    m.registered_at,
      totalEarned: m.total_earned.toFixed(4),
    })),
  });
});

// ── Leaderboard ───────────────────────────────────────────────────────────────
router.get("/leaderboard", (req, res) => {
  const rows = db.prepare(`
    SELECT
      u.address,
      (SELECT COUNT(DISTINCT level) FROM hive_levels WHERE address = u.address) AS active_levels,
      (SELECT COALESCE(SUM(CAST(amount_wei AS REAL)), 0) / 1e18 FROM payments WHERE address = u.address AND type = 'income') AS total_earned,
      u.registered_at
    FROM users u
    ORDER BY active_levels DESC, total_earned DESC
    LIMIT 50
  `).all();

  res.json({
    leaderboard: rows.map((r, i) => ({
      rank: i + 1,
      address: r.address,
      activeLevels: r.active_levels,
      totalEarned: r.total_earned.toFixed(4),
      joinedAt: r.registered_at,
    })),
  });
});

// ── Health ────────────────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  const state = db.prepare("SELECT value FROM indexer_state WHERE key = 'last_block'").get();
  res.json({ status: "ok", lastBlock: state?.value ?? "0" });
});

module.exports = router;
