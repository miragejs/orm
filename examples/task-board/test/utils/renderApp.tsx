import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router';
import { render } from '@testing-library/react';
import { routes } from '@/routes';

export const renderApp = (initialPath = '/') => {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(<RouterProvider router={router} />);
};
