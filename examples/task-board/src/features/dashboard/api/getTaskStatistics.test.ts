import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { teamHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { getTaskStatistics } from './getTaskStatistics';

const server = setupServer(...teamHandlers);

describe('getTaskStatistics', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('returns statistics with tasks aggregated by date', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    setUserCookie(manager.id);

    // Create tasks on specific dates
    const date1 = '2024-01-15T10:00:00.000Z';
    const date2 = '2024-01-16T10:00:00.000Z';

    // Day 1: 2 created, 1 done, 1 in_progress
    schema.tasks.create('done', { creator: manager, team, createdAt: date1 });
    schema.tasks.create('inProgress', { creator: manager, team, createdAt: date1 });

    // Day 2: 3 created, 2 done, 0 in_progress
    schema.tasks.create('done', { creator: manager, team, createdAt: date2 });
    schema.tasks.create('done', { creator: manager, team, createdAt: date2 });
    schema.tasks.create('todo', { creator: manager, team, createdAt: date2 });

    const result = await getTaskStatistics();

    expect(result.statistics.dates).toHaveLength(2);
    expect(result.statistics.dates).toContain('2024-01-15');
    expect(result.statistics.dates).toContain('2024-01-16');

    // Day 1: 2 created, 1 completed, 1 in progress
    expect(result.statistics.created[0]).toBe(2);
    expect(result.statistics.completed[0]).toBe(1);
    expect(result.statistics.inProgress[0]).toBe(1);

    // Day 2: 3 created, 2 completed, 0 in progress
    expect(result.statistics.created[1]).toBe(3);
    expect(result.statistics.completed[1]).toBe(2);
    expect(result.statistics.inProgress[1]).toBe(0);
  });

  test('returns empty statistics when team has no tasks', async ({ schema }) => {
    const manager = schema.users.create('manager');
    setUserCookie(manager.id);

    const result = await getTaskStatistics();

    expect(result.statistics.dates).toHaveLength(0);
    expect(result.statistics.created).toHaveLength(0);
    expect(result.statistics.completed).toHaveLength(0);
    expect(result.statistics.inProgress).toHaveLength(0);
  });
});
