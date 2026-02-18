import { render } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  RouteObject,
  LoaderFunction,
} from 'react-router';
import type { User } from '@shared/types';

interface RenderWithRouterOptions {
  initialPath?: string;
  routes?: RouteObject[];
  user?: User;
}

interface CreateTestRouterOptions {
  element: React.ReactNode;
  initialPath?: string;
  loader?: LoaderFunction;
  routes?: RouteObject[];
}

const createTestRouter = ({
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
export function renderWithRouter(
  element: React.ReactNode,
  { initialPath = '/', routes = [], user }: RenderWithRouterOptions = {},
) {
  const loader = user ? () => user : undefined;
  const result = render(
    <RouterProvider
      router={createTestRouter({ element, initialPath, loader, routes })}
    />,
  );
  const rerender = (element: React.ReactNode) => {
    result.rerender(
      <RouterProvider
        router={createTestRouter({ element, initialPath, loader, routes })}
      />,
    );
  };

  return { ...result, rerender };
}
