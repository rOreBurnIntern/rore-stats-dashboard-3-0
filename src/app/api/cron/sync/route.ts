import { NextResponse } from 'next/server';
import { fetchExplorePages, fetchJsonWithRetry, UPSTREAM_BASE } from '@/lib/api/upstream';
import { extractRoundArray } from '@/lib/api/stats';

// This would need Supabase service role key to write
// For now, this is a placeholder that demonstrates the endpoint

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prices = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/prices`);
    const pages = await fetchExplorePages(200);
    
    let totalRounds = 0;
    for (const page of pages) {
      const rounds = extractRoundArray(page);
      totalRounds += rounds.length;
    }

    return NextResponse.json({
      success: true,
      pagesFetched: pages.length,
      totalRounds,
      prices: {
        weth: prices?.weth,
        rore: prices?.rore,
        motherlode: prices?.motherlode,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}
