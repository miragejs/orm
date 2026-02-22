import { useLoaderData, redirect } from 'react-router';
import Box from '@mui/material/Box';
import { getUser } from './api';
import { Header, MainContent, Sidebar } from './components';
import type { User } from '@shared/types';

/**
 * Loader for app layout - fetches current user and protects route
 */
export async function loader() {
  try {
    const user = await getUser();
    return user;
  } catch {
    // If not authenticated, redirect to auth page
    return redirect('/auth');
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
