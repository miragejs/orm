import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { addTaskComment } from './addTaskComment';

const server = setupServer(...taskHandlers);

describe('addTaskComment', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('creates a new comment for a task', async ({ schema }) => {
    const task = schema.tasks.create();
    const { assignee } = task;
    setUserCookie(assignee.id);

    const content = 'This is a test comment';
    const comment = await addTaskComment(task.id, content);

    expect(comment.content).toBe(content);
    expect(comment.author.id).toBe(assignee.id);
  });

  test('throws api error', async ({ schema }) => {
    const task = schema.tasks.create();

    await expect(addTaskComment(task.id, 'Test')).rejects.toThrow();
  });
});
