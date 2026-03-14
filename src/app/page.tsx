import BlockPerformanceBar from './components/BlockPerformanceBar';
import DashboardStats from './components/DashboardStats';
import MotherlodeLineChart from './components/MotherlodeLineChart';
import WinnerTypesPie from './components/WinnerTypesPie';
import { getDbStatsData } from './lib/db-stats';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getDbStatsData();

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#fff3e8]">
            rORE Stats Dashboard
          </h1>
        </header>

        {/* Stat Cards Grid */}
        <section className="mb-8">
          <DashboardStats data={data} />
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Winner Types Pie + Block Performance Bar */}
          <div className="flex flex-col gap-8">
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 shadow-lg">
              <WinnerTypesPie data={data} />
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 shadow-lg">
              <BlockPerformanceBar data={data} />
            </div>
          </div>

          {/* Right Column: Motherlode Line Chart */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 shadow-lg">
            <MotherlodeLineChart data={data} />
          </div>
        </section>
      </div>
    </main>
  );
}
