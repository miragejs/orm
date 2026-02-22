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

  test('returns task details for authenticated user', async ({ schema }) => {
    const task = schema.tasks.create('withAssignee');
    const assignee = task.assignee;
    setUserCookie(assignee.id);

    const result = await getTaskDetails(task.id);
    const expected: Task = task.toJSON();

    expect(result).toEqual(expected);
  });

  test('throws api error', async ({ schema }) => {
    const task = schema.tasks.create();

    await expect(getTaskDetails(task.id)).rejects.toThrow();
  });
});
