import { UserInfo } from '@/shared/types';
import { userModel, UserModel } from '@test/schema/models/userModel';
import { Serializer } from 'miragejs-orm';
import type { TestCollections } from '@test/schema';

export const userInfoSerializer = new Serializer<
  UserModel,
  TestCollections,
  UserInfo,
  UserInfo[]
>(userModel, {
  select: ['avatar', 'bio', 'email', 'id', 'name', 'role'],
  with: [],
});
