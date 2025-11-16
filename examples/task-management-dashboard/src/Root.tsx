import { RouterProvider, createBrowserRouter } from 'react-router';
import { routes } from './routes';

/**
 * Create browser router with application routes
 */
const router = createBrowserRouter(routes);

/**
 * Root Component with Router Provider
 */
export default function Root() {
  return <RouterProvider router={router} />;
}
