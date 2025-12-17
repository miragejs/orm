import { Outlet } from 'react-router';
import { Box, Typography } from '@mui/material';
import type { User } from '@shared/types';

interface MainContentProps {
  user: User;
}

/**
 * Main Content Component with welcome message and outlet for nested routes
 */
export default function MainContent({ user }: MainContentProps) {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        bgcolor: 'background.default',
        overflow: 'auto',
      }}
    >
      {/* Welcome Message */}
      <Typography variant="h4" component="h1" gutterBottom>
        Hello, {user.name.split(' ')[0]}!
      </Typography>

      {/* Outlet for nested routes */}
      <Outlet />
    </Box>
  );
}
