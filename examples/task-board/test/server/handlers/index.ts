import { authHandlers } from './authHandlers';
import { userHandlers } from './userHandlers';
import { taskHandlers } from './taskHandlers';
import { teamHandlers } from './teamHandlers';

/**
 * Combined MSW handlers
 */
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...taskHandlers,
  ...teamHandlers,
];

export { authHandlers, userHandlers, taskHandlers, teamHandlers };
