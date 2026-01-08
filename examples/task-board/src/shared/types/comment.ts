import type { SimpleUser } from './user';

/**
 * Comment entity type
 */
export interface Comment {
  id: string;
  author: SimpleUser;
  content: string;
  createdAt: string;
}
