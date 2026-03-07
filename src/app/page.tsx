'use client';

import { useState, useEffect } from 'react';
import { WinnerPieChart } from '@/components/charts/PieChart';
import { WinsBarChart } from '@/components/charts/BarChart';
import { MotherlodeLineChart } from '@/components/charts/LineChart';

type Range = '24h' | '7d' | 'all';

interface StatsData {
  prices: { wethPrice: string; rorePrice: string; motherlode: string; lastUpdate: string };
  pie: { winnerTakeAll: number; split: number };
  bar: Array<{ block: number; wins: number }>;
  line: Array<{ timestamp: number; motherlode: number }>;
  source: string;
}

const RANGE_MS: Record<Range, number | null> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  all: null,
};

export default function Home() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('24h');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('rore-theme');
    if (saved) setTheme(saved as 'light' | 'dark');
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rore-theme', theme);
  }, [theme]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch:', err);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filterByRange = (lineData: typeof data.line) => {
    if (!lineData || range === 'all') return lineData;
    const cutoff = Date.now() - RANGE_MS[range]!;
    return lineData.filter(d => d.timestamp >= cutoff);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-base-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </main>
    );
  }

  const motherlode = parseFloat(data?.prices?.motherlode || '0');
  const weth = parseFloat(data?.prices?.wethPrice || '0');
  const rore = parseFloat(data?.prices?.rorePrice || '0');
  const roreUsd = rore * weth;

  return (
    <main className="min-h-screen bg-base-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
              rORE Stats
            </h1>
            <p className="text-sm opacity-70 mt-1">
              Last updated: {data?.prices?.lastUpdate ? new Date(data.prices.lastUpdate).toLocaleString() : 'N/A'}
              {data?.source === 'supabase' && <span className="ml-2 badge badge-warning badge-sm">Fallback</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="join">
              {(['24h', '7d', 'all'] as Range[]).map((r) => (
                <button
                  key={r}
                  className={`join-item btn btn-sm ${range === r ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setRange(r)}
                >
                  {r === 'all' ? 'ALL' : r.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-sm opacity-70">Motherlode</h2>
              <p className="text-3xl font-bold text-primary">{motherlode.toFixed(2)} rORE</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-sm opacity-70">rORE Price</h2>
              <p className="text-3xl font-bold">${rore.toFixed(3)}</p>
              <p className="text-sm opacity-70">≈ ${roreUsd.toFixed(2)} USD</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-sm opacity-70">WETH Price</h2>
              <p className="text-3xl font-bold">${weth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card bg-base-200 shadow-sm lg:col-span-1">
            <div className="card-body p-4">
              <h2 className="card-title text-sm">Winner Type Distribution</h2>
              <WinnerPieChart 
                winnerTakeAll={data?.pie?.winnerTakeAll || 0} 
                split={data?.pie?.split || 0} 
              />
            </div>
          </div>
          
          <div className="card bg-base-200 shadow-sm lg:col-span-2">
            <div className="card-body p-4">
              <h2 className="card-title text-sm">Wins by Block</h2>
              <WinsBarChart data={data?.bar || []} />
            </div>
          </div>
          
          <div className="card bg-base-200 shadow-sm md:col-span-2 lg:col-span-3">
            <div className="card-body p-4">
              <h2 className="card-title text-sm">Motherlode History</h2>
              <MotherlodeLineChart data={filterByRange(data?.line || [])} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
