import { collection, associations } from 'miragejs-orm';
import { teamModel, userModel } from '@test/schema/models';
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
  })
  .serializer({
    with: ['members', 'manager'],
    relationsMode: 'embedded',
    root: true,
  })
  .seeds({
    default: (schema) => {
      // Create testing team
      schema.teams.create({
        department: 'Engineering',
        description: 'Cross-functional development team building innovative solutions',
        name: 'DevX',
      });
    },
  })
  .create();
