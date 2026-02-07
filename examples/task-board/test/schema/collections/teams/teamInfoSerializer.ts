import { TeamInfo } from '@/shared/types';
import { teamModel, TeamModel } from '@test/schema/models/teamModel';
import { TestCollections } from '@test/schema/types';
import { Serializer } from 'miragejs-orm';

export const teamInfoSerializer = new Serializer<
  TeamModel,
  TestCollections,
  TeamInfo,
  TeamInfo[]
>(teamModel, {
  select: ['department', 'description', 'id', 'name', 'slug'],
  with: [],
});
