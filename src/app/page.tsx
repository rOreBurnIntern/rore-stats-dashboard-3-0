'use client';

import { useEffect, useState } from 'react';
import { WinnerPieChart } from '@/components/charts/PieChart';
import { WinsBarChart } from '@/components/charts/BarChart';
import { MotherlodeLineChart } from '@/components/charts/LineChart';

type Range = '24h' | '7d' | 'all';
type Theme = 'light' | 'night';

interface LinePoint {
  timestamp: number;
  motherlode: number;
}

interface StatsData {
  prices: {
    wethPrice: string;
    rorePrice: string;
    motherlode: string;
    lastUpdate?: string;
  };
  pie: {
    winnerTakeAll: number;
    split: number;
  };
  bar: Array<{ block: number; wins: number }>;
  line: LinePoint[];
  source: string;
  lastUpdate?: string;
}

const RANGE_MS: Record<Range, number | null> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  all: null,
};

const THEME_KEY = 'rore-theme';

function formatLastUpdated(lastUpdated?: string): string {
  if (!lastUpdated) return 'N/A';
  const parsed = new Date(lastUpdated);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString();
}

export default function Home() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('24h');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'night') {
      setTheme(saved);
      return;
    }

    const prefersNight = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersNight ? 'night' : 'light');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch stats data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredLine = (lineData: LinePoint[]): LinePoint[] => {
    if (range === 'all') {
      return lineData;
    }
    const cutoff = Date.now() - (RANGE_MS[range] ?? 0);
    return lineData.filter((point) => point.timestamp >= cutoff);
  };

  if (loading) {
    return (
      <main data-theme={theme} className="min-h-screen bg-base-200">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 md:px-8">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </main>
    );
  }

  const motherlode = Number.parseFloat(data?.prices?.motherlode ?? '0');
  const rore = Number.parseFloat(data?.prices?.rorePrice ?? '0');
  const weth = Number.parseFloat(data?.prices?.wethPrice ?? '0');
  const roreUsd = rore * weth;
  const rawLastUpdated = data?.prices?.lastUpdate ?? data?.lastUpdate;
  const lastUpdate = formatLastUpdated(rawLastUpdated);

  return (
    <main data-theme={theme} className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="card bg-base-100 shadow-xl rounded-3xl mb-8">
          <div className="card-body p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-4xl font-bold leading-tight text-transparent md:text-6xl">
                  rORE Stats
                </h1>
                <p className="mt-3 text-base md:text-lg text-base-content/70">
                  Last updated:{' '}
                  <time dateTime={rawLastUpdated ?? ''} suppressHydrationWarning>
                    {lastUpdate}
                  </time>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
                <button
                  type="button"
                  className="btn btn-primary btn-md rounded-2xl"
                  onClick={() => setTheme(theme === 'light' ? 'night' : 'light')}
                  aria-label="Toggle theme"
                  title="Toggle light/night theme"
                >
                  <span className="text-lg" aria-hidden="true">
                    {theme === 'night' ? '☀️' : '🌙'}
                  </span>
                  <span className="text-sm md:text-base font-semibold">
                    {theme === 'night' ? 'Light' : 'Night'}
                  </span>
                </button>

                <div className="join">
                  {(['24h', '7d', 'all'] as Range[]).map((currentRange) => (
                    <button
                      key={currentRange}
                      type="button"
                      className={`join-item btn btn-md ${
                        range === currentRange ? 'btn-primary' : 'btn-ghost'
                      }`}
                      onClick={() => setRange(currentRange)}
                    >
                      {currentRange === 'all' ? 'ALL' : currentRange.toUpperCase()}
                    </button>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          <article className="card bg-base-100 shadow-xl rounded-3xl">
            <div className="card-body p-6">
              <h2 className="text-lg md:text-xl font-semibold text-base-content/80 flex items-center gap-2">
                <span aria-hidden="true">🔥</span>
                Motherlode
              </h2>
              <p className="text-4xl md:text-5xl font-bold leading-none text-primary mt-2">
                {motherlode.toFixed(2)}
              </p>
              <p className="text-base md:text-lg text-base-content/60">rORE</p>
            </div>
          </article>

          <article className="card bg-base-100 shadow-xl rounded-3xl">
            <div className="card-body p-6">
              <h2 className="text-lg md:text-xl font-semibold text-base-content/80 flex items-center gap-2">
                <span aria-hidden="true">💰</span>
                rORE Price
              </h2>
              <p className="text-4xl md:text-5xl font-bold leading-none mt-2">
                ${rore.toFixed(3)}
              </p>
              <p className="text-base md:text-lg text-base-content/60">≈ ${roreUsd.toFixed(2)} USD</p>
            </div>
          </article>

          <article className="card bg-base-100 shadow-xl rounded-3xl">
            <div className="card-body p-6">
              <h2 className="text-lg md:text-xl font-semibold text-base-content/80 flex items-center gap-2">
                <span aria-hidden="true">Ξ</span>
                WETH
              </h2>
              <p className="text-4xl md:text-5xl font-bold leading-none mt-2">
                ${weth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-base md:text-lg text-base-content/60">USD</p>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <article className="card bg-base-100 shadow-xl rounded-3xl xl:col-span-4">
            <div className="card-body p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-2">Winner Type</h2>
              <WinnerPieChart
                winnerTakeAll={data?.pie?.winnerTakeAll ?? 0}
                split={data?.pie?.split ?? 0}
              />
            </div>
          </article>

          <article className="card bg-base-100 shadow-xl rounded-3xl xl:col-span-8">
            <div className="card-body p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-2">Wins by Block</h2>
              <WinsBarChart data={data?.bar ?? []} />
            </div>
          </article>

          <article className="card bg-base-100 shadow-xl rounded-3xl xl:col-span-12">
            <div className="card-body p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-2">Motherlode History</h2>
              <MotherlodeLineChart data={filteredLine(data?.line ?? [])} />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
