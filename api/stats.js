const { buildStatsPayload, extractRoundArray, toTimestampMs } = require("../lib/stats");
const { fetchFallbackPayloadFromSupabase } = require("../lib/supabase");
const { UPSTREAM_BASE, fetchExplorePages, fetchJsonWithRetry } = require("../lib/upstream");

function jsonResponse(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
  res.status(statusCode).json(payload);
}

function firstDefined(object, fields) {
  for (const field of fields) {
    if (object[field] !== undefined && object[field] !== null) {
      return object[field];
    }
  }
  return null;
}

function toBlockNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(String(value).replace(/^#/, "").trim());
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function normalizeWinnerTakeAll(rawRound) {
  const explicit = firstDefined(rawRound, [
    "winnerTakeAll",
    "winner_take_all",
    "isWinnerTakeAll",
    "is_winner_take_all"
  ]);

  if (typeof explicit === "boolean") {
    return explicit;
  }
  if (typeof explicit === "string") {
    return explicit.toLowerCase() === "true";
  }

  const winnerType = String(firstDefined(rawRound, ["winnerType", "winner_type"]) || "").toLowerCase();
  return !winnerType.includes("split");
}

function normalizeRoundForClient(rawRound, fallbackIndex) {
  const roundId = firstDefined(rawRound, ["roundId", "id", "_id", "round_id"]);
  const timestampMs = toTimestampMs(
    firstDefined(rawRound, ["endTimestamp", "timestamp", "createdAt", "time"]) || null
  );

  return {
    id: String(roundId !== null && roundId !== undefined ? roundId : `round-${fallbackIndex}`),
    winnerTakeAll: normalizeWinnerTakeAll(rawRound),
    winnerBlock: toBlockNumber(firstDefined(rawRound, ["winnerBlock", "winningBlock", "block", "blockNumber"])),
    motherlodeHit: Boolean(firstDefined(rawRound, ["motherlodeHit", "isMotherlodeHit", "hitMotherlode"])),
    endTimestamp: timestampMs ? new Date(timestampMs).toISOString() : null
  };
}

function buildClientRounds(pages) {
  const rounds = [];
  let index = 0;
  for (const page of pages) {
    const pageRounds = extractRoundArray(page);
    for (const rawRound of pageRounds) {
      rounds.push(normalizeRoundForClient(rawRound, index));
      index += 1;
    }
  }

  const deduped = new Map();
  for (const round of rounds) {
    const key = `${round.id}:${round.endTimestamp || ""}:${round.winnerBlock || ""}`;
    deduped.set(key, round);
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const aMs = toTimestampMs(a.endTimestamp);
    const bMs = toTimestampMs(b.endTimestamp);
    if (aMs !== null && bMs !== null && aMs !== bMs) {
      return aMs - bMs;
    }
    return a.id.localeCompare(b.id, "en", { numeric: true });
  });
}

async function getFallbackStats() {
  return fetchFallbackPayloadFromSupabase();
}

module.exports = async function handler(req, res) {
  try {
    const prices = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`, { timeoutMs: 25000 });
    const explorePages = await fetchExplorePages({ maxPages: 15, timeoutMs: 25000 });
    const data = buildStatsPayload(prices, explorePages);
    const rounds = buildClientRounds(explorePages);

    jsonResponse(res, 200, {
      ok: true,
      source: "upstream",
      pagesFetched: explorePages.length,
      lastUpdated: new Date().toISOString(),
      data: {
        ...data,
        rounds
      }
    });
  } catch (error) {
    console.error("[/api/stats] upstream fetch failed", {
      message: error && error.message ? error.message : "Unknown error"
    });

    try {
      const fallback = await module.exports.getFallbackStats();
      if (fallback) {
        jsonResponse(res, 200, {
          ok: true,
          source: "supabase-fallback",
          pagesFetched: 0,
          lastUpdated: fallback.lastUpdated,
          data: {
            ...fallback.data,
            rounds: fallback.rounds
          }
        });
        return;
      }
    } catch (fallbackError) {
      console.error("[/api/stats] supabase fallback failed", {
        message: fallbackError && fallbackError.message ? fallbackError.message : "Unknown error"
      });
    }

    jsonResponse(res, 502, {
      ok: false,
      error: "Upstream data unavailable",
      detail: error && error.message ? error.message : "Unknown error"
    });
  }
};

module.exports.buildClientRounds = buildClientRounds;
module.exports.fetchExplorePages = fetchExplorePages;
module.exports.fetchJsonWithRetry = fetchJsonWithRetry;
module.exports.getFallbackStats = getFallbackStats;
