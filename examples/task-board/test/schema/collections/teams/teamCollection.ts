import { collection, associations } from 'miragejs-orm';
import { taskModel, teamModel, userModel } from '@test/schema/models';
import type { TestCollections } from '@test/schema/types';
import { teamFactory } from './teamFactory';

export const teamsCollection = collection<TestCollections>()
  .model(teamModel)
  .factory(teamFactory)
  .relationships({
    manager: associations.belongsTo(userModel, {
      foreignKey: 'managerId',
      inverse: null,
    }),
    members: associations.hasMany(userModel, {
      foreignKey: 'memberIds',
      inverse: 'team',
    }),
    tasks: associations.hasMany(taskModel),
  })
  .serializer({
    root: true,
    with: {
      manager: { select: ['avatar', 'email', 'id', 'name', 'role'] },
      members: { select: ['avatar', 'email', 'id', 'name', 'role'] },
      tasks: { mode: 'foreignKey' },
    },
    relationsMode: 'embedded',
  })
  .seeds({
    default: (schema) => {
      // Create testing team
      schema.teams.create(
        {
          department: 'Engineering',
          description: 'Cross-functional development team building innovative solutions',
          name: 'DevX',
        },
        'withMembers',
      );
    },
  })
  .create();
