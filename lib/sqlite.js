const fs = require("node:fs");
const path = require("node:path");
const { extractRoundArray } = require("./stats");

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "rore.db");
const SYNC_STATE_KEY = "sync_state";

function getDatabaseCtor(customCtor) {
  if (customCtor) {
    return customCtor;
  }
  try {
    return require("better-sqlite3");
  } catch (error) {
    if (error && error.code !== "MODULE_NOT_FOUND") {
      throw error;
    }
    return require("node:sqlite").DatabaseSync;
  }
}

function openDatabase(options = {}) {
  const dbPath = options.dbPath || process.env.RORE_DB_PATH || DEFAULT_DB_PATH;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const Database = getDatabaseCtor(options.Database);
  const db = new Database(dbPath);
  initSchema(db);
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY,
      round_id INTEGER UNIQUE,
      block TEXT,
      winner_take_all BOOLEAN,
      ore_winner TEXT,
      motherlode TEXT,
      motherlode_hit BOOLEAN,
      timestamp INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_rounds_timestamp ON rounds(timestamp);
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

function firstDefined(object, fields) {
  for (const field of fields) {
    if (object[field] !== undefined && object[field] !== null) {
      return object[field];
    }
  }
  return null;
}

function toInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const num = Number(String(value).replace(/^#/, "").trim());
  return Number.isFinite(num) ? Math.trunc(num) : null;
}

function toTimestampMs(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric > 1e12) {
      return Math.trunc(numeric);
    }
    if (numeric > 1e9) {
      return Math.trunc(numeric * 1000);
    }
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWinnerTakeAll(rawRound) {
  const explicit = firstDefined(rawRound, [
    "winnerTakeAll",
    "winner_take_all",
    "isWinnerTakeAll",
    "is_winner_take_all"
  ]);
  if (typeof explicit === "boolean") {
    return explicit ? 1 : 0;
  }
  if (typeof explicit === "string") {
    return explicit.toLowerCase() === "true" ? 1 : 0;
  }
  const winnerType = String(firstDefined(rawRound, ["winnerType", "winner_type"]) || "").toLowerCase();
  if (winnerType.includes("split")) {
    return 0;
  }
  return 1;
}

function saveRoundsFromPages(db, pages) {
  const statement = db.prepare(`
    INSERT INTO rounds (round_id, block, winner_take_all, ore_winner, motherlode, motherlode_hit, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(round_id) DO UPDATE SET
      block=excluded.block,
      winner_take_all=excluded.winner_take_all,
      ore_winner=excluded.ore_winner,
      motherlode=excluded.motherlode,
      motherlode_hit=excluded.motherlode_hit,
      timestamp=excluded.timestamp
  `);

  let stored = 0;
  for (const page of pages) {
    const rounds = extractRoundArray(page);
    for (const round of rounds) {
      const roundId = toInteger(firstDefined(round, ["roundId", "id", "_id", "round_id"]));
      if (roundId === null) {
        continue;
      }
      statement.run(
        roundId,
        firstDefined(round, ["block", "winnerBlock", "winningBlock", "blockNumber"]) || null,
        normalizeWinnerTakeAll(round),
        firstDefined(round, ["oreWinner", "winner", "winnerAddress"]),
        firstDefined(round, ["motherlode", "motherlodeAmount"]),
        Boolean(firstDefined(round, ["motherlodeHit", "isMotherlodeHit", "hitMotherlode"])) ? 1 : 0,
        toTimestampMs(firstDefined(round, ["timestamp", "endTimestamp", "createdAt", "time"]))
      );
      stored += 1;
    }
  }
  return stored;
}

function setSyncState(db, state) {
  const payload = JSON.stringify(state);
  db.prepare(`
    INSERT INTO sync_meta (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value=excluded.value,
      updated_at=excluded.updated_at
  `).run(SYNC_STATE_KEY, payload, Date.now());
}

function getSyncState(db) {
  const row = db.prepare("SELECT value FROM sync_meta WHERE key = ?").get(SYNC_STATE_KEY);
  if (!row || !row.value) {
    return null;
  }
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

function hasCachedRounds(db) {
  const row = db.prepare("SELECT COUNT(1) AS count FROM rounds").get();
  return Boolean(row && row.count > 0);
}

module.exports = {
  getSyncState,
  hasCachedRounds,
  openDatabase,
  saveRoundsFromPages,
  setSyncState
};
