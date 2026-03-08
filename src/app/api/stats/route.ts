import { NextResponse } from 'next/server';
import { fetchJsonWithRetry, fetchExplorePages, UPSTREAM_BASE } from '@/lib/api/upstream';
import { buildStatsData, buildStatsDataFromRounds, StatsApiEnvelope } from '@/lib/api/stats';
import { fetchFallbackFromSupabase } from '@/lib/api/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

function responseWithCache(payload: StatsApiEnvelope, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}

export async function GET() {
  try {
    const [prices, pages] = await Promise.all([
      fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`),
      fetchExplorePages(15),
    ]);

    if (!pages.length) {
      throw new Error('No data from upstream');
    }

    const lastUpdated = new Date().toISOString();
    const payload: StatsApiEnvelope = {
      ok: true,
      source: 'upstream',
      pagesFetched: pages.length,
      lastUpdated,
      data: buildStatsData(prices, pages),
    };

    return responseWithCache(payload);
  } catch (upstreamErr) {
    console.error('[/api/stats] upstream fetch failed', upstreamErr);

    try {
      const fallbackRounds = await fetchFallbackFromSupabase();
      if (!fallbackRounds?.length) {
        throw new Error('Supabase fallback returned no rows');
      }

      const lastUpdated = new Date().toISOString();
      const payload: StatsApiEnvelope = {
        ok: true,
        source: 'supabase-fallback',
        pagesFetched: 0,
        lastUpdated,
        data: buildStatsDataFromRounds(fallbackRounds),
      };

      return responseWithCache(payload);
    } catch (fallbackErr) {
      console.error('[/api/stats] supabase fallback failed', fallbackErr);

      return NextResponse.json(
        {
          ok: false,
          error: 'Upstream data unavailable',
          detail: upstreamErr instanceof Error ? upstreamErr.message : 'Unknown error',
        },
        {
          status: 502,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  }
}
