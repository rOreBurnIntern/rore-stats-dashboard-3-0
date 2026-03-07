import { NextResponse } from 'next/server';
import { fetchJsonWithRetry, fetchExplorePages, UPSTREAM_BASE } from '@/lib/api/upstream';
import { extractRoundArray, buildStatsPayload } from '@/lib/api/stats';
import { fetchFallbackFromSupabase } from '@/lib/api/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET() {
  try {
    // Fetch prices
    const prices = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`);
    
    // Fetch explore pages
    const pages = await fetchExplorePages(200);
    
    if (!pages.length) {
      throw new Error('No data from upstream');
    }
    
    // Flatten rounds
    const allRounds: any[] = [];
    for (const page of pages) {
      allRounds.push(...extractRoundArray(page));
    }
    
    // Dedupe by roundId
    const seen = new Set<string>();
    const uniqueRounds = allRounds.filter(r => {
      if (seen.has(r.roundId)) return false;
      seen.add(r.roundId);
      return true;
    });
    
    const payload = buildStatsPayload(prices, uniqueRounds, 'upstream');
    
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (upstreamErr) {
    console.error('Upstream failed, trying Supabase:', upstreamErr);
    
    try {
      const fallbackRounds = await fetchFallbackFromSupabase();
      
      if (!fallbackRounds?.length) {
        return NextResponse.json(
          { error: 'All data sources failed' },
          { status: 502 }
        );
      }
      
      const payload = buildStatsPayload(
        { weth: '0', rore: '0', motherlode: '0' },
        fallbackRounds,
        'supabase'
      );
      
      return NextResponse.json(payload);
    } catch (supabaseErr) {
      console.error('Supabase fallback failed:', supabaseErr);
      return NextResponse.json(
        { error: 'All data sources failed' },
        { status: 502 }
      );
    }
  }
}
