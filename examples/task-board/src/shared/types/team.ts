import type { SimpleUser } from './user';

/**
 * Team entity type
 */
export interface Team {
  id: string;
  createdAt: string;
  department: string;
  description: string;
  manager: SimpleUser;
  members: SimpleUser[];
  name: string;
  taskIds: string[];
}

/**
 * Simple Team type
 */
export type SimpleTeam = Pick<Team, 'department' | 'description' | 'id' | 'name'>;
