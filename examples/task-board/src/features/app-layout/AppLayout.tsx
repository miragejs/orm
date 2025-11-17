import { Box } from '@mui/material';
import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { getUser } from './api';
import type { User } from '@shared/types';
import { Sidebar, Header, MainContent } from './components';

/**
 * Loader for app layout - fetches current user and protects route
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUser();
    return { user };
  } catch {
    // If not authenticated, redirect to auth page
    const url = new URL(request.url);
    return redirect(`/auth?redirectTo=${url.pathname}`);
  }
}

interface LoaderData {
  user: User;
}

/**
 * App Layout Component - composes Sidebar, Header, and MainContent
 */
export default function AppLayout() {
  const { user } = useLoaderData() as LoaderData;

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
