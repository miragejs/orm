import { collection, relations } from 'miragejs-orm';
import { commentModel, userModel, taskModel } from '@test/schema/models';
import { commentFactory } from './commentFactory';
import type { TestCollections } from '@test/schema/types';

export const commentsCollection = collection<TestCollections>()
  .model(commentModel)
  .factory(commentFactory)
  .relationships({
    author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
    task: relations.belongsTo(taskModel),
  })
  .serializer({
    with: {
      author: { select: ['avatar', 'bio', 'email', 'id', 'name', 'role'] },
    },
    relationsMode: 'embedded',
  })
  .build();
