import { screen } from '@testing-library/react';
import { describe, expect, test } from '@test/context';
import { renderWithRouter } from '@test/utils';
import { memberOptionSerializer } from '@test/schema/collections/users';
import TasksTable from './TasksTable';
import type { GetTeamTasksResponse } from '@features/dashboard/api';

describe('TasksTable', () => {
  test('renders table with tasks', async ({ schema }) => {
    const team = schema.teams.create('withManager');
    schema.tasks.create({ title: 'First Task' });
    schema.tasks.create({ title: 'Second Task' });
    team.reload();

    const data: GetTeamTasksResponse = {
      filters: { assigneeId: [], priority: [], status: [] },
      memberOptions: team.members.serialize(memberOptionSerializer),
      page: 0,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tasks: team.tasks.toJSON(),
      total: 2,
    };

    renderWithRouter(<TasksTable data={data} />);

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team Tasks (2)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /First task/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Second task/i })).toBeInTheDocument();
  });

  test('renders column headers and filter controls', async ({ schema }) => {
    const team = schema.teams.create('withManager');
    schema.tasks.create();
    team.reload();

    const data: GetTeamTasksResponse = {
      filters: { assigneeId: [], priority: [], status: [] },
      memberOptions: team.members.serialize(memberOptionSerializer),
      page: 0,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tasks: team.tasks.toJSON(),
      total: 1,
    };

    renderWithRouter(<TasksTable data={data} />);

    // Column headers
    const columnNames = ['Assignee', 'Task', 'Status', 'Priority', 'Due Date'];
    for (const name of columnNames) {
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
    }

    // Filter controls
    const filterLabels = ['Assignee', 'Status', 'Priority'];
    for (const label of filterLabels) {
      expect(screen.getByRole('combobox', { name: label })).toBeInTheDocument();
    }
  });

  test('renders task row with status, priority, and due date', async ({ schema }) => {
    const team = schema.teams.create('withManager');
    const task = schema.tasks.create('inProgress', 'highPriority');
    team.reload();

    const data: GetTeamTasksResponse = {
      filters: { assigneeId: [], priority: [], status: [] },
      memberOptions: team.members.serialize(memberOptionSerializer),
      page: 0,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tasks: team.tasks.toJSON(),
      total: 1,
    };

    renderWithRouter(<TasksTable data={data} />);

    expect(screen.getByText(task.status)).toBeInTheDocument();
    expect(screen.getByText(task.priority)).toBeInTheDocument();

    const formattedDate = new Date(task.dueDate).toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  test('renders pagination controls', async ({ schema }) => {
    const team = schema.teams.create('withManager');
    schema.tasks.createMany(2);
    team.reload();

    const data: GetTeamTasksResponse = {
      filters: { assigneeId: [], priority: [], status: [] },
      memberOptions: team.members.serialize(memberOptionSerializer),
      page: 0,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tasks: team.tasks.toJSON(),
      total: 25,
    };

    renderWithRouter(<TasksTable data={data} />);

    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
  });

  test('renders empty table when no tasks', async ({ schema }) => {
    const team = schema.teams.create('withManager');

    const data: GetTeamTasksResponse = {
      filters: { assigneeId: [], priority: [], status: [] },
      memberOptions: team.members.serialize(memberOptionSerializer),
      page: 0,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tasks: [],
      total: 0,
    };

    renderWithRouter(<TasksTable data={data} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team Tasks (0)' })).toBeInTheDocument();
  });
});
