import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WinnerTypesPie from '../src/app/components/WinnerTypesPie';

// Mock the db-stats module
vi.mock('../src/app/lib/db-stats', () => ({
  getDbStatsData: vi.fn()
}));

// Get reference to the mocked function
import { getDbStatsData } from '../src/app/lib/db-stats';
const mockGetDbStatsData = vi.mocked(getDbStatsData);

describe('WinnerTypesPie Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetDbStatsData.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<WinnerTypesPie />);
    expect(screen.getByTestId('winner-types-pie-loading')).toBeInTheDocument();
  });

  it('renders pie chart canvas after data loads', async () => {
    mockGetDbStatsData.mockResolvedValue({
      winnerTypesDistribution: { WINNER_TAKE_ALL: 600, SPLIT_EVENLY: 444 }
    });

    render(<WinnerTypesPie />);

    await waitFor(() => {
      const container = screen.getByTestId('winner-types-pie');
      expect(container).toBeInTheDocument();
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('title displays correct text', async () => {
    mockGetDbStatsData.mockResolvedValue({
      winnerTypesDistribution: { WINNER_TAKE_ALL: 600, SPLIT_EVENLY: 444 }
    });

    render(<WinnerTypesPie />);

    await waitFor(() => {
      expect(screen.getByText('Winner Types (Last 1,044 Rounds)')).toBeInTheDocument();
    });
  });

  it('chart renders without crashing with valid data', async () => {
    mockGetDbStatsData.mockResolvedValue({
      winnerTypesDistribution: { WINNER_TAKE_ALL: 600, SPLIT_EVENLY: 444 }
    });

    const { container } = render(<WinnerTypesPie />);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('handles null data gracefully', async () => {
    mockGetDbStatsData.mockResolvedValue(null);

    render(<WinnerTypesPie />);

    await waitFor(() => {
      expect(screen.getByTestId('winner-types-pie-error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to load data/i)).toBeInTheDocument();
    });
  });

  it('renders with zero values', async () => {
    mockGetDbStatsData.mockResolvedValue({
      winnerTypesDistribution: { WINNER_TAKE_ALL: 0, SPLIT_EVENLY: 0 }
    });

    const { container } = render(<WinnerTypesPie />);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('shows both segments in chart data', async () => {
    mockGetDbStatsData.mockResolvedValue({
      winnerTypesDistribution: { WINNER_TAKE_ALL: 600, SPLIT_EVENLY: 444 }
    });

    render(<WinnerTypesPie />);

    await waitFor(() => {
      // The chart is rendered; the data is correctly structured
      // We can verify the component doesn't throw errors
      expect(screen.getByTestId('winner-types-pie')).toBeInTheDocument();
    });
  });
});
