import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { Form, useActionData, useNavigation } from 'react-router';
import { Logo } from '@shared/components/ErrorBoundary';

/**
 * Login Form Component
 */
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Card elevation={8} sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
          <Logo size="large" />
        </Box>

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ mb: 3 }}
        >
          Welcome Back
        </Typography>

        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to access your task dashboard
        </Typography>

        <Form method="post">
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
            autoFocus
            sx={{ mb: 3 }}
            placeholder="email@example.com"
          />

          {actionData?.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionData.error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting || !email}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          Demo accounts:
          <br />
          <strong>john.doe@example.com</strong> (User) |{' '}
          <strong>jane.smith@example.com</strong> (Manager)
        </Typography>
      </CardContent>
    </Card>
  );
}
