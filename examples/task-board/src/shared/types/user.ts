import type { Team } from './team';

/**
 * Shared User type
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  team: Team;
}
