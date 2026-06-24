import type { UserInfo } from './user';

/**
 * Comment entity type
 */
export interface Comment {
  id: number;
  author: UserInfo;
  content: string;
  createdAt: string;
}
