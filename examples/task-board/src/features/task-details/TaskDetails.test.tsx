import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { handlers } from '@test/server/handlers';
import { formatTaskTitle } from '@shared/utils';
import { clearUserCookie, renderApp, setUserCookie } from '@test/utils';

const server = setupServer(...handlers);

describe('TaskDetails', () => {
  const ui = userEvent.setup();

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('displays task details', async ({ schema }) => {
    const task = schema.tasks.create('inProgress', 'highPriority', 'withAssignee');
    const { creator, assignee, team } = task;
    setUserCookie(assignee.id);

    const taskTitle = formatTaskTitle(task.toJSON());

    renderApp(`/${team.slug}/users/${assignee.id}/${task.id}`);

    const dialog = within(await screen.findByRole('dialog', { name: taskTitle }));

    // Title and description
    expect(
      dialog.getByRole('heading', { name: taskTitle, level: 2 }),
    ).toBeInTheDocument();
    expect(dialog.getByText(task.description)).toBeInTheDocument();

    // Status and priority chips
    expect(dialog.getByText('In Progress')).toBeInTheDocument();
    expect(dialog.getByText('HIGH')).toBeInTheDocument();

    // People info
    expect(dialog.getByText('Assignee')).toBeInTheDocument();
    expect(dialog.getByText(assignee.name)).toBeInTheDocument();
    expect(dialog.getByText('Created by')).toBeInTheDocument();
    expect(dialog.getByText(creator.name)).toBeInTheDocument();

    // Dates
    expect(
      dialog.getByText(new Date(task.dueDate).toLocaleDateString()),
    ).toBeInTheDocument();
    expect(
      dialog.getByText(new Date(task.createdAt).toLocaleDateString()),
    ).toBeInTheDocument();
  });

  test('displays team info', async ({ schema }) => {
    const task = schema.tasks.create('inProgress', 'withAssignee');
    const { assignee, team } = task;
    setUserCookie(assignee.id);

    const taskTitle = formatTaskTitle(task.toJSON());

    renderApp(`/${team.slug}/users/${assignee.id}/${task.id}`);

    const dialog = within(await screen.findByRole('dialog', { name: taskTitle }));

    expect(dialog.getByText(team.name)).toBeInTheDocument();
    expect(dialog.getByText(team.department)).toBeInTheDocument();
  });

  test('displays comments section', async ({ schema }) => {
    const task = schema.tasks.create('inProgress', 'withAssignee', 'withComments');
    const { assignee, team } = task;
    setUserCookie(assignee.id);

    const comments = task.comments.toJSON();
    const taskTitle = formatTaskTitle(task.toJSON());

    renderApp(`/${team.slug}/users/${assignee.id}/${task.id}`);

    const dialog = within(await screen.findByRole('dialog', { name: taskTitle }));

    await dialog.findByRole('list', { name: `Comments (${comments.length})` });

    for (const comment of comments) {
      expect(dialog.getByText(comment.content)).toBeInTheDocument();
    }
  });

  test('closes dialog and navigates back to user board', async ({ schema }) => {
    const task = schema.tasks.create('inProgress', 'withAssignee');
    const { assignee, team } = task;
    setUserCookie(assignee.id);

    const taskTitle = formatTaskTitle(task.toJSON());

    renderApp(`/${team.slug}/users/${assignee.id}/${task.id}`);

    const dialog = await screen.findByRole('dialog', { name: taskTitle });

    const closeButton = within(dialog).getByRole('button', { name: 'Close' });
    await ui.click(closeButton);

    expect(dialog).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'My Tasks', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: task.title })).toBeInTheDocument();
  });
});
