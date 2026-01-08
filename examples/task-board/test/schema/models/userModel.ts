import { model } from 'miragejs-orm';
import type { User, UserRole } from '@shared/types';

export interface UserAttrs {
  id: string;
  avatar: string;
  bio: string;
  commentIds: string[];
  createdAt: string;
  email: string;
  name: string;
  role: UserRole;
  taskIds: string[];
  teamId: string;
}

export const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .json<{ user: User }, { users: User[] }>()
  .create();

export type UserModel = typeof userModel;
