import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { authHandlers } from '@test/server/handlers';
import { logout } from './logout';

const server = setupServer(...authHandlers);

describe('logout', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());

  test('logs out successfully', async () => {
    const result = await logout();
    expect(result).toEqual({ success: true });
  });
});
