import { render, screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import TaskStatsChart from './TaskStatsChart';

// Mock MUI X Charts LineChart since it requires canvas
vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: ({
    series,
    xAxis,
  }: {
    series: Array<{ label: string; data: number[] }>;
    xAxis: Array<{ data: string[] }>;
  }) => (
    <div data-testid="line-chart">
      <div data-testid="x-axis">{xAxis[0].data.join(',')}</div>
      {series.map((s) => (
        <div key={s.label} data-testid={`series-${s.label.toLowerCase()}`}>
          {s.label}: {s.data.join(',')}
        </div>
      ))}
    </div>
  ),
}));

describe('TaskStatsChart', () => {
  test('renders heading with correct text', () => {
    const statistics = {
      dates: ['2024-01-01'],
      created: [5],
      completed: [2],
      inProgress: [3],
    };

    render(<TaskStatsChart statistics={statistics} />);

    expect(screen.getByRole('heading', { name: 'Task Trends' })).toBeInTheDocument();
  });

  test('renders chart with data when statistics are provided', () => {
    const statistics = {
      dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
      created: [5, 3, 7],
      completed: [2, 4, 3],
      inProgress: [3, 1, 2],
    };

    render(<TaskStatsChart statistics={statistics} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('series-created')).toHaveTextContent('Created: 5,3,7');
    expect(screen.getByTestId('series-completed')).toHaveTextContent('Completed: 2,4,3');
    expect(screen.getByTestId('series-in progress')).toHaveTextContent(
      'In Progress: 3,1,2',
    );
  });

  test('formats dates for display on x-axis', () => {
    const statistics = {
      dates: ['2024-01-15', '2024-02-20'],
      created: [5, 3],
      completed: [2, 4],
      inProgress: [3, 1],
    };

    render(<TaskStatsChart statistics={statistics} />);

    // Check formatted dates (Jan 15, Feb 20)
    const xAxis = screen.getByTestId('x-axis');
    expect(xAxis).toHaveTextContent('Jan 15');
    expect(xAxis).toHaveTextContent('Feb 20');
  });

  test('displays empty state when no data available', () => {
    const statistics = {
      dates: [],
      created: [],
      completed: [],
      inProgress: [],
    };

    render(<TaskStatsChart statistics={statistics} />);

    expect(screen.getByText('No task data available')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  test('renders within a card component', () => {
    const statistics = {
      dates: ['2024-01-01'],
      created: [5],
      completed: [2],
      inProgress: [3],
    };

    const { container } = render(<TaskStatsChart statistics={statistics} />);

    // MUI Card component has role presentation or article
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  test('renders all three data series', () => {
    const statistics = {
      dates: ['2024-01-01'],
      created: [10],
      completed: [5],
      inProgress: [3],
    };

    render(<TaskStatsChart statistics={statistics} />);

    expect(screen.getByTestId('series-created')).toBeInTheDocument();
    expect(screen.getByTestId('series-completed')).toBeInTheDocument();
    expect(screen.getByTestId('series-in progress')).toBeInTheDocument();
  });
});
