import BlockPerformanceBar from './components/BlockPerformanceBar';
import DashboardStats from './components/DashboardStats';
import MotherlodeLineChart from './components/MotherlodeLineChart';
import WinnerTypesPie from './components/WinnerTypesPie';

export const dynamic = 'force-dynamic';

export default function Home() {
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
          <DashboardStats />
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Winner Types Pie */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 shadow-lg">
            <WinnerTypesPie />
          </div>

          {/* Right Column: Block Performance Bar */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 shadow-lg">
            <BlockPerformanceBar />
          </div>
        </section>

        {/* Motherlode Line Chart (Full Width at Bottom) */}
        <section>
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 shadow-lg">
            <MotherlodeLineChart />
          </div>
        </section>
      </div>
    </main>
  );
}
