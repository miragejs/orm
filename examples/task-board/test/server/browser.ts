import { setupWorker } from 'msw/browser';
import { testSchema } from '@test/schema';
import { handlers } from './handlers';

/**
 * MSW browser worker for intercepting API requests in development
 */
const worker = setupWorker(...handlers);

/**
 * Initialize the mock server with seed data
 */
export async function initMockServer() {
  // Load dev mock data
  await testSchema.loadSeeds({ onlyDefault: true });
  // Start MSW worker
  await worker.start({ onUnhandledRequest: 'bypass' });

  console.log('✅ Mock server initialized!');
}
