import { NextResponse } from 'next/server';

const UPSTREAM_BASE = 'https://api.rore.supply';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch prices from upstream
    const pricesRes = await fetch(`${UPSTREAM_BASE}/api/prices`, {
      next: { revalidate: 30 }
    });
    const prices = await pricesRes.json();

    // Fetch rounds from upstream
    const pages: any[] = [];
    let page = 1;
    while (page <= 200) {
      try {
        const res = await fetch(`${UPSTREAM_BASE}/api/explore?page=${page}`);
        const data = await res.json();
        if (!data?.results?.length) break;
        pages.push(...data.results);
        page++;
      } catch {
        break;
      }
    }

    // Build response
    const winnerTakeAll = pages.filter((r: any) => r.winnerTakeAll).length;
    const split = pages.filter((r: any) => !r.winnerTakeAll).length;
    
    const bar = Array.from({ length: 26 }, (_, i) => ({
      block: i,
      wins: pages.filter((r: any) => parseInt(r.block) === i).length
    }));

    const line = pages.map((r: any) => ({
      timestamp: r.endTimestamp * 1000,
      motherlode: parseFloat(r.motherlode) || 0
    })).filter((r: any) => r.timestamp > 0);

    return NextResponse.json({
      stats: {
        motherlode: prices.motherlode || '0',
        rorePrice: prices.rore || '0',
        wethPrice: prices.weth || '0'
      },
      charts: {
        pie: { winnerTakeAll, split },
        bar,
        line
      },
      lastUpdated: new Date().toISOString(),
      range: 'all',
      source: 'upstream'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
