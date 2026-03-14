'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { DbStatsData } from '../lib/db-stats';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface WinnerTypesPieProps {
  data?: DbStatsData | null;
}

export default function WinnerTypesPie({ data: propData }: WinnerTypesPieProps) {
  const data = propData ?? null;

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-400" data-testid="winner-types-pie-error">
        <p>Unable to load data. Please try again later.</p>
      </div>
    );
  }

  const { WINNER_TAKE_ALL, SPLIT_EVENLY } = data.winnerTypesDistribution;
  const total = WINNER_TAKE_ALL + SPLIT_EVENLY;

  const chartData = {
    labels: ['Winner Take All', 'Split Evenly'],
    datasets: [
      {
        data: [WINNER_TAKE_ALL, SPLIT_EVENLY],
        backgroundColor: ['#3b82f6', '#a855f7'], // rORE blue and purple
        borderColor: '#1f2937',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#fff3e8',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        },
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: '#fff3e8',
        bodyColor: '#fff3e8',
        borderColor: '#4b5563',
        borderWidth: 1
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4" data-testid="winner-types-pie">
      <h3 className="text-xl font-bold text-[#fff3e8] mb-4 text-center">
        Winner Types (Last 1,044 Rounds)
      </h3>
      <div className="w-full max-w-md" style={{ height: '300px' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
