import type { User } from './user';

/**
 * Comment entity type
 */
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  taskId: string;
  author?: User;
}
