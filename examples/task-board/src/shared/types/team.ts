import { User } from './user';

/**
 * Team entity type
 */
export interface Team {
  id: string;
  name: string;
  department: string;
  description: string;
  createdAt: string;
  managerId: string;
}

/**
 * Team member type without circular team reference
 */
export type TeamMember = Omit<User, 'team'> & {
  teamId: Team['id'];
};
