import { authHandlers } from './authHandlers';
import { userHandlers } from './userHandlers';
import { taskHandlers } from './taskHandlers';
import { teamHandlers } from './teamHandlers';

/**
 * Combined MSW handlers in a correct order
 */
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...teamHandlers,
  ...taskHandlers,
];

export { authHandlers, taskHandlers, teamHandlers, userHandlers };
