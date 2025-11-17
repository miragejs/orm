import { Box } from '@mui/material';
import { redirect } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { login } from './api';
import { LoginForm } from './components';

/**
 * Login action handler
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required' };
  }

  try {
    await login(email);
    // Redirect to root after successful login
    return redirect('/');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Login failed' };
  }
}

/**
 * Login Page Component
 */
export default function Login() {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        overflow: 'hidden',
      }}
    >
      <LoginForm />
    </Box>
  );
}
