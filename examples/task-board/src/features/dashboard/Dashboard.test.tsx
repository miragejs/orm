import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { handlers } from '@test/server/handlers';
import { renderApp } from '@test/utils';
import { TaskStatus } from '@/shared/enums';
import { formatTaskTitle } from '@/shared/utils';

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

const server = setupServer(...handlers);

describe('Dashboard', () => {
  const ui = userEvent.setup();

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=; Max-Age=0';
  });

  afterAll(() => server.close());

  test('displays dashboard page', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByRole('heading', { name: 'Dashboard' });
  });

  test('displays team info card with team name and department', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading team info');
    await screen.findByRole('heading', { name: team.name });

    expect(screen.getByText(team.department)).toBeInTheDocument();
    expect(screen.getByText(team.description)).toBeInTheDocument();
  });

  test('displays team stats card with member and task counts', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.tasks.createMany(10, { creator: manager }, 'withAssignee');
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading team info');
    await screen.findByRole('heading', { name: 'Team Overview' });

    expect(screen.getByLabelText('11 Members')).toBeInTheDocument();
    expect(screen.getByLabelText('10 Tasks')).toBeInTheDocument();
  });

  test('displays team members preview chips', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    const user = schema.users.create({ team });
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading team info');
    await screen.findByRole('heading', { name: 'Team Overview' });

    expect(screen.getByRole('heading', { name: 'Team Members' })).toBeInTheDocument();
    expect(screen.getByText(manager.name)).toBeInTheDocument();
    expect(screen.getByText(user.name)).toBeInTheDocument();
  });

  test('displays task statistics chart', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.tasks.createMany(1, { creator: manager });
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading task stats chart');
    await screen.findByRole('heading', { name: 'Task Trends' });

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('displays empty chart state when no tasks', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading task stats chart');
    await screen.findByRole('heading', { name: 'Task Trends' });

    expect(screen.getByText('No task data available')).toBeInTheDocument();
  });

  test('displays tasks table with team tasks', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.users.createMany(5, { team });
    schema.tasks.createMany(5);
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading tasks table');
    await screen.findByRole('table', { name: /Team Tasks/ });

    expect(screen.getByRole('heading', { name: 'Team Tasks (5)' })).toBeInTheDocument();
  });

  test('displays tasks table headers', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.tasks.create({ creator: manager, team });
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading tasks table');
    await screen.findByRole('table', { name: /Team Tasks/ });

    expect(screen.getByRole('columnheader', { name: 'Assignee' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Task' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Priority' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Due Date' })).toBeInTheDocument();
  });

  test('displays filter controls in tasks table', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.tasks.create({ creator: manager, team });
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading tasks table');
    await screen.findByRole('table', { name: /Team Tasks/ });

    expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Priority' })).toBeInTheDocument();
  });

  test('displays task rows with task details', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    const task = schema.tasks.create('inProgress', { creator: manager }, 'withAssignee');
    const { assignee } = task;
    document.cookie = `userId=${manager.id}`;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading tasks table');
    await screen.findByRole('table', { name: /Team Tasks/ });

    expect(screen.getByRole('link', { name: assignee.name })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: new RegExp(task.title, 'i') }),
    ).toBeInTheDocument();
    expect(screen.getByText(task.status)).toBeInTheDocument();
    expect(screen.getByText(task.priority)).toBeInTheDocument();
    expect(
      screen.getByText(new Date(task.dueDate).toLocaleDateString()),
    ).toBeInTheDocument();
  });

  test('supports task table pagination', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.tasks.createMany(15, { creator: manager });
    document.cookie = `userId=${manager.id}`;

    const tasks = schema.tasks.findMany({ orderBy: { createdAt: 'desc' } });
    const taskA = tasks.first()!;
    const taskB = tasks.last()!;

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading tasks table');
    await screen.findByRole('table', { name: /Team Tasks/ });

    expect(
      screen.getByRole('link', { name: new RegExp(taskA.title, 'i') }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1–10 of 15/i)).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /next page/i });
    await ui.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: new RegExp(taskB.title, 'i') }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/11–15 of 15/i)).toBeInTheDocument();
  });

  test('supports task table sorting', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    document.cookie = `userId=${manager.id}`;

    const taskA = schema.tasks.create({
      creator: manager,
      title: 'Beta Task',
      createdAt: new Date('2024-01-01').toISOString(),
      dueDate: new Date('2024-01-02').toISOString(),
    });
    const taskB = schema.tasks.create({
      creator: manager,
      title: 'Alpha Task',
      createdAt: new Date('2024-01-01').toISOString(),
      dueDate: new Date('2024-01-01').toISOString(),
    });

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading tasks table');
    await screen.findByRole('table', { name: /Team Tasks/ });

    let firstRow = screen.getAllByRole('row').slice(1)[0];
    expect(firstRow).toHaveTextContent(new RegExp(taskA.title, 'i'));

    const taskHeader = screen.getByRole('columnheader', { name: 'Task' });
    const sortButton = within(taskHeader).getByRole('button');
    await ui.click(sortButton);

    await waitFor(() => {
      expect(taskHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    firstRow = screen.getAllByRole('row').slice(1)[0];
    expect(firstRow).toHaveTextContent(new RegExp(taskB.title, 'i'));
  });

  test('supports task table filtering by status', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    document.cookie = `userId=${manager.id}`;

    const todoTask = schema.tasks.create('todo', { creator: manager });
    const doneTask = schema.tasks.create('done', { creator: manager });

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading tasks table');
    await screen.findByRole('table', { name: /Team Tasks/ });

    expect(screen.getByRole('heading', { name: 'Team Tasks (2)' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: new RegExp(todoTask.title, 'i') }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: new RegExp(doneTask.title, 'i') }),
    ).toBeInTheDocument();

    const statusSelect = screen.getByRole('combobox', { name: 'Status' });
    await ui.click(statusSelect);

    const listbox = within(screen.getByRole('listbox'));
    await ui.click(listbox.getByRole('option', { name: 'TODO' }));

    await waitFor(() => {
      expect(within(statusSelect).getByText(TaskStatus.TODO)).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('link', { name: new RegExp(doneTask.title, 'i') }),
    ).not.toBeInTheDocument();
  });

  test('navigates to task details when clicking task', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    document.cookie = `userId=${manager.id}`;

    const task = schema.tasks.create('inProgress', { creator: manager, team }).toJSON();

    renderApp(`/${team.slug}/dashboard`);

    await screen.findByLabelText('Loading tasks table');
    await screen.findByRole('table', { name: /Team Tasks/ });

    const taskLink = screen.getByRole('link', { name: new RegExp(task.title, 'i') });
    await ui.click(taskLink);

    const dialog = within(await screen.findByRole('dialog'));
    expect(
      dialog.getByRole('heading', { name: formatTaskTitle(task) }),
    ).toBeInTheDocument();
  });
});
