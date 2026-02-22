import '@testing-library/jest-dom/vitest';

// Silence React Router hydration warning in tests (no SSR/hydration in test env)
const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
  if (message.includes('HydrateFallback') && message.includes('hydration')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Mock @mui/x-charts to avoid ESM resolution issues in tests
vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: () => null,
}));
vi.mock('@mui/x-charts/BarChart', () => ({
  BarChart: () => null,
}));
vi.mock('@mui/x-charts/PieChart', () => ({
  PieChart: () => null,
}));
