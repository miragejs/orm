import '@testing-library/jest-dom/vitest';

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
