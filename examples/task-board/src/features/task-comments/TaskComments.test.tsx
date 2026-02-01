import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers, userHandlers } from '@test/server/handlers';
import { renderApp } from '@test/utils';

const server = setupServer(...userHandlers, ...taskHandlers);

describe('TaskComments', () => {
  const ui = userEvent.setup();

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=; Max-Age=0';
  });

  afterAll(() => server.close());

  test('displays comments in task details dialog', async ({ schema }) => {
    const user = schema.users.create();
    const { team } = user;
    const task = schema.tasks.create('inProgress', 'withComments');
    document.cookie = `userId=${user.id}`;

    renderApp(`/${team.slug}/users/${user.id}`);

    // Navigate to task details
    const taskHeading = await screen.findByRole('heading', { name: task.title });
    await ui.click(taskHeading);

    // Wait for dialog
    const dialog = await screen.findByRole('dialog');

    // Check for comments accordion
    const commentsButton = await within(dialog).findByRole('button', {
      name: `Comments (${task.comments.length})`,
    });
    expect(commentsButton).toBeInTheDocument();

    // Verify comments are rendered
    const comments = task.comments.toJSON();
    for (const comment of comments) {
      expect(within(dialog).getByText(comment.content)).toBeInTheDocument();
    }
  });

  test('shows empty comments state when task has no comments', async ({ schema }) => {
    const user = schema.users.create();
    const { team } = user;
    const task = schema.tasks.create('inProgress');
    document.cookie = `userId=${user.id}`;

    renderApp(`/${team.slug}/users/${user.id}`);

    // Navigate to task details
    const taskHeading = await screen.findByRole('heading', { name: task.title });
    await ui.click(taskHeading);

    // Wait for dialog
    const dialog = await screen.findByRole('dialog');

    // Comments accordion should show 0 count
    const commentsButton = await within(dialog).findByRole('button', {
      name: 'Comments (0)',
    });
    expect(commentsButton).toBeInTheDocument();
  });
});
