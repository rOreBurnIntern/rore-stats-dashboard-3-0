const { buildStatsPayload, extractRoundArray, parsePagination } = require("../lib/stats");

const UPSTREAM_BASE = "https://api.rore.supply";
const TIMEOUT_MS = 25000;
const RETRIES = 2;
const MAX_PAGES = 15;

async function fetchJsonWithRetry(url, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || TIMEOUT_MS;
  const retries = options.retries === undefined ? RETRIES : options.retries;

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Upstream HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw lastError;
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error("Unknown upstream error");
}

async function fetchExplorePages(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const pages = [];
  let page = 1;
  let noNewRoundsStreak = 0;
  const seenIds = new Set();

  while (page <= MAX_PAGES) {
    const pagePayload = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/explore?page=${page}`, {
      fetchImpl,
      timeoutMs: options.timeoutMs,
      retries: options.retries
    });
    pages.push(pagePayload);

    const rounds = extractRoundArray(pagePayload);
    let newCount = 0;
    for (const round of rounds) {
      const key = String(round.id || round.roundId || round._id || JSON.stringify(round));
      if (!seenIds.has(key)) {
        seenIds.add(key);
        newCount += 1;
      }
    }

    if (newCount === 0) {
      noNewRoundsStreak += 1;
    } else {
      noNewRoundsStreak = 0;
    }
    if (noNewRoundsStreak >= 2) {
      break;
    }

    const pagination = parsePagination(pagePayload, page);
    if (pagination.hasNext === false) {
      break;
    }
    if (pagination.nextPage) {
      page = pagination.nextPage;
      continue;
    }
    if (rounds.length === 0) {
      break;
    }
    page += 1;
  }
  return pages;
}

function jsonResponse(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  res.status(statusCode).json(payload);
}

module.exports = async function handler(req, res) {
  try {
    const prices = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`);
    const explorePages = await fetchExplorePages();
    const data = buildStatsPayload(prices, explorePages);

    jsonResponse(res, 200, {
      ok: true,
      source: "api.rore.supply",
      pagesFetched: explorePages.length,
      lastUpdated: new Date().toISOString(),
      data
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
  }
};

module.exports.fetchExplorePages = fetchExplorePages;
module.exports.fetchJsonWithRetry = fetchJsonWithRetry;
