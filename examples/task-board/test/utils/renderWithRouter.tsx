import { render } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  RouteObject,
  ActionFunction,
} from 'react-router';
import type { User } from '@shared/types';

interface RenderWithRouterOptions {
  action?: ActionFunction;
  element: React.ReactNode;
  initialPath?: string;
  routes?: RouteObject[];
  user?: User;
}

/**
 * Renders a component within a router context with optional user data and action handler
 */
export function renderWithRouter({
  action,
  element,
  initialPath = '/',
  routes = [],
  user,
}: RenderWithRouterOptions) {
  const rootLoader = user ? () => user : undefined;
  const router = createMemoryRouter(
    [
      {
        id: 'root',
        path: '/',
        element,
        action,
        loader: rootLoader,
      },
      ...routes,
    ],
    { initialEntries: [initialPath] },
  );

  return render(<RouterProvider router={router} />);
}
