import { model } from 'miragejs-orm';
import type { UserRole } from '@shared/enums';
import type { User } from '@shared/types';

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
  .json<User, User[]>()
  .build();

export type UserModel = typeof userModel;
