import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers } from '@test/server/handlers';
import { addTaskComment } from './addTaskComment';

const server = setupServer(...taskHandlers);

describe('addTaskComment', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=; Max-Age=0';
  });

  afterAll(() => server.close());

  test('creates a new comment for a task', async ({ schema }) => {
    const task = schema.tasks.create();
    const { assignee } = task;
    document.cookie = `userId=${assignee.id}`;

    const content = 'This is a test comment';
    const comment = await addTaskComment(task.id, content);

    expect(comment.content).toBe(content);
    expect(comment.author.id).toBe(assignee.id);
  });

  test('throws error when task not found', async ({ schema }) => {
    const user = schema.users.create();
    document.cookie = `userId=${user.id}`;

    await expect(addTaskComment('non-existent-task', 'Test')).rejects.toThrow(
      'Failed to add comment',
    );
  });

  test('throws error when not authenticated', async ({ schema }) => {
    const task = schema.tasks.create();

    await expect(addTaskComment(task.id, 'Test')).rejects.toThrow(
      'Failed to add comment',
    );
  });
});
