import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { userHandlers } from '@test/server/handlers';
import { getUser } from './getUser';

const server = setupServer(...userHandlers);

describe('getUser', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=; Max-Age=0';
  });

  afterAll(() => server.close());

  test('gets authenticated user', async ({ schema }) => {
    const user = schema.users.create().toJSON();
    document.cookie = `userId=${user.id}`;

    const result = await getUser();
    expect(result).toEqual(user);
  });

  test('throws "Not authenticated" when no cookie present', async () => {
    await expect(getUser()).rejects.toThrow('Not authenticated');
  });

  test('throws "Failed to fetch user" when user not found', async () => {
    document.cookie = 'userId=non-existent-id';
    await expect(getUser()).rejects.toThrow('Failed to fetch user');
  });
});
