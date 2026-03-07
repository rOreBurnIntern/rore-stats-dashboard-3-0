const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getSyncState, hasCachedRounds, openDatabase, saveRoundsFromPages, setSyncState } = require("../lib/sqlite");

function withTempDb(testFn) {
  return async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rore-sync-"));
    const dbPath = path.join(dir, "rore.db");
    const previousDbPath = process.env.RORE_DB_PATH;
    process.env.RORE_DB_PATH = dbPath;

    try {
      await testFn();
    } finally {
      if (previousDbPath === undefined) {
        delete process.env.RORE_DB_PATH;
      } else {
        process.env.RORE_DB_PATH = previousDbPath;
      }
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

test("saveRoundsFromPages upserts rounds and stores sync metadata", withTempDb(async () => {
  const db = openDatabase();
  try {
    const pages = [
      {
        rounds: [
          { roundId: 1, block: "#1", winnerTakeAll: true, motherlodeHit: false, timestamp: "2026-03-07T00:00:00Z" },
          { roundId: 1, block: "#2", winnerTakeAll: false, motherlodeHit: true, timestamp: "2026-03-07T00:01:00Z" },
          { roundId: 2, block: "#3", winnerTakeAll: true, motherlodeHit: false, timestamp: "2026-03-07T00:02:00Z" }
        ]
      }
    ];

    const storedRounds = saveRoundsFromPages(db, pages);
    assert.equal(storedRounds, 3);
    assert.equal(hasCachedRounds(db), true);

    setSyncState(db, {
      lastSyncMs: 1700000000000,
      prices: { weth: "2000" },
      motherlodeWei: "1000000000000000000"
    });

    const state = getSyncState(db);
    assert.equal(state.lastSyncMs, 1700000000000);
    assert.equal(state.prices.weth, "2000");
    assert.equal(state.motherlodeWei, "1000000000000000000");

    const rows = db.prepare("SELECT round_id, block, winner_take_all FROM rounds ORDER BY round_id").all();
    assert.equal(rows.length, 2);
    assert.equal(rows[0].round_id, 1);
    assert.equal(rows[0].block, "#2");
    assert.equal(rows[0].winner_take_all, 0);
  } finally {
    db.close();
  }
}));
