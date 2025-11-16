import { model } from 'miragejs-orm';
import { UserRole } from '@shared/types';

export interface UserAttrs {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  bio: string;
  createdAt: string;
  teamId: string;
}

export const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .create();

export type UserModel = typeof userModel;
