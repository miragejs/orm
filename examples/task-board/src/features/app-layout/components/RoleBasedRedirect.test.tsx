import { screen, waitFor } from '@testing-library/react';
import { test, describe, expect } from '@test/context';
import { renderWithRouter } from '@test/utils';
import RoleBasedRedirect from './RoleBasedRedirect';

describe('RoleBasedRedirect', () => {
  test('redirects manager to dashboard', async ({ schema }) => {
    const user = schema.users.create('manager').toJSON();

    renderWithRouter({
      element: <RoleBasedRedirect />,
      routes: [
        { path: '/:teamSlug/dashboard', element: <div>Dashboard</div> },
        { path: '/:teamSlug/users/:userId', element: <div>User Tasks</div> },
      ],
      user,
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  test('redirects regular user to their tasks page', async ({ schema }) => {
    const user = schema.users.create().toJSON();

    renderWithRouter({
      user,
      element: <RoleBasedRedirect />,
      routes: [
        { path: '/:teamSlug/dashboard', element: <div>Dashboard</div> },
        { path: '/:teamSlug/users/:userId', element: <div>User Tasks</div> },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText('User Tasks')).toBeInTheDocument();
    });
  });
});
