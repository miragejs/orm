import { model } from 'miragejs-orm';
import { User, UserRole } from '@shared/types';

export interface UserAttrs {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  bio: string;
  createdAt: string;
  teamId: string;
  taskIds: string[];
  commentIds: string[];
}

export const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .json<{ user: User }, { users: User[] }>()
  .create();

export type UserModel = typeof userModel;
