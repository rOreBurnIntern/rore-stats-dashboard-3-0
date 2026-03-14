'use client';

import { useEffect, useState } from 'react';
import type { DbStatsData } from './db-stats';

let statsDataPromise: Promise<DbStatsData | null> | null = null;

function normalizeUpstreamResponse(raw: any): DbStatsData | null {
  try {
    // Old upstream format has { ok, source, data: { stats, pie, bar, line, rounds } }
    if (raw?.data?.stats && raw?.data?.pie) {
      const { stats, pie, bar, line, rounds } = raw.data;
      
      const motherlodeTotal = Number(stats?.motherlode) || 0;

      return {
        currentPrice: {
          rORE: Number(stats?.rore) || 0,
          WETH: Number(stats?.weth) || 0,
        },
        motherlodeTotal,
        totalORELocked: 0, // Not available in upstream format
        blockPerformance: Array.isArray(bar)
          ? bar.map((b: any) => ({
              block: Number(b.block),
              wins: Number(b.wins),
              percentage: 0, // Calculate if needed
            }))
          : [],
        winnerTypesDistribution: {
          WINNER_TAKE_ALL: Number(pie?.winnerTakeAll) || 0,
          SPLIT_EVENLY: Number(pie?.split) || 0,
        },
        // NOTE: Historical motherlode data not available from upstream API.
        // Using current motherlode value for all rounds. History will be built going forward.
        motherlodeHistory: Array.isArray(line)
          ? line
              .filter((l: any) => l.roundId != null)
              .map((l: any) => ({
                round_id: Number(l.roundId),
                motherlode_running: motherlodeTotal, // Use current value for all rounds
              }))
          : [],
      };
    }
    
    return null;
  } catch (err) {
    console.error('[normalizeUpstreamResponse] Error:', err);
    return null;
  }
}

async function fetchStatsData(): Promise<DbStatsData | null> {
  const response = await fetch('/api/stats', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }

  const raw = await response.json();

  // Check if response is new DbStatsData format (has currentPrice at top level)
  if (raw?.currentPrice) {
    return raw as DbStatsData;
  }

  // Otherwise, try to normalize from old upstream format
  const normalized = normalizeUpstreamResponse(raw);
  if (normalized) {
    return normalized;
  }

  // If we can't normalize, log and return null
  console.warn('[fetchStatsData] Unable to parse API response format:', raw);
  return null;
}

function loadStatsData() {
  if (!statsDataPromise) {
    statsDataPromise = fetchStatsData().catch((error) => {
      statsDataPromise = null;
      throw error;
    });
  }

  return statsDataPromise;
}

export function useStatsData(initialData: DbStatsData | null = null) {
  const [data, setData] = useState<DbStatsData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (initialData) {
      setData(initialData);
      setLoading(false);
      setError(null);
      return () => {
        isActive = false;
      };
    }

    setLoading(true);

    loadStatsData()
      .then((nextData) => {
        if (!isActive) {
          return;
        }

        setData(nextData);
        setError(null);
      })
      .catch((nextError: unknown) => {
        if (!isActive) {
          return;
        }

        setData(null);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Failed to load stats data'
        );
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [initialData]);

  return { data, loading, error };
}
