import { collection, associations } from 'miragejs-orm';
import { commentModel, userModel, taskModel } from '@test/schema/models';
import { commentFactory } from './commentFactory';
import { TestCollections } from '@test/schema/types';

export const commentsCollection = collection<TestCollections>()
  .model(commentModel)
  .factory(commentFactory)
  .relationships({
    author: associations.belongsTo(userModel, {
      foreignKey: 'authorId',
    }),
    task: associations.belongsTo(taskModel),
  })
  .serializer({
    root: true,
    with: {
      author: { select: ['avatar', 'email', 'id', 'name', 'role'] },
    },
    relationsMode: 'embedded',
  })
  .create();
