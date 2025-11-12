import { model } from 'miragejs-orm';

export interface CommentAttrs {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  taskId: string;
}

export const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .create();

export type CommentModel = typeof commentModel;
