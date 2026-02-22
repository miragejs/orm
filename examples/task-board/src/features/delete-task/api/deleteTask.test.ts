import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { deleteTask } from './deleteTask';

const server = setupServer(...taskHandlers);

describe('deleteTask', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('deletes task', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const task = schema.tasks.create({ creator: manager, team: manager.team });
    setUserCookie(manager.id);

    await deleteTask(task.id);

    const found = schema.tasks.find(task.id);
    expect(found).toBeFalsy();
  });

  test('throws api error', async ({ schema }) => {
    const task = schema.tasks.create();

    await expect(deleteTask(task.id)).rejects.toThrow();
  });
});
