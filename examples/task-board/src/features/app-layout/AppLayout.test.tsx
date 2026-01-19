import { screen, waitFor } from '@testing-library/react';
import { test, describe, expect } from '@test/context';
import { renderWithRouter } from '@test/utils';
import AppLayout from './AppLayout';

describe('AppLayout', () => {
  test('renders layout with sidebar, header, and main content', async ({ schema }) => {
    const user = schema.users.create().toJSON();

    renderWithRouter({ element: <AppLayout />, user });

    await waitFor(() => {
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('main')).toBeInTheDocument(); // MainContent
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument(); // Sidebar
  });
});
