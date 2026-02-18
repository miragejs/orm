import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskItemSerializer } from '@test/schema/collections/tasks';
import { taskHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { getUserTasks } from './getUserTasks';

const server = setupServer(...taskHandlers);

describe('getUserTasks', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('gets tasks for authenticated user', async ({ schema }) => {
    const user = schema.users.create('withTasks');
    const tasks = user.tasks.serialize(taskItemSerializer);
    setUserCookie(user.id);

    const result = await getUserTasks(user.id);

    expect(result).toHaveLength(tasks.length);
    expect(result).toEqual(tasks);
  });

  test('throws error when not authenticated', async ({ schema }) => {
    const user = schema.users.create();

    await expect(getUserTasks(user.id)).rejects.toThrow('Failed to fetch user tasks');
  });

  test('throws error when user not found', async ({ schema }) => {
    const user = schema.users.create();
    setUserCookie(user.id);

    await expect(getUserTasks('non-existent-id')).rejects.toThrow(
      'Failed to fetch user tasks',
    );
  });
});
