import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import TeamInfoCard from './TeamInfoCard';
import TeamInfoCardSkeleton from './TeamInfoCardSkeleton';
import TeamInfoCardError from './TeamInfoCardError';

describe('TeamInfoCard', () => {
  test('renders as a section with accessible name', ({ schema }) => {
    const team = schema.teams.create().toJSON();

    render(<TeamInfoCard team={team} />);

    const section = screen.getByRole('region', { name: team.name });
    expect(section).toBeInTheDocument();
  });

  test('renders team name as heading', ({ schema }) => {
    const team = schema.teams.create().toJSON();

    render(<TeamInfoCard team={team} />);

    expect(
      screen.getByRole('heading', { name: team.name, level: 3 }),
    ).toBeInTheDocument();
  });

  test('renders department chip', ({ schema }) => {
    const team = schema.teams.create({ department: 'Engineering' }).toJSON();

    render(<TeamInfoCard team={team} />);

    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  test('renders team description', ({ schema }) => {
    const team = schema.teams
      .create({
        description: 'A team focused on frontend development',
      })
      .toJSON();

    render(<TeamInfoCard team={team} />);

    expect(
      screen.getByText('A team focused on frontend development'),
    ).toBeInTheDocument();
  });

  test('renders creation date', ({ schema }) => {
    const team = schema.teams.create().toJSON();

    render(<TeamInfoCard team={team} />);

    const formattedDate = new Date(team.createdAt).toLocaleDateString();
    expect(screen.getByText(`Created: ${formattedDate}`)).toBeInTheDocument();
  });

  test('renders all team info within section', ({ schema }) => {
    const team = schema.teams
      .create({
        name: 'Frontend Team',
        department: 'Engineering',
        description: 'Building awesome UIs',
      })
      .toJSON();

    render(<TeamInfoCard team={team} />);

    const section = screen.getByRole('region', { name: 'Frontend Team' });

    expect(within(section).getByText('Engineering')).toBeInTheDocument();
    expect(within(section).getByText('Building awesome UIs')).toBeInTheDocument();
  });
});

describe('TeamInfoCardSkeleton', () => {
  test('renders with loading aria-label', () => {
    render(<TeamInfoCardSkeleton />);

    expect(screen.getByLabelText('Loading team info')).toBeInTheDocument();
  });
});

describe('TeamInfoCardError', () => {
  test('renders as a section with accessible name', () => {
    const error = new Error('Failed to load team');

    render(<TeamInfoCardError error={error} />);

    const section = screen.getByRole('region', { name: 'Team Info Unavailable' });
    expect(section).toBeInTheDocument();
  });

  test('renders error title as heading', () => {
    const error = new Error('Failed to load team');

    render(<TeamInfoCardError error={error} />);

    expect(
      screen.getByRole('heading', { name: 'Team Info Unavailable', level: 3 }),
    ).toBeInTheDocument();
  });

  test('renders error message', () => {
    const error = new Error('Network error occurred');

    render(<TeamInfoCardError error={error} />);

    expect(screen.getByText('Network error occurred')).toBeInTheDocument();
  });

  test('renders error icon', () => {
    const error = new Error('Failed to load team');

    render(<TeamInfoCardError error={error} />);

    expect(screen.getByTestId('ErrorOutlineIcon')).toBeInTheDocument();
  });
});
