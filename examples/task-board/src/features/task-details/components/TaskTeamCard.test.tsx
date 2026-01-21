import { render, screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import TaskTeamCard from './TaskTeamCard';
import type { TeamInfo } from '@shared/types';

describe('TaskTeamCard', () => {
  test('renders team name and department', ({ schema }) => {
    const team = schema.teams.create().serialize<TeamInfo>({
      select: ['id', 'name', 'department', 'description'],
      with: [],
    });

    render(<TaskTeamCard team={team} />);

    expect(screen.getByText(team.name)).toBeInTheDocument();
    expect(screen.getByText(team.department)).toBeInTheDocument();
  });

  test('renders team description when present', ({ schema }) => {
    const team = schema.teams.create().serialize<TeamInfo>({
      select: ['id', 'name', 'department', 'description'],
      with: [],
    });

    render(<TaskTeamCard team={team} />);

    expect(screen.getByText(team.description)).toBeInTheDocument();
  });

  test('does not render description when empty', ({ schema }) => {
    const team = schema.teams.create({ description: '' }).serialize<TeamInfo>({
      select: ['id', 'name', 'department', 'description'],
      with: [],
    });

    render(<TaskTeamCard team={team} />);

    expect(screen.getByText(team.name)).toBeInTheDocument();
    expect(screen.getByText(team.department)).toBeInTheDocument();
  });
});
