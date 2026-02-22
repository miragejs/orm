import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { TaskStatus } from '@shared/enums';
import { updateTask } from './updateTask';

const server = setupServer(...taskHandlers);

describe('updateTask', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('updates task', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const task = schema.tasks.create('inProgress', { creator: manager });
    setUserCookie(manager.id);

    const payload = {
      title: 'Updated title',
      status: TaskStatus.DONE,
    };

    const result = await updateTask(task.id, payload);

    expect(result.id).toBe(task.id);
    expect(result).toMatchObject(payload);

    const updated = task.reload().toJSON();
    expect(updated).toMatchObject(payload);
  });

  test('throws api error', async ({ schema }) => {
    const user = schema.users.create();
    setUserCookie(user.id);

    await expect(updateTask('non-existent-id', { title: 'New title' })).rejects.toThrow();
  });
});
