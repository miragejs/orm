import { model } from 'miragejs-orm';
import type { Team } from '@shared/types';

export interface TeamAttrs {
  id: string;
  createdAt: string;
  department: string;
  description: string;
  managerId: string;
  memberIds: string[];
  name: string;
  taskIds: string[];
}

export const teamModel = model()
  .name('team')
  .collection('teams')
  .attrs<TeamAttrs>()
  .json<Team, Team[]>()
  .build();

export type TeamModel = typeof teamModel;
