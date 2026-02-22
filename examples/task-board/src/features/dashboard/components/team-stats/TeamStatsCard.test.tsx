import { render, screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import { userInfoSerializer } from '@test/schema/collections/users';
import TeamStatsCard from './TeamStatsCard';

describe('TeamStatsCard', () => {
  test('renders heading', () => {
    render(<TeamStatsCard members={[]} taskCount={0} />);

    expect(screen.getByRole('heading', { name: 'Team Overview' })).toBeInTheDocument();
  });

  test('displays correct member and task counts', ({ schema }) => {
    const team = schema.teams.create();
    schema.users.createMany(5, { team });
    team.reload();
    const members = team.members.serialize(userInfoSerializer);

    render(<TeamStatsCard members={members} taskCount={10} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  test('renders member chips with names and avatars', ({ schema }) => {
    const team = schema.teams.create();
    const user1 = schema.users.create({ name: 'Alice Johnson', team });
    const user2 = schema.users.create({ name: 'Bob Smith', team });
    team.reload();
    const members = team.members.serialize(userInfoSerializer);

    render(<TeamStatsCard members={members} taskCount={5} />);

    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText(user1.name)).toBeInTheDocument();
    expect(screen.getByText(user2.name)).toBeInTheDocument();

    const avatars = screen.getAllByRole('img', { hidden: true });
    expect(avatars).toHaveLength(2);
  });

  test('limits displayed members to first 8', ({ schema }) => {
    const team = schema.teams.create();
    schema.users.createMany(10, { team });
    team.reload();
    const members = team.members.serialize(userInfoSerializer);

    render(<TeamStatsCard members={members} taskCount={5} />);

    // Should show first 8 members
    for (let i = 0; i < 8; i++) {
      expect(screen.getByText(members[i].name)).toBeInTheDocument();
    }

    // Should not show members 9 and 10
    expect(screen.queryByText(members[8].name)).not.toBeInTheDocument();
    expect(screen.queryByText(members[9].name)).not.toBeInTheDocument();
  });

  test('shows overflow indicator when more than 8 members', ({ schema }) => {
    const team = schema.teams.create();
    schema.users.createMany(12, { team });
    team.reload();
    const members = team.members.serialize(userInfoSerializer);

    render(<TeamStatsCard members={members} taskCount={5} />);

    expect(screen.getByText('+4 more')).toBeInTheDocument();
  });

  test('does not show overflow indicator when 8 or fewer members', ({ schema }) => {
    const team = schema.teams.create();
    schema.users.createMany(8, { team });
    team.reload();
    const members = team.members.serialize(userInfoSerializer);

    render(<TeamStatsCard members={members} taskCount={5} />);

    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });

  test('handles empty members list', () => {
    render(<TeamStatsCard members={[]} taskCount={0} />);

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(2);
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Team Members')).toBeInTheDocument();
  });

  test('displays stats icons', () => {
    render(<TeamStatsCard members={[]} taskCount={5} />);

    expect(screen.getByTestId('GroupsIcon')).toBeInTheDocument();
    expect(screen.getByTestId('AssignmentIcon')).toBeInTheDocument();
  });
});
