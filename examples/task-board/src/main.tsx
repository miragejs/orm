import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import lightGreen from '@mui/material/colors/lightGreen';
import purple from '@mui/material/colors/purple';
import Root from './Root';
import { initMockServer } from '@test/server/browser';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: purple[500],
    },
    secondary: {
      main: lightGreen[500],
    },
  },
});

async function startApp() {
  // Initialize mock server with seeds in development mode
  if (import.meta.env.DEV) {
    await initMockServer();
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
