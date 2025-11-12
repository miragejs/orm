import { setupSchema } from './setupSchema';

// Initialize schema instance
export const appSchema = setupSchema();

// Export for use in MSW handlers and tests
export { setupSchema };
export default appSchema;
