import { UserInfo } from '@/shared/types';
import { userModel, UserModel } from '@test/schema/models/userModel';
import { TestCollections } from '@test/schema/types';
import { Serializer } from 'miragejs-orm';

export const userInfoSerializer = new Serializer<
  UserModel,
  TestCollections,
  UserInfo,
  UserInfo[]
>(userModel, {
  select: ['avatar', 'bio', 'email', 'id', 'name', 'role'],
  with: [],
});
