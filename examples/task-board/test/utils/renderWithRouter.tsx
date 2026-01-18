import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, RouteObject } from 'react-router';
import type { User } from '@shared/types';

interface RenderWithRouterOptions {
  user: User;
  element: React.ReactNode;
  routes?: RouteObject[];
  initialPath?: string;
}

/**
 * Renders a component within a router context with user data loaded
 */
export function renderWithRouter({
  user,
  element,
  routes = [],
  initialPath = '/',
}: RenderWithRouterOptions) {
  const router = createMemoryRouter(
    [
      {
        id: 'root',
        path: '/',
        element,
        loader: () => ({ user }),
      },
      ...routes,
    ],
    { initialEntries: [initialPath] },
  );

  return render(<RouterProvider router={router} />);
}
