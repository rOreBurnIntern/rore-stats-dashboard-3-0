'use client';

import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import type { DbStatsData } from '../lib/db-stats';
import { useStatsData } from '../lib/use-stats-data';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

interface MotherlodeLineChartProps {
  data?: DbStatsData | null;
}

export default function MotherlodeLineChart({ data: propData }: MotherlodeLineChartProps) {
  const { data, loading, error } = useStatsData(propData ?? null);
  const chartRef = useRef<any>(null);

  if (loading && !data) {
    return (
      <div className="w-full p-4">
        <h3 className="text-xl font-bold mb-4">Motherlode History (All Rounds)</h3>
        <div className="text-center text-gray-400">
          Loading motherlode data...
        </div>
      </div>
    );
  }

  if (!data || !data.motherlodeHistory || data.motherlodeHistory.length === 0) {
    return (
      <div className="w-full p-4">
        <h3 className="text-xl font-bold mb-4">Motherlode History (All Rounds)</h3>
        <div className="text-center text-gray-400">
          {error ?? 'No motherlode data available'}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.motherlodeHistory.map((m: any) => m.round_id.toString()),
    datasets: [
      {
        label: 'Motherlode (rORE)',
        data: data.motherlodeHistory.map((m: any) => m.motherlode_running),
        borderColor: '#ffb15c',
        backgroundColor: 'rgba(255, 177, 92, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      zoom: {
        zoom: {
          wheel: { enabled: true, speed: 0.1 },
          pinch: { enabled: true },
          mode: 'xy'
        },
        pan: { enabled: true, mode: 'xy' }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const raw = context?.raw;
            const val = typeof raw === 'number' ? raw : Number(raw) || 0;
            return `Motherlode: ${val.toFixed(2)} rORE`;
          },
          title: (context: any) => `Round ${context?.[0]?.label ?? ''}`,
        }
      },
      legend: { display: true, position: 'top' }
    },
    scales: {
      y: { title: { display: true, text: 'Motherlode (rORE)' } },
      x: { title: { display: true, text: 'Round ID' } }
    }
  };

  return (
    <div className="w-full p-4">
      <h3 className="text-xl font-bold mb-4">Motherlode History (All Rounds)</h3>
      <div className="bg-gray-900 rounded border border-gray-700 p-4">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      <button
        onClick={() => {
          chartRef.current?.resetZoom?.();
        }}
        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        Reset Zoom/Pan
      </button>
    </div>
  );
}
