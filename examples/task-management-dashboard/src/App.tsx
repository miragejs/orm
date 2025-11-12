import { Box, Container, Typography, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function App() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <CheckCircleIcon
            sx={{
              fontSize: 80,
              color: 'success.main',
              mb: 2,
            }}
          />
          <Typography variant="h2" component="h1" gutterBottom>
            Hello, Open World! 🌍
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Task Management Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            miragejs-orm Example Project
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ✅ React + TypeScript + Material-UI + Vite
          </Typography>
        </Paper>

        <Paper
          elevation={1}
          sx={{
            p: 3,
            width: '100%',
            maxWidth: 600,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Setup Status
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              ✅ Project structure created
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              ✅ Dependencies installed
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              ✅ TypeScript configured
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              ✅ Vite build tool ready
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              ✅ Material-UI components working
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              ✅ miragejs-orm import working (from local lib)
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              ✅ Schema initialized (users, teams, tasks, comments)
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              ✅ Models, collections, relationships configured
            </Typography>
            <Typography component="li" variant="body2">
              ⏳ Next: Create seeds & MSW handlers
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
