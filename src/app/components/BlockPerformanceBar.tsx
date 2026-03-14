'use client';

import { useEffect, useState } from 'react';
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
import { getDbStatsData, DbStatsData } from '../lib/db-stats';

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
  const [chartData, setChartData] = useState<{ chartData: any; options: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = propData !== undefined ? propData : await getDbStatsData();
        if (!result) {
          setError('Failed to load data');
          setLoading(false);
          return;
        }

        // Ensure we have exactly 25 blocks (1-25)
        const blockPerformance = result.blockPerformance;
        if (!blockPerformance || blockPerformance.length !== 25) {
          console.warn('Expected 25 blocks, got', blockPerformance?.length);
        }

        // Sort by block number to ensure correct order
        const sortedData = [...blockPerformance].sort((a, b) => a.block - b.block);

        const chartDataConfig = {
          labels: sortedData.map((entry: any) => entry.block.toString()),
          datasets: [
            {
              label: 'Win Count',
              data: sortedData.map((entry: any) => entry.wins),
              backgroundColor: '#3b82f6', // rORE primary blue (Tailwind blue-500)
              borderColor: '#1d4ed8', // darker blue for border
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
                // Show every label (1-25)
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
                stepSize: 1, // Ensure integer steps for win counts
              },
              grid: {
                color: '#e5e7eb',
              },
            },
          },
        };

        setChartData({ chartData: chartDataConfig, options });
        setLoading(false);
      } catch (err) {
        console.error('Error loading BlockPerformanceBar data:', err);
        setError('Failed to load block performance data');
        setLoading(false);
      }
    }

    fetchData();
  }, [propData]);

  if (loading) {
    return (
      <div className="w-full p-4 border rounded-lg shadow bg-white">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading block performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 border rounded-lg shadow bg-white">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="w-full p-4 border rounded-lg shadow bg-white">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 border rounded-lg shadow bg-white">
      <Bar data={chartData.chartData} options={chartData.options} />
    </div>
  );
}
