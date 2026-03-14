import DashboardStats from './components/DashboardStats';
import WinnerTypesPie from './components/WinnerTypesPie';
import BlockPerformanceBar from './components/BlockPerformanceBar';
import MotherlodeLineChart from './components/MotherlodeLineChart';
import { getDbStatsData } from './lib/db-stats';

export default async function Home() {
  // Fetch data on the server side once and pass to all components
  const data = await getDbStatsData();

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#fff3e8]">
            rORE Stats Dashboard
          </h1>
          {data && (
            <p className="text-sm text-gray-400 mt-2">
              Last updated: {new Date().toLocaleString()}
            </p>
          )}
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
            <MotherlodeLineChart />
          </div>
        </section>
      </div>
    </main>
  );
}
