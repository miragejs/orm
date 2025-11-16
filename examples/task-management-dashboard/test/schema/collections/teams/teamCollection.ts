import { collection, associations } from 'miragejs-orm';
import { teamModel, userModel } from '@test/schema/models';
import type { AppCollections } from '@test/schema/types';
import { teamFactory } from './teamFactory';

export const teamsCollection = collection<AppCollections>()
  .model(teamModel)
  .factory(teamFactory)
  .relationships({
    members: associations.hasMany(userModel, { foreignKey: 'memberIds' }),
    manager: associations.belongsTo(userModel, { foreignKey: 'managerId' }),
  })
  .seeds({
    default: (schema) => {
      // Create testing team
      schema.teams.create({
        name: 'DevX',
        department: 'Engineering',
        description: 'Cross-functional development team building innovative solutions',
      });
    },
  })
  .create();
