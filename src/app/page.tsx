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
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
        </div>
      </main>
    );
  }

  const motherlode = parseFloat(data?.stats?.motherlode || '0');
  const rorePrice = parseFloat(data?.stats?.rorePrice || '0');
  const wethPrice = parseFloat(data?.stats?.wethPrice || '0');
  const roreUsd = rorePrice * wethPrice;

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              rORE <span className="text-blue-500">Stats</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex">
              {(['24h', '7d', 'all'] as Range[]).map((r) => (
                <button
                  key={r}
                  className={`px-3 py-1.5 text-sm ${range === r 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-transparent hover:bg-gray-100 text-gray-900'} ${r !== '24h' ? 'rounded-l-none rounded-r-none border-l-0 border-r-0' : 'rounded-l-md rounded-r-md'}`}
                  onClick={() => setRange(r)}
                  style={range === '24h' ? { borderTopLeftRadius: '0.375rem', borderBottomLeftRadius: '0.375rem' } : 
                         range === 'all' ? { borderTopRightRadius: '0.375rem', borderBottomRightRadius: '0.375rem' } : {}}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-4">
              <h2 className="text-sm text-gray-500">🔥 Motherlode</h2>
              <p className="text-3xl font-bold text-blue-500">{motherlode.toFixed(2)} rORE</p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-4">
              <h2 className="text-sm text-gray-500">💰 rORE Price</h2>
              <p className="text-3xl font-bold">${rorePrice.toFixed(3)}</p>
              <p className="text-sm text-gray-500">≈ ${roreUsd.toFixed(2)} USD</p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-4">
              <h2 className="text-sm text-gray-500">Ξ WETH Price</h2>
              <p className="text-3xl font-bold">${wethPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-900">Winner Type</h2>
              <PieChartComponent
                winnerTakeAll={data?.charts?.pie?.winnerTakeAll || 0}
                split={data?.charts?.pie?.split || 0}
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-900">Wins by Block</h2>
              <BarChartComponent data={data?.charts?.bar || []} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-900">Motherlode History</h2>
              <LineChartComponent data={data?.charts?.line || []} />
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
