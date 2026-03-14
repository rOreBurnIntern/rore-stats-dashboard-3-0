import StatCard from './StatCard';
import { getDbStatsData } from '../lib/db-stats';

export default async function DashboardStats() {
  const data = await getDbStatsData();

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatCard
        label="WETH Price"
        value={currentPrice.WETH.toFixed(2)}
        unit="USD"
      />
      <StatCard
        label="rORE Price"
        value={currentPrice.rORE.toFixed(4)}
        unit="USD"
      />
      <StatCard
        label="Motherlode Total"
        value={motherlodeTotal.toFixed(2)}
        unit="WETH"
      />
      <StatCard
        label="Total rORE Locked"
        value={totalORELocked.toFixed(2)}
        unit="rORE"
      />
    </div>
  );
}
