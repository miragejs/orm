import { screen } from '@testing-library/react';
import { test, describe, expect } from '@test/context';
import { renderWithRouter } from '@test/utils';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  test('renders "My Tasks" and "Team" nav items for regular user', async ({ schema }) => {
    const user = schema.users.create().toJSON();

    renderWithRouter({ element: <Sidebar />, user });

    await screen.findByRole('complementary');

    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  test('renders "Dashboard" nav item for manager', async ({ schema }) => {
    const user = schema.users.create('manager').toJSON();

    renderWithRouter({ element: <Sidebar />, user });

    await screen.findByRole('complementary');

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'My Tasks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Team' })).not.toBeInTheDocument();
  });

  test('renders logout button', async ({ schema }) => {
    const user = schema.users.create().toJSON();

    renderWithRouter({ element: <Sidebar />, user });

    await screen.findByRole('complementary');

    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});
