export const BLOCK_COUNT = 26;
const MOTHERLODE_INCREMENT = 0.2;
const TARGET_ROUNDS = 1000;

interface NormalizedRound {
  id: string;
  winnerTakeAll: boolean;
  winnerBlock: number | null;
  motherlodeHit: boolean;
  endTimestamp: string | null;
}

interface ProtocolStats {
  motherlode: number | null;
  weth: number | null;
  rore: number | null;
}

interface StatsData {
  stats: ProtocolStats;
  roundsProcessed: number;
  rounds: NormalizedRound[];
  pie: {
    winnerTakeAll: number;
    split: number;
  };
  bar: Array<{ block: number; wins: number }>;
  line: Array<{ x: string; motherlodeValue: number }>;
}

export interface StatsApiEnvelope {
  ok: boolean;
  source: 'upstream' | 'supabase-fallback';
  pagesFetched: number;
  lastUpdated: string;
  data: StatsData;
}

function readPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((acc, key) => (acc === null || acc === undefined ? undefined : (acc as Record<string, unknown>)[key]), obj);
}

function firstDefined(obj: unknown, fields: string[]): unknown {
  for (const field of fields) {
    const value = readPath(obj, field);
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toTimestampMs(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
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

function toBlockNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(String(value).replace(/^#/, '').trim());
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.trunc(parsed);
}

function normalizeWinnerTakeAll(rawRound: unknown): boolean {
  const explicit = firstDefined(rawRound, [
    'winnerTakeAll',
    'winner_take_all',
    'isWinnerTakeAll',
    'is_winner_take_all',
  ]);

  if (typeof explicit === 'boolean') {
    return explicit;
  }

  if (typeof explicit === 'string') {
    return explicit.toLowerCase() === 'true';
  }

  const winnerType = String(firstDefined(rawRound, ['winnerType', 'winner_type']) || '').toLowerCase();
  return !winnerType.includes('split');
}

function normalizePrices(pricesRaw: unknown): { weth: number | null; rore: number | null } {
  const weth = toNumber(
    firstDefined(pricesRaw, ['weth', 'WETH', 'prices.weth', 'prices.WETH', 'data.weth', 'data.WETH'])
  );

  const rore = toNumber(
    firstDefined(pricesRaw, ['ore', 'rORE', 'rore', 'prices.ore', 'prices.rORE', 'data.ore', 'data.rore'])
  );

  return { weth, rore };
}

function normalizeMotherlode(pages: unknown[]): number | null {
  const source = pages.find(Boolean);
  if (!source) {
    return null;
  }

  const motherlodeWei = firstDefined(source, [
    'protocolStats.motherlode',
    'motherlode',
    'stats.motherlode',
    'data.protocolStats.motherlode',
  ]);

  const weiValue = toNumber(motherlodeWei);
  if (weiValue === null) {
    return null;
  }

  return weiValue / 1e18;
}

export function extractRoundArray(page: unknown): unknown[] {
  const arrayCandidate = firstDefined(page, [
    'roundsData',
    'rounds',
    'items',
    'results',
    'rounds.results',
    'data.roundsData',
    'data.rounds',
    'data.items',
    'data.results',
  ]);

  return Array.isArray(arrayCandidate) ? arrayCandidate : [];
}

function normalizeRoundForClient(rawRound: unknown, fallbackIndex: number): NormalizedRound {
  const roundId = firstDefined(rawRound, ['roundId', 'id', '_id', 'round_id']);
  const timestampMs = toTimestampMs(
    firstDefined(rawRound, ['endTimestamp', 'end_timestamp', 'timestamp', 'createdAt', 'time'])
  );

  return {
    id: String(roundId ?? `round-${fallbackIndex}`),
    winnerTakeAll: normalizeWinnerTakeAll(rawRound),
    winnerBlock: toBlockNumber(firstDefined(rawRound, ['winnerBlock', 'winningBlock', 'block', 'blockNumber'])),
    motherlodeHit: Boolean(firstDefined(rawRound, ['motherlodeHit', 'isMotherlodeHit', 'hitMotherlode'])),
    endTimestamp: timestampMs !== null ? new Date(timestampMs).toISOString() : null,
  };
}

function dedupeRounds(rounds: NormalizedRound[]): NormalizedRound[] {
  const deduped = new Map<string, NormalizedRound>();

  for (const round of rounds) {
    const dedupeKey = `${round.id}:${round.endTimestamp || ''}:${round.winnerBlock || ''}`;
    deduped.set(dedupeKey, round);
  }

  return Array.from(deduped.values());
}

function sortRoundsChronological(rounds: NormalizedRound[]): NormalizedRound[] {
  return rounds.slice().sort((a, b) => {
    const aMs = toTimestampMs(a.endTimestamp);
    const bMs = toTimestampMs(b.endTimestamp);

    if (aMs !== null && bMs !== null && aMs !== bMs) {
      return aMs - bMs;
    }

    return a.id.localeCompare(b.id, 'en', { numeric: true });
  });
}

function buildClientRounds(pages: unknown[]): NormalizedRound[] {
  const rounds: NormalizedRound[] = [];
  let index = 0;

  for (const page of pages) {
    const pageRounds = extractRoundArray(page);
    for (const rawRound of pageRounds) {
      rounds.push(normalizeRoundForClient(rawRound, index));
      index += 1;
    }
  }

  const deduped = dedupeRounds(rounds);
  return sortRoundsChronological(deduped);
}

function filterRoundsLast24Hours(rounds: NormalizedRound[], nowMs = Date.now()): NormalizedRound[] {
  const cutoff = nowMs - 24 * 60 * 60 * 1000;
  return rounds.filter((round) => {
    const endMs = toTimestampMs(round.endTimestamp);
    return endMs !== null && endMs >= cutoff;
  });
}

function winnerDistribution(rounds: NormalizedRound[]) {
  return rounds.reduce(
    (acc, round) => {
      if (round.winnerTakeAll) {
        acc.winnerTakeAll += 1;
      } else {
        acc.split += 1;
      }
      return acc;
    },
    { winnerTakeAll: 0, split: 0 }
  );
}

function winsPerBlock(rounds: NormalizedRound[]) {
  const bins = Array.from({ length: BLOCK_COUNT }, (_, block) => ({ block, wins: 0 }));

  for (const round of rounds) {
    if (
      Number.isInteger(round.winnerBlock) &&
      round.winnerBlock !== null &&
      round.winnerBlock >= 0 &&
      round.winnerBlock < BLOCK_COUNT
    ) {
      bins[round.winnerBlock].wins += 1;
    }
  }

  return bins;
}

function motherlodeHistory(rounds: NormalizedRound[]) {
  let roundsSinceHit = 0;

  return rounds.map((round, index) => {
    if (round.motherlodeHit) {
      roundsSinceHit = 0;
    } else {
      roundsSinceHit += 1;
    }

    return {
      x: round.id || String(index + 1),
      motherlodeValue: Number((roundsSinceHit * MOTHERLODE_INCREMENT).toFixed(1)),
    };
  });
}

export function buildStatsData(pricesRaw: unknown, pages: unknown[]): StatsData {
  const normalizedPrices = normalizePrices(pricesRaw);
  const rounds = buildClientRounds(pages);
  const lastRounds = rounds.slice(-TARGET_ROUNDS);
  const last24hRounds = filterRoundsLast24Hours(rounds);

  return {
    stats: {
      motherlode: normalizeMotherlode(pages),
      weth: normalizedPrices.weth,
      rore: normalizedPrices.rore,
    },
    roundsProcessed: lastRounds.length,
    rounds: lastRounds,
    pie: winnerDistribution(last24hRounds),
    bar: winsPerBlock(lastRounds),
    line: motherlodeHistory(lastRounds),
  };
}

export function buildStatsDataFromRounds(roundsRaw: unknown[]): StatsData {
  const mapped = roundsRaw.map((round, index) => normalizeRoundForClient(round, index));
  const ordered = sortRoundsChronological(dedupeRounds(mapped));
  const lastRounds = ordered.slice(-TARGET_ROUNDS);
  const last24hRounds = filterRoundsLast24Hours(ordered);

  return {
    stats: {
      motherlode: null,
      weth: null,
      rore: null,
    },
    roundsProcessed: lastRounds.length,
    rounds: lastRounds,
    pie: winnerDistribution(last24hRounds),
    bar: winsPerBlock(lastRounds),
    line: motherlodeHistory(lastRounds),
  };
}
