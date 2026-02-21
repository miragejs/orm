import { MemberOption } from '@/shared/types';
import { userModel, UserModel } from '@test/schema/models/userModel';
import { Serializer } from 'miragejs-orm';
import type { TestCollections } from '@test/schema';

export const memberOptionSerializer = new Serializer<
  UserModel,
  TestCollections,
  MemberOption,
  MemberOption[]
>(userModel, {
  select: ['avatar', 'id', 'name'],
  with: [],
});
