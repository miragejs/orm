import { screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { handlers } from '@test/server/handlers';
import { clearUserCookie, renderApp, setUserCookie } from '@test/utils';

const server = setupServer(...handlers);

describe('AppLayout', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    clearUserCookie();
  });

  afterAll(() => server.close());

  test('renders layout with sidebar, header, and main content', async ({ schema }) => {
    const user = schema.users.create();
    const team = user.team;
    setUserCookie(user.id);

    renderApp(`/${team.slug}/users/${user.id}`);

    const sidebar = await screen.findByRole('complementary');

    expect(sidebar).toBeInTheDocument(); // Sidebar
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('main')).toBeInTheDocument(); // MainContent
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument(); // Sidebar navigation
  });
});
