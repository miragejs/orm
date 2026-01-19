import type { UserInfo } from './user';

/**
 * Comment entity type
 */
export interface Comment {
  id: string;
  author: UserInfo;
  content: string;
  createdAt: string;
}
