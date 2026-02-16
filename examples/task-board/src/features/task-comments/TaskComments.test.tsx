import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { handlers } from '@test/server/handlers';
import { renderApp } from '@test/utils';

const server = setupServer(...handlers);

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
    const dialog = within(await screen.findByRole('dialog'));

    // Check for comments accordion
    const commentsButton = await dialog.findByRole('button', {
      name: `Comments (${task.comments.length})`,
    });
    expect(commentsButton).toBeInTheDocument();

    // Verify comments are rendered
    const comments = task.comments.toJSON();
    for (const comment of comments) {
      expect(dialog.getByText(comment.content)).toBeInTheDocument();
    }
  });

  test('displays comment form in expanded accordion', async ({ schema }) => {
    const user = schema.users.create();
    const { team } = user;
    const task = schema.tasks.create('inProgress', 'withComments');
    document.cookie = `userId=${user.id}`;

    renderApp(`/${team.slug}/users/${user.id}`);

    // Navigate to task details
    const taskHeading = await screen.findByRole('heading', { name: task.title });
    await ui.click(taskHeading);

    // Wait for dialog
    const dialog = within(await screen.findByRole('dialog'));

    // Comments section should be expanded (has comments)
    await dialog.findByRole('button', {
      name: `Comments (${task.comments.length})`,
    });

    // Comment form should be visible
    expect(dialog.getByLabelText('Add a comment')).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Send' })).toBeInTheDocument();
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
    const dialog = within(await screen.findByRole('dialog'));

    // Comments accordion should show 0 count
    const commentsButton = await dialog.findByRole('button', {
      name: 'Comments (0)',
    });
    expect(commentsButton).toBeInTheDocument();
  });

  test('allows adding a new comment', async ({ schema }) => {
    const user = schema.users.create();
    const { team } = user;
    const task = schema.tasks.create('inProgress');
    document.cookie = `userId=${user.id}`;

    renderApp(`/${team.slug}/users/${user.id}`);

    // Navigate to task details
    const taskHeading = await screen.findByRole('heading', { name: task.title });
    await ui.click(taskHeading);

    // Wait for dialog
    const dialog = within(await screen.findByRole('dialog'));

    // Expand comments section (it's collapsed when empty)
    const commentsButton = await dialog.findByRole('button', {
      name: 'Comments (0)',
    });
    await ui.click(commentsButton);

    // Find and fill the comment form
    const textField = dialog.getByLabelText('Add a comment');
    const commentText = 'This is my new comment';
    await ui.type(textField, commentText);

    // Submit the comment
    const sendButton = dialog.getByRole('button', { name: 'Send' });
    await ui.click(sendButton);

    // Wait for comment to appear in the list
    await dialog.findByText(commentText);

    // Verify comment count updated
    expect(dialog.getByRole('button', { name: 'Comments (1)' })).toBeInTheDocument();
  });
});
