import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Root from './Root';
import { initMockServer } from '@test/server/browser';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
});

async function startApp() {
  // Initialize mock server with seeds in development mode
  if (import.meta.env.DEV) {
    await initMockServer();
    console.log('✅ Mock server initialized with seed data');
  }

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Root />
      </ThemeProvider>
    </React.StrictMode>,
  );
}

startApp();
