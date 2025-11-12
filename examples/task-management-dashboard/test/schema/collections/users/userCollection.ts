import { associations, collection } from 'miragejs-orm';
import { commentModel, taskModel, teamModel, userModel } from '@test/schema/models';
import { userFactory } from './userFactory';

export const usersCollection = collection()
  .model(userModel)
  .factory(userFactory)
  .relationships({
    comments: associations.hasMany(commentModel),
    tasks: associations.hasMany(taskModel),
    team: associations.belongsTo(teamModel),
  })
  .create();
