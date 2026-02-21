import { collection, relations } from 'miragejs-orm';
import { taskModel, teamModel, userModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';
import { teamFactory } from './teamFactory';

export const teamsCollection = collection<TestCollections>()
  .model(teamModel)
  .factory(teamFactory)
  .relationships({
    manager: relations.belongsTo(userModel, {
      foreignKey: 'managerId',
      inverse: null,
    }),
    members: relations.hasMany(userModel, {
      foreignKey: 'memberIds',
      inverse: 'team',
    }),
    tasks: relations.hasMany(taskModel),
  })
  .serializer({
    with: {
      manager: { select: ['avatar', 'bio', 'email', 'id', 'name', 'role'] },
      members: { select: ['avatar', 'bio', 'email', 'id', 'name', 'role'] },
      tasks: { mode: 'foreignKey' },
    },
    relationsMode: 'embedded',
  })
  .seeds((schema) => {
    // Create testing team
    schema.teams.create(
      {
        department: 'Engineering',
        description: 'Cross-functional development team building innovative solutions',
        name: 'DevX Tools',
      },
      'withMembers',
    );
  })
  .build();
