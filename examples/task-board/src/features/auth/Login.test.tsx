import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { test, describe, expect, beforeAll, afterAll, afterEach } from '@test/context';
import { handlers } from '@test/server/handlers';
import { renderApp } from '@test/utils';

const server = setupServer(...handlers);

describe('Login', () => {
  const ui = userEvent.setup();

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterEach(() => {
    server.resetHandlers();
    document.cookie = 'userId=; Max-Age=0';
  });

  afterAll(() => server.close());

  test('renders login page with LoginForm', async () => {
    renderApp('/auth');

    expect(
      await screen.findByRole('heading', { name: 'Welcome Back' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  test('regular user logs in and is redirected to user board', async ({ schema }) => {
    const user = schema.users.create({ name: 'John Doe' });

    renderApp('/auth');

    const emailInput = await screen.findByLabelText('Email Address');
    await ui.type(emailInput, user.email);
    await ui.click(screen.getByRole('button', { name: 'Sign In' }));

    // Wait for redirect to user board
    await screen.findByText('Hello, John!');
    await screen.findByRole('heading', { name: 'My Tasks' });

    // Verify we're on the correct route (user board)
    expect(screen.getByRole('group', { name: 'My Tasks' })).toBeInTheDocument();
  });

  test('manager logs in and is redirected to dashboard', async ({ schema }) => {
    const manager = schema.users.create({ name: 'Jane Smith' }, 'manager');
    schema.users.create({ name: 'John Doe', team: manager.team }, 'withTasks');

    renderApp('/auth');

    const emailInput = await screen.findByLabelText('Email Address');
    await ui.type(emailInput, manager.email);
    await ui.click(screen.getByRole('button', { name: 'Sign In' }));

    // Wait for redirect to dashboard
    await screen.findByText('Hello, Jane!');
    await screen.findByRole('heading', { name: 'Dashboard' });

    // Verify we're on the correct route (dashboard)
    expect(
      await screen.findByRole('heading', { name: 'Task Trends' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /Team Tasks/ }),
    ).toBeInTheDocument();
  });
});
