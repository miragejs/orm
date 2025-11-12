import { collection, associations } from 'miragejs-orm';
import { taskModel, userModel, teamModel, commentModel } from '@test/schema/models';
import { taskFactory } from './taskFactory';

export const tasksCollection = collection()
  .model(taskModel)
  .factory(taskFactory)
  .relationships({
    assignee: associations.belongsTo(userModel, { foreignKey: 'assigneeId' }),
    team: associations.belongsTo(teamModel),
    comments: associations.hasMany(commentModel),
  })
  .create();
