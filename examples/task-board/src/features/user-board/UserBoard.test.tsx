import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers, userHandlers } from '@test/server/handlers';
import { formatTaskTitle } from '@shared/utils';
import { renderApp } from '@test/utils';

const server = setupServer(...userHandlers, ...taskHandlers);

describe('UserBoard', () => {
  const ui = userEvent.setup();

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=; Max-Age=0';
  });

  afterAll(() => server.close());

  test('displays user tasks grouped by status', async ({ schema }) => {
    const user = schema.users.create();
    const team = user.team;
    document.cookie = `userId=${user.id}`;

    const inProgressTask = schema.tasks.create('inProgress');
    const todoTask = schema.tasks.create('todo');

    renderApp(`/${team.slug}/users/${user.id}`);

    await screen.findByRole('heading', { name: 'My Tasks' });

    // In Progress section shows the task (expanded by default)
    expect(
      screen.getByRole('heading', { name: inProgressTask.title }),
    ).toBeInTheDocument();

    // To Do section - expand to see task
    await ui.click(screen.getByText('To Do'));
    expect(screen.getByText(todoTask.title)).toBeVisible();
  });

  test('navigates to task details when task is clicked', async ({ schema }) => {
    const user = schema.users.create();
    const team = user.team;
    document.cookie = `userId=${user.id}`;

    const task = schema.tasks.create('inProgress');

    renderApp(`/${team.slug}/users/${user.id}`);

    const taskHeading = await screen.findByRole('heading', { name: task.title });
    await ui.click(taskHeading);

    const taskTitle = formatTaskTitle(task.toJSON());
    expect(await screen.findByRole('dialog', { name: taskTitle })).toBeInTheDocument();
  });

  test('returns to user board after closing task details', async ({ schema }) => {
    const user = schema.users.create();
    const team = user.team;
    document.cookie = `userId=${user.id}`;

    const task = schema.tasks.create('inProgress');

    renderApp(`/${team.slug}/users/${user.id}`);

    // Open task details
    const taskHeading = await screen.findByRole('heading', { name: task.title });
    await ui.click(taskHeading);

    const taskTitle = formatTaskTitle(task.toJSON());
    const dialog = await screen.findByRole('dialog', { name: taskTitle });

    // Close dialog
    await ui.click(within(dialog).getByRole('button', { name: 'Close' }));

    // Dialog closed, back to user board
    expect(dialog).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: task.title })).toBeInTheDocument();
  });

  test('shows task details with comments from user board', async ({ schema }) => {
    const user = schema.users.create();
    const team = user.team;
    document.cookie = `userId=${user.id}`;

    const task = schema.tasks.create('inProgress', 'withComments');
    const comments = task.comments.toJSON();

    renderApp(`/${team.slug}/users/${user.id}`);

    // Navigate to task details
    const taskHeading = await screen.findByRole('heading', { name: task.title });
    await ui.click(taskHeading);

    const taskTitle = formatTaskTitle(task.toJSON());
    const dialog = within(await screen.findByRole('dialog', { name: taskTitle }));

    // Verify comments are loaded
    await dialog.findByRole('list', { name: `Comments (${comments.length})` });

    for (const comment of comments) {
      expect(dialog.getByText(comment.content)).toBeInTheDocument();
    }
  });

  test('shows empty sections when user has no tasks', async ({ schema }) => {
    const user = schema.users.create();
    const team = user.team;
    document.cookie = `userId=${user.id}`;

    renderApp(`/${team.slug}/users/${user.id}`);

    await screen.findByRole('heading', { name: 'My Tasks' });

    // All sections should show 0 count
    const zeroChips = screen.getAllByText('0');
    expect(zeroChips.length).toBe(4); // 4 status sections
  });
});
