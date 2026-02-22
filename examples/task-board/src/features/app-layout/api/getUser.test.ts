import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { userHandlers } from '@test/server/handlers';
import { clearUserCookie, setUserCookie } from '@test/utils';
import { getUser } from './getUser';

const server = setupServer(...userHandlers);

describe('getUser', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('returns authenticated user', async ({ schema }) => {
    const user = schema.users.create().toJSON();
    setUserCookie(user.id);

    const result = await getUser();
    expect(result).toEqual(user);
  });

  test('throws api error', async () => {
    await expect(getUser()).rejects.toThrow();
  });
});
