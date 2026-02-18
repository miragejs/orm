import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { taskHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { getTaskDetails } from './getTaskDetails';
import type { Task } from '@shared/types';

const server = setupServer(...taskHandlers);

describe('getTaskDetails', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('gets task details for authenticated user', async ({ schema }) => {
    const task = schema.tasks.create('withAssignee');
    const assignee = task.assignee;
    setUserCookie(assignee.id);

    const result = await getTaskDetails(task.id);
    const expected: Task = task.toJSON();

    expect(result).toEqual(expected);
  });

  test('throws error when not authenticated', async ({ schema }) => {
    const task = schema.tasks.create();

    await expect(getTaskDetails(task.id)).rejects.toThrow('Failed to fetch task details');
  });

  test('throws error when task not found', async ({ schema }) => {
    const user = schema.users.create();
    setUserCookie(user.id);

    await expect(getTaskDetails('non-existent-id')).rejects.toThrow(
      'Failed to fetch task details',
    );
  });
});
