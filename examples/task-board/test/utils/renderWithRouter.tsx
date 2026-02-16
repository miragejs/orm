import { render } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  RouteObject,
  ActionFunction,
  LoaderFunction,
} from 'react-router';
import type { User } from '@shared/types';

interface RenderWithRouterOptions {
  action?: ActionFunction;
  element: React.ReactNode;
  initialPath?: string;
  routes?: RouteObject[];
  user?: User;
}

interface CreateTestRouterOptions {
  action?: ActionFunction;
  element: React.ReactNode;
  initialPath?: string;
  loader?: LoaderFunction;
  routes?: RouteObject[];
}

const createTestRouter = ({
  action,
  element,
  initialPath = '/',
  loader,
  routes = [],
}: CreateTestRouterOptions) => {
  const router = createMemoryRouter(
    [
      {
        id: 'root',
        path: '/',
        element,
        action,
        loader,
      },
      ...routes,
    ],
    { initialEntries: [initialPath] },
  );
  return router;
};

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
  const loader = user ? () => user : undefined;
  const result = render(
    <RouterProvider
      router={createTestRouter({ action, element, initialPath, loader, routes })}
    />,
  );
  const rerender = (element: React.ReactNode) => {
    result.rerender(
      <RouterProvider
        router={createTestRouter({ action, element, initialPath, loader, routes })}
      />,
    );
  };

  return { ...result, rerender };
}
