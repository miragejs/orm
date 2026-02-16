import { setupServer } from 'msw/node';
import { describe, expect, test, beforeAll, afterAll, afterEach } from '@test/context';
import { teamHandlers } from '@test/server/handlers';
import { getTeam } from './getTeam';

const server = setupServer(...teamHandlers);

describe('getTeam', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=; Max-Age=0';
  });

  afterAll(() => server.close());

  test('returns team information for authenticated user', async ({ schema }) => {
    const manager = schema.users.create('manager');
    const { team } = manager;
    document.cookie = `userId=${manager.id}`;

    const result = await getTeam();

    expect(result.id).toBe(team.id);
    expect(result.name).toBe(team.name);
    expect(result.slug).toBe(team.slug);
    expect(result.department).toBe(team.department);
    expect(result.description).toBe(team.description);
  });

  test('throws error when not authenticated', async () => {
    await expect(getTeam()).rejects.toThrow('Not authenticated');
  });
});
