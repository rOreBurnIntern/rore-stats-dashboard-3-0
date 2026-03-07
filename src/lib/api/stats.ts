import { Round, StatsPayload } from '../types';

export function extractRoundArray(page: any): Round[] {
  const results = page?.results || page?.rounds?.results || [];
  return results.map((r: any) => ({
    id: String(r.id || r.roundId),
    roundId: String(r.roundId || r.id),
    block: r.block || '',
    winnerTakeAll: r.winnerTakeAll ?? r.winner_take_all ?? true,
    oreWinner: r.oreWinner || r.ore_winner || r.winner || '0',
    motherlode: r.motherlode || r.mother_lode || '0',
    motherlodeHit: r.motherlodeHit || r.mother_lode_hit || false,
    endTimestamp: r.endTimestamp || r.end_timestamp || r.timestamp || 0,
  }));
}

export function toTimestampMs(value: any): number | null {
  if (!value) return null;
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return null;
  // If it's in seconds, convert to ms
  return num < 1e12 ? num * 1000 : num;
}

export function buildDerivedData(rounds: Round[]) {
  const pie = { winnerTakeAll: 0, split: 0 };
  const bar = Array.from({ length: 26 }, (_, block) => ({ block, wins: 0 }));
  const line: Array<{ timestamp: number; motherlode: number }> = [];

  const sortedRounds = [...rounds].sort((a, b) => {
    const aMs = toTimestampMs(a.endTimestamp);
    const bMs = toTimestampMs(b.endTimestamp);
    if (aMs !== null && bMs !== null && aMs !== bMs) return aMs - bMs;
    return a.roundId.localeCompare(b.roundId, 'en', { numeric: true });
  });

  for (const round of sortedRounds) {
    if (round.winnerTakeAll) {
      pie.winnerTakeAll++;
    } else {
      pie.split++;
    }

    const blockNum = parseInt(round.block, 10);
    if (!Number.isNaN(blockNum) && blockNum >= 0 && blockNum <= 25) {
      bar[blockNum].wins++;
    }

    const ms = toTimestampMs(round.endTimestamp);
    const ml = parseFloat(round.motherlode);
    if (ms !== null && !Number.isNaN(ml)) {
      line.push({ timestamp: ms, motherlode: ml });
    }
  }

  return { pie, bar, line };
}

export function buildStatsPayload(
  prices: any,
  rounds: Round[],
  source: 'upstream' | 'supabase' = 'upstream'
): StatsPayload {
  const { pie, bar, line } = buildDerivedData(rounds);
  
  return {
    prices: {
      wethPrice: prices?.weth || '0',
      rorePrice: prices?.rore || '0',
      motherlode: prices?.motherlode || '0',
      lastUpdate: new Date().toISOString(),
    },
    rounds: rounds.slice(-1000),
    pie,
    bar,
    line,
    source,
    lastUpdate: new Date().toISOString(),
  };
}
