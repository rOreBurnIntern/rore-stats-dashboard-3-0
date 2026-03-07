const { buildStatsPayload } = require("../lib/stats");
const { UPSTREAM_BASE, fetchExplorePages, fetchJsonWithRetry } = require("../lib/upstream");
const { getSyncState, hasCachedRounds, openDatabase, saveRoundsFromPages, setSyncState } = require("../lib/sqlite");

const MAX_CACHE_AGE_MS = 5 * 60 * 1000;

function jsonResponse(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
  res.status(statusCode).json(payload);
}

function closeDatabase(db) {
  if (db && typeof db.close === "function") {
    db.close();
  }
}

function buildPayloadFromCache(state, db) {
  const rounds = db.prepare(`
    SELECT round_id, block, winner_take_all, motherlode_hit, timestamp
    FROM rounds
    ORDER BY timestamp ASC, round_id ASC
  `).all().map((row) => ({
    roundId: row.round_id,
    block: row.block,
    winnerTakeAll: Boolean(row.winner_take_all),
    motherlodeHit: Boolean(row.motherlode_hit),
    timestamp: row.timestamp
  }));

  const page = {
    protocolStats: {
      motherlode: state && state.motherlodeWei ? state.motherlodeWei : null
    },
    rounds
  };

  return buildStatsPayload(state && state.prices ? state.prices : {}, [page]);
}

async function refreshFromUpstream(db, options = {}) {
  const prices = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`, {
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    retries: options.retries
  });
  const explorePages = await fetchExplorePages({
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    retries: options.retries
  });

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

  return {
    pagesFetched: explorePages.length,
    storedRounds,
    data: buildStatsPayload(prices, explorePages),
    lastSyncMs: state.lastSyncMs
  };
}

module.exports = async function handler(req, res) {
  let db = null;
  try {
    db = openDatabase();
  } catch (err) {
    // SQLite not available (e.g., Vercel serverless) - use upstream API
  }
  
  try {
    if (!db) {
      // No database - use upstream API directly
      const prices = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`, { timeoutMs: 25000 });
      const explorePages = await fetchExplorePages({ maxPages: 15, timeoutMs: 25000 });
      const data = buildStatsPayload(prices, explorePages);
      jsonResponse(res, 200, {
        ok: true,
        source: "upstream",
        pagesFetched: explorePages.length,
        data
      });
      return;
    }
    
    const state = getSyncState(db);
    const isFresh = Boolean(state && state.lastSyncMs && (Date.now() - state.lastSyncMs) <= MAX_CACHE_AGE_MS);

    if (isFresh && hasCachedRounds(db)) {
      const data = buildPayloadFromCache(state, db);
      jsonResponse(res, 200, {
        ok: true,
        source: "sqlite-cache",
        pagesFetched: 0,
        cacheHit: true,
        lastUpdated: new Date(state.lastSyncMs).toISOString(),
        data
      });
      return;
    }

    const refreshed = await refreshFromUpstream(db);
    jsonResponse(res, 200, {
      ok: true,
      source: "api.rore.supply",
      pagesFetched: refreshed.pagesFetched,
      cacheHit: false,
      lastUpdated: new Date(refreshed.lastSyncMs).toISOString(),
      data: refreshed.data
    });
  } catch (error) {
    console.error("[/api/stats] upstream fetch failed", {
      message: error && error.message ? error.message : "Unknown error"
    });
    jsonResponse(res, 502, {
      ok: false,
      error: "Upstream data unavailable",
      detail: error && error.message ? error.message : "Unknown error"
    });
  } finally {
    closeDatabase(db);
  }
};

module.exports.fetchExplorePages = fetchExplorePages;
module.exports.fetchJsonWithRetry = fetchJsonWithRetry;
module.exports.refreshFromUpstream = refreshFromUpstream;
