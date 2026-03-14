'use client';

import StatCard from './StatCard';
import type { DbStatsData } from '../lib/db-stats';
import { useStatsData } from '../lib/use-stats-data';

interface DashboardStatsProps {
  data?: DbStatsData | null;
}

export default function DashboardStats({ data: propData }: DashboardStatsProps) {
  const { data, loading } = useStatsData(propData ?? null);

  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <div className="col-span-full text-center text-gray-400">
          Loading stats data...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <div className="col-span-full text-center text-gray-400">
          Unable to load stats data.
        </div>
      </div>
    );
  }

  const { currentPrice, motherlodeTotal, totalORELocked } = data;

  // Defensive: guard against null/undefined numeric fields
  const wethPrice = typeof currentPrice?.WETH === 'number' ? currentPrice.WETH : 0;
  const rorePrice = typeof currentPrice?.rORE === 'number' ? currentPrice.rORE : 0;
  const motherlode = typeof motherlodeTotal === 'number' ? motherlodeTotal : 0;
  const oreLocked = typeof totalORELocked === 'number' ? totalORELocked : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatCard
        label="WETH Price"
        value={wethPrice.toFixed(2)}
        unit="USD"
      />
      <StatCard
        label="rORE Price"
        value={rorePrice.toFixed(4)}
        unit="USD"
      />
      <StatCard
        label="Motherlode Total"
        value={motherlode.toFixed(2)}
        unit="WETH"
      />
      <StatCard
        label="Total rORE Locked"
        value={oreLocked.toFixed(2)}
        unit="rORE"
      />
    </div>
  );
}
