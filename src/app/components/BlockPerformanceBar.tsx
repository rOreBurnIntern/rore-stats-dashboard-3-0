'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { DbStatsData } from '../lib/db-stats';
import { useStatsData } from '../lib/use-stats-data';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BlockPerformanceBarProps {
  data?: DbStatsData | null;
}

export default function BlockPerformanceBar({ data: propData }: BlockPerformanceBarProps) {
  const { data, loading, error } = useStatsData(propData ?? null);

  if (loading && !data) {
    return (
      <div className="w-full p-4 border rounded-lg shadow bg-white">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading block performance data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full p-4 border rounded-lg shadow bg-white">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error ?? 'Failed to load block performance data'}</p>
        </div>
      </div>
    );
  }

  const blockPerformance = data.blockPerformance;
  if (!blockPerformance || blockPerformance.length === 0) {
    return (
      <div className="w-full p-4 border rounded-lg shadow bg-white">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  if (blockPerformance.length !== 25) {
    console.warn('Expected 25 blocks, got', blockPerformance.length);
  }

  const sortedData = [...blockPerformance].sort((a, b) => a.block - b.block);
  const chartData = {
    labels: sortedData.map((entry) => entry.block.toString()),
    datasets: [
      {
        label: 'Win Count',
        data: sortedData.map((entry) => entry.wins),
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 1,
        hoverBackgroundColor: '#2563eb',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: true,
        text: 'Block Performance (All Rounds)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#1f2937',
        padding: {
          bottom: 20,
        },
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
          color: '#4b5563',
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            const block = context.chart.data.labels[context.dataIndex];
            const winCount = context.parsed.y;
            return [
              `Block ${block}`,
              `Wins: ${winCount}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Block Number',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          color: '#4b5563',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
          autoSkip: false,
        },
        grid: {
          color: '#e5e7eb',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Number of Wins',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          color: '#4b5563',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
          beginAtZero: true,
          stepSize: 1,
        },
        grid: {
          color: '#e5e7eb',
        },
      },
    },
  };

  return (
    <div className="w-full p-4 border rounded-lg shadow bg-white">
      <Bar data={chartData} options={options} />
    </div>
  );
}
