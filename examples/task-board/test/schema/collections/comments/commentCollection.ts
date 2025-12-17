import { collection, associations } from 'miragejs-orm';
import { commentModel, userModel, taskModel } from '@test/schema/models';
import { commentFactory } from './commentFactory';

export const commentsCollection = collection()
  .model(commentModel)
  .factory(commentFactory)
  .relationships({
    author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
    task: associations.belongsTo(taskModel),
  })
  .serializer({
    with: ['author'],
    relationsMode: 'embedded',
    root: true,
  })
  .create();
