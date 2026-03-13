'use client';

import { useState, useEffect } from 'react';
import { PieChartComponent } from '@/components/charts/PieChart';
import { BarChartComponent } from '@/components/charts/BarChart';
import { LineChartComponent } from '@/components/charts/LineChart';

type Range = '24h' | '7d' | 'all';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('24h');
  const [theme, setTheme] = useState<'light' | 'night'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('rore-theme');
    if (saved) setTheme(saved as 'light' | 'night');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rore-theme', theme);
  }, [theme]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed:', err);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main data-theme={theme} className="min-h-screen bg-base-200 p-4">
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </main>
    );
  }

  const motherlode = parseFloat(data?.stats?.motherlode || '0');
  const rorePrice = parseFloat(data?.stats?.rorePrice || '0');
  const wethPrice = parseFloat(data?.stats?.wethPrice || '0');
  const roreUsd = rorePrice * wethPrice;

  return (
    <main data-theme={theme} className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-base-content">
              rORE <span className="text-primary">Stats</span>
            </h1>
            <p className="text-sm opacity-60 mt-1">
              Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="join">
              {(['24h', '7d', 'all'] as Range[]).map((r) => (
                <button
                  key={r}
                  className={`join-item btn btn-sm ${range === r ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setRange(r)}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => setTheme(theme === 'light' ? 'night' : 'light')}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <h2 className="card-title text-sm opacity-60">🔥 Motherlode</h2>
              <p className="text-3xl font-bold text-primary">{motherlode.toFixed(2)} rORE</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <h2 className="card-title text-sm opacity-60">💰 rORE Price</h2>
              <p className="text-3xl font-bold">${rorePrice.toFixed(3)}</p>
              <p className="text-sm opacity-60">≈ ${roreUsd.toFixed(2)} USD</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <h2 className="card-title text-sm opacity-60">Ξ WETH Price</h2>
              <p className="text-3xl font-bold">${wethPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <h2 className="card-title text-sm">Winner Type</h2>
              <PieChartComponent 
                winnerTakeAll={data?.charts?.pie?.winnerTakeAll || 0} 
                split={data?.charts?.pie?.split || 0} 
              />
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg md:col-span-2">
            <div className="card-body p-4">
              <h2 className="card-title text-sm">Wins by Block</h2>
              <BarChartComponent data={data?.charts?.bar || []} />
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg md:col-span-2 lg:col-span-3">
            <div className="card-body p-4">
              <h2 className="card-title text-sm">Motherlode History</h2>
              <LineChartComponent data={data?.charts?.line || []} />
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
