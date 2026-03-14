import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../src/app/page';

// Mock the db-stats module
vi.mock('../src/app/lib/db-stats', () => ({
  getDbStatsData: vi.fn()
}));

// Get reference to the mocked function
import { getDbStatsData } from '../src/app/lib/db-stats';
const mockGetDbStatsData = vi.mocked(getDbStatsData);

describe('Home Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    currentPrice: {
      rORE: 0.1234,
      WETH: 3500.50
    },
    motherlodeTotal: 150.75,
    totalORELocked: 50000.25,
    blockPerformance: Array.from({ length: 25 }, (_, i) => ({
      block: i + 1,
      wins: Math.floor(Math.random() * 100),
      percentage: (Math.random() * 10).toFixed(1)
    })),
    winnerTypesDistribution: {
      WINNER_TAKE_ALL: 600,
      SPLIT_EVENLY: 444
    },
    motherlodeHistory: Array.from({ length: 100 }, (_, i) => ({
      round_id: i + 1,
      motherlode_running: 100 + i * 0.5
    }))
  };

  it('renders header with correct title', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /rORE Stats Dashboard/i })).toBeInTheDocument();
    });
  });

  it('renders all four stat cards', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards.length).toBe(4);
    });
  });

  it('displays WETH price in stat cards', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('WETH Price')).toBeInTheDocument();
      expect(screen.getByText(`$${mockData.currentPrice.WETH.toFixed(2)}`)).toBeInTheDocument();
    });
  });

  it('displays rORE price in stat cards', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('rORE Price')).toBeInTheDocument();
      expect(screen.getByText(`$${mockData.currentPrice.rORE.toFixed(4)}`)).toBeInTheDocument();
    });
  });

  it('displays Motherlode Total in stat cards', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Motherlode Total')).toBeInTheDocument();
    });
  });

  it('displays Total rORE Locked in stat cards', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Total rORE Locked')).toBeInTheDocument();
    });
  });

  it('renders Winner Types Pie chart section', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Winner Types (Last 1,044 Rounds)')).toBeInTheDocument();
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('renders Block Performance Bar chart section', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Block Performance')).toBeInTheDocument();
    });
  });

  it('renders Motherlode Line chart section with title', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Motherlode History (All Rounds)')).toBeInTheDocument();
    });
  });

  it('renders Reset Zoom button for line chart', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset Zoom/i })).toBeInTheDocument();
    });
  });

  it('displays real numeric values (not N/A)', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      const statValues = screen.getAllByTestId('stat-value');
      statValues.forEach(val => {
        expect(val.textContent).not.toBe('N/A');
        expect(val.textContent).not.toBe('');
      });
    });
  });

  it('handles null data gracefully', async () => {
    mockGetDbStatsData.mockResolvedValue(null);

    render(<Home />);

    await waitFor(() => {
      // Should show error message somewhere in the page
      expect(screen.getByText(/Unable to load stats data/i)).toBeInTheDocument();
    });
  });

  it('no console errors on successful render', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetDbStatsData.mockResolvedValue(mockData);

    render(<Home />);

    await waitFor(() => {
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('responsive layout structure: charts in grid', async () => {
    mockGetDbStatsData.mockResolvedValue(mockData);

    const { container } = render(<Home />);

    await waitFor(() => {
      // Check for grid structure with lg:grid-cols-2
      const gridDiv = container.querySelector('.lg\\:grid-cols-2');
      expect(gridDiv).toBeInTheDocument();
    });
  });
});
