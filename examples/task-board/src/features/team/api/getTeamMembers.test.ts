import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { teamHandlers } from '@test/server/handlers';
import { getTeamMembers } from './getTeamMembers';

const server = setupServer(...teamHandlers);

describe('getTeamMembers', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=; Max-Age=0';
  });

  afterAll(() => server.close());

  test('returns team members with pagination metadata', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.users.createMany(4, { team });
    document.cookie = `userId=${manager.id}`;

    const result = await getTeamMembers();

    expect(result.members).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.page).toBe(0);
    expect(result.pageSize).toBe(5);
    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe('asc');
  });

  test('supports pagination parameters', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.users.createMany(10, { team });
    document.cookie = `userId=${manager.id}`;

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('pageSize', '3');

    const result = await getTeamMembers(params);

    expect(result.members).toHaveLength(3);
    expect(result.total).toBe(11);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(3);
  });

  test('supports sorting parameters', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    schema.users.create({ team, name: 'Alice' });
    schema.users.create({ team, name: 'Zoe' });
    document.cookie = `userId=${manager.id}`;

    const params = new URLSearchParams();
    params.set('sortBy', 'name');
    params.set('sortOrder', 'desc');

    const result = await getTeamMembers(params);

    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe('desc');
    expect(result.members[0].name).toBe('Zoe');
  });

  test('throws error when not authenticated', async () => {
    await expect(getTeamMembers()).rejects.toThrow('Not authenticated');
  });
});
