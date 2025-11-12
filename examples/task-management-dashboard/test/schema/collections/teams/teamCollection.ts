import { collection, associations } from 'miragejs-orm';
import { teamModel, userModel } from '@test/schema/models';
import { teamFactory } from './teamFactory';

export const teamsCollection = collection()
  .model(teamModel)
  .factory(teamFactory)
  .relationships({
    members: associations.hasMany(userModel, { foreignKey: 'memberIds' }),
    manager: associations.belongsTo(userModel, { foreignKey: 'managerId' }),
  })
  .create();
