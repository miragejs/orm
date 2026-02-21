import { TeamInfo } from '@/shared/types';
import { teamModel, TeamModel } from '@test/schema/models/teamModel';
import { Serializer } from 'miragejs-orm';
import type { TestCollections } from '@test/schema';

export const teamInfoSerializer = new Serializer<
  TeamModel,
  TestCollections,
  TeamInfo,
  TeamInfo[]
>(teamModel, {
  select: ['department', 'description', 'id', 'name', 'slug'],
  with: [],
});
