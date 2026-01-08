import type { SimpleTeam } from './team';

/**
 * Shared User type
 */
export interface User {
  id: string;
  avatar: string;
  bio: string;
  email: string;
  name: string;
  role: string;
  team: SimpleTeam;
}

export type SimpleUser = Pick<User, 'avatar' | 'bio' | 'email' | 'id' | 'name' | 'role'>;
