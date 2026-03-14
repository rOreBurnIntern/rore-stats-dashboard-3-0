import { getDbStatsData } from '@/app/lib/db-stats';
import type { DbStatsData } from '@/app/lib/db-stats';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function fetchMotherlodeHistory(): Promise<Array<{round_id: number, motherlode_running: number}>> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[fetchMotherlodeHistory] Supabase credentials missing', { url: !!supabaseUrl, key: !!supabaseKey });
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase
      .from('motherlode_snapshots')
      .select('round_id, motherlode_value')
      .order('round_id', { ascending: true });

    if (error) {
      console.error('[fetchMotherlodeHistory] Query error:', error);
      return [];
    }

    return (data || []).map((row: any) => {
      // Convert Wei (18 decimals) to decimal number
      const weiValue = BigInt(row.motherlode_value);
      const decimalValue = Number(weiValue) / 1e18;
      return {
        round_id: Number(row.round_id),
        motherlode_running: Math.round(decimalValue * 100) / 100,
      };
    });
  } catch (err) {
    console.error('[fetchMotherlodeHistory] Error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

const UPSTREAM_BASE = 'https://api.rore.supply';

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

async function fetchUpstreamStats(): Promise<DbStatsData | null> {
  try {
    // Fetch prices
    const pricesRes = await fetch(`${UPSTREAM_BASE}/api/prices`, {
      next: { revalidate: 30 },
    });
    if (!pricesRes.ok) throw new Error(`Prices fetch failed: ${pricesRes.status}`);
    const prices = await pricesRes.json();

    // Fetch rounds (up to 200 pages)
    const rounds: any[] = [];
    for (let page = 1; page <= 200; page++) {
      try {
        const res = await fetch(`${UPSTREAM_BASE}/api/explore?page=${page}`);
        if (!res.ok) break;
        const body = await res.json();
        if (!body?.results?.length) break;
        rounds.push(...body.results);
      } catch {
        break;
      }
    }

    const totalRounds = rounds.length;

    // currentPrice
    const currentPrice = {
      rORE: roundTo(Number(prices.rore) || 0, 4),
      WETH: roundTo(Number(prices.weth) || 0, 2),
    };

    // motherlodeTotal from prices
    const motherlodeTotal = roundTo(Number(prices.motherlode) || 0, 2);

    // totalORELocked: sum of ore_amount across rounds (may not be in upstream)
    const totalORELocked = roundTo(
      rounds.reduce((sum, r) => sum + (Number(r.oreAmount) || 0), 0),
      2
    );

    // blockPerformance: blocks 1-25
    const blockWins = new Map<number, number>();
    for (const r of rounds) {
      const b = parseInt(r.block);
      if (b >= 1 && b <= 25) {
        blockWins.set(b, (blockWins.get(b) || 0) + 1);
      }
    }
    const blockPerformance = Array.from({ length: 25 }, (_, i) => {
      const block = i + 1;
      const wins = blockWins.get(block) || 0;
      const percentage = totalRounds > 0 ? roundTo((wins * 100) / totalRounds, 1) : 0;
      return { block, wins, percentage };
    });

    // winnerTypesDistribution
    const winnerTakeAll = rounds.filter((r) => r.winnerTakeAll).length;
    const splitEvenly = rounds.filter((r) => !r.winnerTakeAll).length;
    const winnerTypesDistribution = {
      WINNER_TAKE_ALL: winnerTakeAll,
      SPLIT_EVENLY: splitEvenly,
    };

    // motherlodeHistory
    const motherlodeHistory = rounds
      .filter((r) => r.roundId != null)
      .map((r) => ({
        round_id: Number(r.roundId),
        motherlode_running: roundTo(Number(r.motherlode) || 0, 2),
      }))
      .sort((a, b) => a.round_id - b.round_id);

    return {
      currentPrice,
      motherlodeTotal,
      totalORELocked,
      blockPerformance,
      winnerTypesDistribution,
      motherlodeHistory,
    };
  } catch (err) {
    console.error('[fetchUpstreamStats] Error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function GET() {
  // Try Supabase-backed data first
  let data: DbStatsData | null = await getDbStatsData();

  // Fall back to upstream proxy if Supabase is unavailable
  if (!data) {
    console.warn('[/api/stats] Supabase unavailable, falling back to upstream proxy');
    data = await fetchUpstreamStats();
  }

  if (!data) {
    return Response.json(
      { error: 'Failed to load stats data from all sources' },
      { status: 500 }
    );
  }

  // Always try to fetch motherlode history from Supabase snapshots table
  const motherlodeHistory = await fetchMotherlodeHistory();
  if (motherlodeHistory.length > 0) {
    data.motherlodeHistory = motherlodeHistory;
  }

  return Response.json(data);
}
