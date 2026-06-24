import { collection, relations } from 'miragejs-orm';
import { commentModel, userModel, taskModel } from '@test/schema/models';
import { commentFactory } from './commentFactory';
import type { TestCollections } from '@test/schema';

export const commentsCollection = collection<TestCollections>()
  .model(commentModel)
  .factory(commentFactory)
  // Use auto-incrementing number IDs (1, 2, 3, ...) instead of the default
  // string IDs. The ID type is inferred from `initialCounter`, and must match
  // the `id` type declared on CommentAttrs.
  .identityManager({ initialCounter: 1 })
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
