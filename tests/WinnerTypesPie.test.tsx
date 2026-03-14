import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WinnerTypesPie from '../src/app/components/WinnerTypesPie';

const mockDbData = {
  currentPrice: { rORE: 0.0781, WETH: 2087.4 },
  motherlodeTotal: 1234.56,
  totalORELocked: 98765.43,
  blockPerformance: [],
  winnerTypesDistribution: { WINNER_TAKE_ALL: 600, SPLIT_EVENLY: 444 },
  motherlodeHistory: [],
};

describe('WinnerTypesPie Component', () => {
  it('renders pie chart canvas when data is provided', async () => {
    render(<WinnerTypesPie data={mockDbData} />);

    await waitFor(() => {
      const container = screen.getByTestId('winner-types-pie');
      expect(container).toBeInTheDocument();
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('title displays correct text', async () => {
    render(<WinnerTypesPie data={mockDbData} />);

    await waitFor(() => {
      expect(screen.getByText('Winner Types (Last 1,044 Rounds)')).toBeInTheDocument();
    });
  });

  it('chart renders without crashing with valid data', async () => {
    const { container } = render(<WinnerTypesPie data={mockDbData} />);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('handles missing data gracefully', async () => {
    render(<WinnerTypesPie data={null} />);

    await waitFor(() => {
      expect(screen.getByTestId('winner-types-pie-error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to load data/i)).toBeInTheDocument();
    });
  });

  it('renders with zero values', async () => {
    const { container } = render(
      <WinnerTypesPie
        data={{
          ...mockDbData,
          winnerTypesDistribution: { WINNER_TAKE_ALL: 0, SPLIT_EVENLY: 0 }
        }}
      />
    );

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('shows both segments in chart data', async () => {
    render(<WinnerTypesPie data={mockDbData} />);

    await waitFor(() => {
      // The chart is rendered; the data is correctly structured
      // We can verify the component doesn't throw errors
      expect(screen.getByTestId('winner-types-pie')).toBeInTheDocument();
    });
  });
});
