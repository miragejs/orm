import { authHandlers } from './authHandlers';
import { userHandlers } from './userHandlers';
import { taskHandlers } from './taskHandlers';

/**
 * Combined MSW handlers
 */
export const handlers = [...authHandlers, ...userHandlers, ...taskHandlers];
