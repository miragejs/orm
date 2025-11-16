import { model } from 'miragejs-orm';

export interface TeamAttrs {
  id: string;
  name: string;
  department: string;
  description: string;
  createdAt: string;
  managerId: string;
}

export const teamModel = model()
  .name('team')
  .collection('teams')
  .attrs<TeamAttrs>()
  .create();

export type TeamModel = typeof teamModel;
