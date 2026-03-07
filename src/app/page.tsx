'use client';

import { useState, useEffect } from 'react';
import { WinnerPieChart } from '@/components/charts/PieChart';
import { WinsBarChart } from '@/components/charts/BarChart';
import { MotherlodeLineChart } from '@/components/charts/LineChart';

type Range = '24h' | '7d' | 'all';

interface LinePoint {
  timestamp: number;
  motherlode: number;
}

interface StatsData {
  prices: { wethPrice: string; rorePrice: string; motherlode: string; lastUpdate: string };
  pie: { winnerTakeAll: number; split: number };
  bar: Array<{ block: number; wins: number }>;
  line: LinePoint[];
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

  const filterByRange = (lineData: LinePoint[]): LinePoint[] => {
    if (!lineData || range === 'all') return lineData;
    const cutoff = Date.now() - RANGE_MS[range]!;
    return lineData.filter(d => d.timestamp >= cutoff);
  };

  if (loading) {
    return (
      <main data-theme={theme} className="min-h-screen bg-base-200">
        <div className="flex items-center justify-center h-screen">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </main>
    );
  }

  const motherlode = parseFloat(data?.prices?.motherlode ?? '0');
  const weth = parseFloat(data?.prices?.wethPrice ?? '0');
  const rore = parseFloat(data?.prices?.rorePrice ?? '0');
  const roreUsd = rore * weth;

  return (
    <main data-theme={theme} className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-base-content">
              rORE <span className="text-primary">Stats</span>
            </h1>
            <p className="text-base-content/60 mt-2 flex items-center gap-2">
              Last updated: {data?.prices?.lastUpdate ? new Date(data.prices.lastUpdate).toLocaleString() : 'N/A'}
              {data?.source === 'supabase' && <span className="badge badge-warning badge-sm">Cache</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="join shadow-sm">
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
            <label className="swap swap-rotate btn btn-ghost btn-circle">
              <input 
                type="checkbox" 
                checked={theme === 'dark'}
                onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              />
              <svg className="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
              </svg>
              <svg className="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
              </svg>
            </label>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-base-content/60 text-sm">Motherlode</h2>
              <p className="text-4xl font-bold text-primary">{motherlode.toFixed(2)}</p>
              <p className="text-base-content/40 text-sm">rORE</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-base-content/60 text-sm">rORE Price</h2>
              <p className="text-4xl font-bold">${rore.toFixed(3)}</p>
              <p className="text-base-content/40 text-sm">≈ ${roreUsd.toFixed(2)} USD</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-base-content/60 text-sm">WETH Price</h2>
              <p className="text-4xl font-bold">${weth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="text-base-content/40 text-sm">USD</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-base-content/80 text-sm">Winner Type</h2>
              <WinnerPieChart 
                winnerTakeAll={data?.pie?.winnerTakeAll ?? 0} 
                split={data?.pie?.split ?? 0} 
              />
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg md:col-span-2">
            <div className="card-body">
              <h2 className="card-title text-base-content/80 text-sm">Wins by Block</h2>
              <WinsBarChart data={data?.bar ?? []} />
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg md:col-span-2 lg:col-span-3">
            <div className="card-body">
              <h2 className="card-title text-base-content/80 text-sm">Motherlode History</h2>
              <MotherlodeLineChart data={filterByRange(data?.line ?? [])} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
