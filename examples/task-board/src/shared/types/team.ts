import type { UserInfo } from './user';

/**
 * Team entity type
 */
export interface Team {
  id: string;
  createdAt: string;
  department: string;
  description: string;
  manager: UserInfo;
  members: UserInfo[];
  name: string;
  taskIds: string[];
}

/**
 * Team info type
 */
export type TeamInfo = Pick<Team, 'department' | 'description' | 'id' | 'name'>;
