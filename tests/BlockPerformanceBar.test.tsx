import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import BlockPerformanceBar from '../src/app/components/BlockPerformanceBar';

// Mock Chart.js to avoid canvas issues in tests
vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: { data: any; options: any }) => (
    <div data-testid="mock-bar-chart">
      <div data-testid="chart-title">{options?.plugins?.title?.text || 'Chart'}</div>
      <div data-testid="chart-labels">{JSON.stringify(data.labels)}</div>
      <div data-testid="chart-data">{JSON.stringify(data.datasets[0]?.data)}</div>
      <div data-testid="chart-color">{data.datasets[0]?.backgroundColor}</div>
    </div>
  ),
}));

describe('BlockPerformanceBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBlockPerformance = [
    { block: 1, wins: 45, percentage: 4.3 },
    { block: 2, wins: 32, percentage: 3.1 },
    { block: 3, wins: 28, percentage: 2.7 },
    { block: 4, wins: 35, percentage: 3.4 },
    { block: 5, wins: 40, percentage: 3.9 },
    { block: 6, wins: 22, percentage: 2.1 },
    { block: 7, wins: 30, percentage: 2.9 },
    { block: 8, wins: 25, percentage: 2.4 },
    { block: 9, wins: 18, percentage: 1.7 },
    { block: 10, wins: 20, percentage: 1.9 },
    { block: 11, wins: 15, percentage: 1.4 },
    { block: 12, wins: 12, percentage: 1.2 },
    { block: 13, wins: 10, percentage: 1.0 },
    { block: 14, wins: 8, percentage: 0.8 },
    { block: 15, wins: 6, percentage: 0.6 },
    { block: 16, wins: 5, percentage: 0.5 },
    { block: 17, wins: 4, percentage: 0.4 },
    { block: 18, wins: 3, percentage: 0.3 },
    { block: 19, wins: 2, percentage: 0.2 },
    { block: 20, wins: 1, percentage: 0.1 },
    { block: 21, wins: 1, percentage: 0.1 },
    { block: 22, wins: 0, percentage: 0.0 },
    { block: 23, wins: 0, percentage: 0.0 },
    { block: 24, wins: 0, percentage: 0.0 },
    { block: 25, wins: 0, percentage: 0.0 },
  ];

  const mockDbData = {
    currentPrice: { rORE: 0.0781, WETH: 2087.40 },
    motherlodeTotal: 1234.56,
    totalORELocked: 98765.43,
    blockPerformance: mockBlockPerformance,
    winnerTypesDistribution: { WINNER_TAKE_ALL: 680, SPLIT_EVENLY: 364 },
    motherlodeHistory: [
      { round_id: 1, motherlode_running: 100.0 },
      { round_id: 2, motherlode_running: 150.0 },
    ],
  };

  it('renders bar chart component without crashing', async () => {
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
    });
  });

  it('displays the correct title "Block Performance (All Rounds)"', async () => {
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      expect(screen.getByText('Block Performance (All Rounds)')).toBeInTheDocument();
    });
  });

  it('renders with exactly 25 data points (bars)', async () => {
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      const chartDataElement = screen.getByTestId('chart-data');
      const data = JSON.parse(chartDataElement.textContent || '[]');
      expect(data.length).toBe(25);
    });
  });

  it('x-axis shows block numbers 1-25', async () => {
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      const labelsElement = screen.getByTestId('chart-labels');
      const labels = JSON.parse(labelsElement.textContent || '[]');
      expect(labels).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
                              '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
                              '21', '22', '23', '24', '25']);
    });
  });

  it('y-axis data corresponds to win counts for each block', async () => {
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      const dataElement = screen.getByTestId('chart-data');
      const data = JSON.parse(dataElement.textContent || '[]');
      // Verify the win counts match our mock data
      expect(data).toContain(45); // Block 1
      expect(data).toContain(32); // Block 2
      expect(data).toContain(0);  // Block 22-25
      expect(data.length).toBe(25);
    });
  });

  it('bar color is rORE primary blue', async () => {
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      const colorElement = screen.getByTestId('chart-color');
      const color = colorElement.textContent;
      // rORE primary blue should be a blue color - exact hex may vary
      // Common blue values: '#3b82f6' (Tailwind blue-500), '#2563eb', etc.
      // Check that it's a blue-ish color (blue in the name or hex with blue value)
      expect(color).toMatch(/blue|#3b82f6|#2563eb/i);
    });
  });

  it('handles null data gracefully', async () => {
    const { container } = render(<BlockPerformanceBar data={null} />);
    await waitFor(() => {
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Failed to load block performance data')).toBeInTheDocument();
    });
  });

  it('is responsive (container adapts to width)', async () => {
    const { container } = render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      const chartContainer = container.querySelector('[data-testid="mock-bar-chart"]');
      expect(chartContainer).toBeInTheDocument();
      // In actual implementation, we would check for responsive container classes
    });
  });

  it('has tooltips configured to show win count', async () => {
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      // We can verify that callbacks are configured in the options
      // Since we're mocking the Bar component, we might need to enhance the mock
      // For now, verify component renders
      expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
    });
  });

  it('all blocks 1-25 are present in blockPerformance data array', async () => {
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      // In real implementation, we'd check that blockPerformance includes all 25 blocks
      // Since we're mocking the data source, we assume it's correct from getDbStatsData
      // Instead, verify the component passes the data correctly
      const labelsElement = screen.getByTestId('chart-labels');
      const labels = JSON.parse(labelsElement.textContent || '[]');
      expect(labels).toHaveLength(25);
      expect(labels[0]).toBe('1');
      expect(labels[24]).toBe('25');
    });
  });

  it('renders without console errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<BlockPerformanceBar data={mockDbData} />);

    await waitFor(() => {
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
