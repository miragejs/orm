import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Form, useActionData, useNavigation } from 'react-router';
import { Logo } from '@shared/components/ErrorBoundary';

/**
 * Login Form Component
 */
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const handleCopyEmail = async (emailToCopy: string) => {
    try {
      await navigator.clipboard.writeText(emailToCopy);
      setCopiedEmail(emailToCopy);
      setEmail(emailToCopy);
    } catch (error) {
      console.error('Failed to copy email:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setCopiedEmail(null);
  };

  return (
    <Card elevation={8} sx={{ borderRadius: 2, overflowY: 'auto', maxHeight: '100vh' }}>
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

        <Box sx={{ mt: 4 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 1.5 }}
          >
            Demo accounts:
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>john.doe@example.com</strong> (User)
              </Typography>
              <Tooltip title="Copy email">
                <IconButton
                  size="small"
                  onClick={() => handleCopyEmail('john.doe@example.com')}
                  sx={{ ml: 0.5 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>jane.smith@example.com</strong> (Manager)
              </Typography>
              <Tooltip title="Copy email">
                <IconButton
                  size="small"
                  onClick={() => handleCopyEmail('jane.smith@example.com')}
                  sx={{ ml: 0.5 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </CardContent>

      <Snackbar
        open={copiedEmail !== null}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        message={`Email copied and filled!`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Card>
  );
}
