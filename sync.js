const { UPSTREAM_BASE, fetchExplorePages, fetchJsonWithRetry } = require("./lib/upstream");
const { extractRoundArray } = require("./lib/stats");
const { openDatabase, saveRoundsFromPages, setSyncState } = require("./lib/sqlite");
const { writeRoundsToSupabase } = require("./lib/supabase");

const MAX_PAGES = parseInt(process.argv[2] || "200", 10);

function flattenRoundsFromPages(pages) {
  const rounds = [];
  for (const page of pages) {
    rounds.push(...extractRoundArray(page));
  }
  return rounds;
}

async function runSync() {
  const db = openDatabase();
  try {
    const prices = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`);
    const explorePages = await fetchExplorePages({ maxPages: MAX_PAGES });
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

    const rounds = flattenRoundsFromPages(explorePages);
    let supabase = null;
    try {
      supabase = await writeRoundsToSupabase(rounds);
    } catch (error) {
      supabase = {
        ok: false,
        skipped: false,
        reason: error && error.message ? error.message : "Supabase write failed"
      };
      console.warn("[sync] Supabase write failed", supabase.reason);
    }

    console.log(JSON.stringify({
      ok: true,
      pagesFetched: explorePages.length,
      storedRounds,
      supabase,
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
