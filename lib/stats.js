const MOTHERLODE_INCREMENT = 0.2;
const TARGET_ROUNDS = 1000;
const BLOCK_COUNT = 25;

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBlockNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  // Handle strings like "#14" or "14" or 14
  const strValue = String(value).replace(/^#/, '').trim();
  const parsed = Number(strValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function readPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), obj);
}

function firstDefined(obj, paths) {
  for (const path of paths) {
    const value = readPath(obj, path);
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function normalizePrices(pricesRaw) {
  const weth = toNumber(
    firstDefined(pricesRaw, [
      "weth",
      "WETH",
      "prices.weth",
      "prices.WETH",
      "data.weth",
      "data.WETH"
    ])
  );
  const rore = toNumber(
    firstDefined(pricesRaw, [
      "ore",
      "rORE",
      "rore",
      "prices.ore",
      "prices.rORE",
      "data.ore",
      "data.rore"
    ])
  );
  return { weth, rore };
}

function normalizeMotherlode(protocolContainer) {
  const motherlodeWei = firstDefined(protocolContainer, [
    "protocolStats.motherlode",
    "motherlode",
    "stats.motherlode",
    "data.protocolStats.motherlode"
  ]);
  const weiValue = toNumber(motherlodeWei);
  if (weiValue === null) {
    return null;
  }
  return weiValue / 1e18;
}

function extractRoundArray(pageRaw) {
  const arrayCandidate = firstDefined(pageRaw, [
    "roundsData",
    "rounds",
    "items",
    "results",
    "data.roundsData",
    "data.rounds",
    "data.items",
    "data.results"
  ]);
  return Array.isArray(arrayCandidate) ? arrayCandidate : [];
}

function normalizeWinnerType(roundRaw) {
  const winnerTypeRaw = String(
    firstDefined(roundRaw, [
      "winnerType",
      "winner_type",
      "payoutType",
      "resultType",
      "winnerResult"
    ]) || ""
  ).toLowerCase();

  if (winnerTypeRaw.includes("split")) {
    return "split";
  }
  if (winnerTypeRaw.includes("winner take all") || winnerTypeRaw.includes("take_all") || winnerTypeRaw.includes("wta")) {
    return "winner_take_all";
  }

  const winnerCount = toNumber(firstDefined(roundRaw, ["winnerCount", "winnersCount", "winner_count"]));
  if (winnerCount !== null) {
    return winnerCount > 1 ? "split" : "winner_take_all";
  }

  return "winner_take_all";
}

function normalizeRound(roundRaw, fallbackIndex) {
  const id = String(
    firstDefined(roundRaw, [
      "roundId",
      "id",
      "_id",
      "round_id",
      "timestamp"
    ]) || `round-${fallbackIndex}`
  );
  const winnerBlock = toBlockNumber(
    firstDefined(roundRaw, [
      "winnerBlock",
      "winningBlock",
      "block",
      "blockNumber",
      "winBlock"
    ])
  );
  const timestampRaw = firstDefined(roundRaw, ["timestamp", "createdAt", "time", "date"]);
  const endTimestampRaw = firstDefined(roundRaw, [
    "endTimestamp",
    "end_time",
    "endTime",
    "roundEndTimestamp",
    "endedAt"
  ]);
  const motherlodeHitRaw = firstDefined(roundRaw, [
    "motherlodeHit",
    "isMotherlodeHit",
    "hitMotherlode",
    "jackpotHit",
    "hit"
  ]);

  return {
    id,
    timestamp: timestampRaw ? String(timestampRaw) : null,
    endTimestamp: endTimestampRaw ? String(endTimestampRaw) : null,
    winnerType: normalizeWinnerType(roundRaw),
    winnerBlock: winnerBlock === null ? null : Math.trunc(winnerBlock),
    motherlodeHit: Boolean(motherlodeHitRaw)
  };
}

function parsePagination(pageRaw, page) {
  const meta = firstDefined(pageRaw, ["pagination", "meta", "data.pagination", "data.meta"]) || {};
  const hasNext = firstDefined(meta, ["hasNext", "has_next"]);
  const nextPage = toNumber(firstDefined(meta, ["nextPage", "next_page"]));
  const totalPages = toNumber(firstDefined(meta, ["totalPages", "total_pages", "pages"]));

  if (typeof hasNext === "boolean") {
    return { hasNext, nextPage: nextPage || (hasNext ? page + 1 : null) };
  }
  if (nextPage !== null && nextPage > page) {
    return { hasNext: true, nextPage };
  }
  if (totalPages !== null) {
    return { hasNext: page < totalPages, nextPage: page < totalPages ? page + 1 : null };
  }
  return { hasNext: null, nextPage: null };
}

function dedupeRounds(rounds) {
  const seen = new Set();
  const output = [];
  for (const round of rounds) {
    const key = `${round.id}|${round.timestamp || ""}|${round.winnerBlock || ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(round);
  }
  return output;
}

function sortRoundsChronological(rounds) {
  return rounds.slice().sort((a, b) => {
    const aTime = a.timestamp ? Date.parse(a.timestamp) : NaN;
    const bTime = b.timestamp ? Date.parse(b.timestamp) : NaN;
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return aTime - bTime;
    }
    return String(a.id).localeCompare(String(b.id), "en", { numeric: true });
  });
}

function winnerDistribution(rounds) {
  const distribution = {
    winnerTakeAll: 0,
    split: 0
  };
  for (const round of rounds) {
    if (round.winnerType === "split") {
      distribution.split += 1;
    } else {
      distribution.winnerTakeAll += 1;
    }
  }
  return distribution;
}

function toTimestampMs(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = toNumber(value);
  if (numeric !== null) {
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

function filterRoundsLast24Hours(rounds, nowMs = Date.now()) {
  const cutoff = nowMs - (24 * 60 * 60 * 1000);
  return rounds.filter((round) => {
    const endMs = toTimestampMs(round.endTimestamp);
    return endMs !== null && endMs >= cutoff;
  });
}

function winsPerBlock(rounds) {
  const bins = Array.from({ length: BLOCK_COUNT }, (_, i) => ({ block: i + 1, wins: 0 }));
  for (const round of rounds) {
    if (round.winnerBlock >= 1 && round.winnerBlock <= BLOCK_COUNT) {
      bins[round.winnerBlock - 1].wins += 1;
    }
  }
  return bins;
}

function motherlodeHistory(rounds) {
  let roundsSinceLastHit = 0;
  return rounds.map((round, index) => {
    if (round.motherlodeHit) {
      roundsSinceLastHit = 0;
    } else {
      roundsSinceLastHit += 1;
    }
    return {
      x: round.id || index + 1,
      roundId: round.id,
      motherlodeValue: Number((roundsSinceLastHit * MOTHERLODE_INCREMENT).toFixed(1)),
      motherlodeHit: round.motherlodeHit
    };
  });
}

function buildStatsPayload(pricesRaw, explorePagesRaw) {
  const normalizedPrices = normalizePrices(pricesRaw || {});
  const combinedProtocolStats = explorePagesRaw.find(Boolean) || {};
  const motherlode = normalizeMotherlode(combinedProtocolStats);

  let mergedRounds = [];
  for (const page of explorePagesRaw) {
    const roundArray = extractRoundArray(page);
    mergedRounds = mergedRounds.concat(roundArray);
  }

  const normalizedRounds = mergedRounds.map((round, index) => normalizeRound(round, index));
  const dedupedRounds = dedupeRounds(normalizedRounds);
  const orderedRounds = sortRoundsChronological(dedupedRounds);
  const lastRounds = orderedRounds.slice(-TARGET_ROUNDS);
  const last24hRounds = filterRoundsLast24Hours(orderedRounds);

  const distribution = winnerDistribution(last24hRounds);
  const barBins = winsPerBlock(lastRounds);
  const lineHistory = motherlodeHistory(lastRounds);

  return {
    stats: {
      motherlode,
      weth: normalizedPrices.weth,
      rore: normalizedPrices.rore
    },
    roundsProcessed: lastRounds.length,
    pie: distribution,
    bar: barBins,
    line: lineHistory
  };
}

module.exports = {
  BLOCK_COUNT,
  MOTHERLODE_INCREMENT,
  TARGET_ROUNDS,
  buildStatsPayload,
  extractRoundArray,
  filterRoundsLast24Hours,
  motherlodeHistory,
  normalizePrices,
  parsePagination,
  toTimestampMs,
  winsPerBlock,
  winnerDistribution
};
