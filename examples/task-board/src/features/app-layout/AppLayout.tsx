import { useLoaderData, redirect } from 'react-router';
import Box from '@mui/material/Box';
import { getUser } from './api';
import { Sidebar, Header, MainContent } from './components';
import type { LoaderFunctionArgs } from 'react-router';
import type { User } from '@shared/types';

/**
 * Loader for app layout - fetches current user and protects route
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUser();
    return user;
  } catch {
    // If not authenticated, redirect to auth page
    const url = new URL(request.url);
    return redirect(`/auth?redirectTo=${url.pathname}`);
  }
}

/**
 * App Layout Component - composes Sidebar, Header, and MainContent
 */
export default function AppLayout() {
  const user = useLoaderData<User>();

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with user menu */}
        <Header user={user} />

        {/* Main content with welcome message and outlet */}
        <MainContent user={user} />
      </Box>
    </Box>
  );
}
