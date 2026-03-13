const { extractRoundArray, parsePagination } = require("./stats");

const UPSTREAM_BASE = "https://api.rore.supply";
const TIMEOUT_MS = 25000;
const RETRIES = 2;
const MAX_PAGES = 500;

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
  const maxPages = options.maxPages || MAX_PAGES;
  const pages = [];
  let page = 1;
  let noNewRoundsStreak = 0;
  const seenIds = new Set();

  while (page <= maxPages) {
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

module.exports = {
  UPSTREAM_BASE,
  fetchExplorePages,
  fetchJsonWithRetry
};
