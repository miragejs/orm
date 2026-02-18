import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { getTaskComments } from './getTaskComments';

const server = setupServer(...taskHandlers);

describe('getTaskComments', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('fetches comments for a task', async ({ schema }) => {
    const task = schema.tasks.create('withComments');
    const { assignee } = task;
    setUserCookie(assignee.id);

    const taskComments = schema.comments
      .findMany({
        where: { taskId: task.id },
        orderBy: { createdAt: 'desc' },
      })
      .toJSON();

    const comments = await getTaskComments(task.id);

    expect(comments).toHaveLength(task.comments.length);
    expect(comments).toEqual(taskComments);
  });

  test('returns empty array when task has no comments', async ({ schema }) => {
    const task = schema.tasks.create();
    const { assignee } = task;
    setUserCookie(assignee.id);

    const comments = await getTaskComments(task.id);

    expect(comments).toEqual([]);
  });

  test('throws error when task not found', async ({ schema }) => {
    const user = schema.users.create();
    setUserCookie(user.id);

    await expect(getTaskComments('non-existent-task')).rejects.toThrow(
      'Failed to fetch task comments',
    );
  });

  test('throws error when not authenticated', async ({ schema }) => {
    const task = schema.tasks.create();

    await expect(getTaskComments(task.id)).rejects.toThrow(
      'Failed to fetch task comments',
    );
  });
});
