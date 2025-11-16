import { authHandlers } from './authHandlers';
import { userHandlers } from './userHandlers';

/**
 * Combined MSW handlers
 */
export const handlers = [...authHandlers, ...userHandlers];
