import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { authHandlers } from '@test/server/handlers';
import { login } from './login';

const server = setupServer(...authHandlers);

describe('login', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());

  test('logs in existing user', async ({ schema }) => {
    const user = schema.users.create().toJSON();

    const result = await login(user.email);
    expect(result).toEqual(user);
  });

  test('throws api error', async () => {
    await expect(login('nonexistent@example.com')).rejects.toThrow();
  });
});
