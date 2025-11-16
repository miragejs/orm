import { Box, Typography, Button } from '@mui/material';
import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router';

// Re-export Logo for easy importing
export { default as Logo } from './Logo';

/**
 * Error Boundary Component for Route Errors
 */
export default function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || 'An error occurred';
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = 'An unknown error occurred';
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      {errorStatus && (
        <Typography variant="h1" color="error" sx={{ mb: 2 }}>
          {errorStatus}
        </Typography>
      )}
      <Typography variant="h4" gutterBottom>
        Oops! Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
        {errorMessage}
      </Typography>
      <Button variant="contained" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </Box>
  );
}
