import type { User } from './user';

/**
 * Comment entity type
 */
export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
}
