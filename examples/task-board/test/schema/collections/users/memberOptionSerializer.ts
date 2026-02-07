import { MemberOption } from '@/shared/types';
import { userModel, UserModel } from '@test/schema/models/userModel';
import { TestCollections } from '@test/schema/types';
import { Serializer } from 'miragejs-orm';

export const memberOptionSerializer = new Serializer<
  UserModel,
  TestCollections,
  MemberOption,
  MemberOption[]
>(userModel, {
  select: ['avatar', 'id', 'name'],
  with: [],
});
