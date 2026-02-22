import type { TeamInfo } from './team';

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
  team: TeamInfo;
}

export type UserInfo = Pick<User, 'avatar' | 'bio' | 'email' | 'id' | 'name' | 'role'>;
