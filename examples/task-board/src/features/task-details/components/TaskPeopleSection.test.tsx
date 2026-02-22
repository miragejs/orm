import { render, screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import { userInfoSerializer } from '@test/schema/collections/users';
import TaskPeopleSection from './TaskPeopleSection';

describe('TaskPeopleSection', () => {
  test('renders assignee and creator info', ({ schema }) => {
    const assignee = schema.users.create().serialize(userInfoSerializer);
    const creator = schema.users.create().serialize(userInfoSerializer);

    render(<TaskPeopleSection assignee={assignee} creator={creator} />);

    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(screen.getByText(assignee.name)).toBeInTheDocument();
    expect(screen.getByText(creator.name)).toBeInTheDocument();
  });

  test('renders fallback text when assignee is null', ({ schema }) => {
    const creator = schema.users.create().serialize(userInfoSerializer);

    render(<TaskPeopleSection assignee={null} creator={creator} />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText(creator.name)).toBeInTheDocument();
  });

  test('renders fallback text when creator is null', ({ schema }) => {
    const assignee = schema.users.create().serialize(userInfoSerializer);

    render(<TaskPeopleSection assignee={assignee} creator={null} />);

    expect(screen.getByText(assignee.name)).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  test('renders user roles', ({ schema }) => {
    const assignee = schema.users.create().serialize(userInfoSerializer);
    const creator = schema.users.create('manager').serialize(userInfoSerializer);

    render(<TaskPeopleSection assignee={assignee} creator={creator} />);

    expect(screen.getByText(assignee.role)).toBeInTheDocument();
    expect(screen.getByText(creator.role)).toBeInTheDocument();
  });
});
