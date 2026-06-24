import { model } from 'miragejs-orm';
import type { Comment } from '@shared/types';

export interface CommentAttrs {
  // Comments use number IDs (see commentCollection's identityManager config),
  // unlike the other models which use the default string IDs.
  id: number;
  authorId: string;
  content: string;
  createdAt: string;
  taskId: string;
}

export const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .json<Comment, Comment[]>()
  .build();

export type CommentModel = typeof commentModel;
