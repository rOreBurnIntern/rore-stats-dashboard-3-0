const { UPSTREAM_BASE, fetchExplorePages, fetchJsonWithRetry } = require("./lib/upstream");
const { openDatabase, saveRoundsFromPages, setSyncState } = require("./lib/sqlite");

async function runSync() {
  const db = openDatabase();
  try {
    const prices = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`);
    const explorePages = await fetchExplorePages();
    const storedRounds = saveRoundsFromPages(db, explorePages);
    const motherlodeWei = explorePages
      .map((page) => page && page.protocolStats && page.protocolStats.motherlode)
      .find((value) => value !== undefined && value !== null) || null;

    const state = {
      lastSyncMs: Date.now(),
      prices,
      motherlodeWei
    };
    setSyncState(db, state);

    console.log(JSON.stringify({
      ok: true,
      pagesFetched: explorePages.length,
      storedRounds,
      dbPath: process.env.RORE_DB_PATH || "data/rore.db",
      syncedAt: new Date(state.lastSyncMs).toISOString()
    }));
  } finally {
    if (typeof db.close === "function") {
      db.close();
    }
  }
}

runSync().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error && error.message ? error.message : "sync failed"
  }));
  process.exit(1);
});
