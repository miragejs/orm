import { model } from 'miragejs-orm';
import { Comment } from '@shared/types';

export interface CommentAttrs {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  taskId: string;
}

export const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .json<{ comment: Comment }, { comments: Comment[] }>()
  .create();

export type CommentModel = typeof commentModel;
