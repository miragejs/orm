import { model } from 'miragejs-orm';

export interface TeamAttrs {
  id: string;
  createdAt: string;
  department: string;
  description: string;
  managerId: string;
  name: string;
}

export const teamModel = model()
  .name('team')
  .collection('teams')
  .attrs<TeamAttrs>()
  .create();

export type TeamModel = typeof teamModel;
