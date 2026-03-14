'use client';

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
import { getDbStatsData, DbStatsData } from '../lib/db-stats';
import { useEffect, useState } from 'react';

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

export default function MotherlodeLineChart() {
  const [data, setData] = useState<DbStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const result = await getDbStatsData();
      if (!result) {
        setError('Failed to load motherlode data');
      } else {
        setData(result);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-4">
        <h3 className="text-xl font-bold mb-4">Motherlode History (All Rounds)</h3>
        <div className="text-center text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (error || !data || !data.motherlodeHistory || data.motherlodeHistory.length === 0) {
    return (
      <div className="w-full p-4">
        <h3 className="text-xl font-bold mb-4">Motherlode History (All Rounds)</h3>
        <div className="text-center text-gray-400">
          {error || 'No motherlode data available'}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.motherlodeHistory.map((m: any) => m.round_id.toString()),
    datasets: [
      {
        label: 'Motherlode (WETH)',
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
          label: (context: any) => `Motherlode: ${context.raw.toFixed(2)} WETH`,
          title: (context: any) => `Round ${context[0].label}`
        }
      },
      legend: { display: true, position: 'top' }
    },
    scales: {
      y: { title: { display: true, text: 'Motherlode (WETH)' } },
      x: { title: { display: true, text: 'Round ID' } }
    }
  };

  return (
    <div className="w-full p-4">
      <h3 className="text-xl font-bold mb-4">Motherlode History (All Rounds)</h3>
      <div className="bg-gray-900 rounded border border-gray-700 p-4">
        <Line data={chartData} options={options} />
      </div>
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        Reset Zoom/Pan
      </button>
    </div>
  );
}
