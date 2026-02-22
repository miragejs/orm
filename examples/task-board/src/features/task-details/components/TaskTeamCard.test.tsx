import { render, screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import { teamInfoSerializer } from '@test/schema/collections/teams';
import TaskTeamCard from './TaskTeamCard';

describe('TaskTeamCard', () => {
  test('renders team name and department', ({ schema }) => {
    const team = schema.teams.create().serialize(teamInfoSerializer);

    render(<TaskTeamCard team={team} />);

    expect(screen.getByText(team.name)).toBeInTheDocument();
    expect(screen.getByText(team.department)).toBeInTheDocument();
  });

  test('renders team description when present', ({ schema }) => {
    const team = schema.teams.create().serialize(teamInfoSerializer);

    render(<TaskTeamCard team={team} />);

    expect(screen.getByText(team.description)).toBeInTheDocument();
  });

  test('does not render description when empty', ({ schema }) => {
    const team = schema.teams.create({ description: '' }).serialize(teamInfoSerializer);

    render(<TaskTeamCard team={team} />);

    expect(screen.getByText(team.name)).toBeInTheDocument();
    expect(screen.getByText(team.department)).toBeInTheDocument();
  });
});
