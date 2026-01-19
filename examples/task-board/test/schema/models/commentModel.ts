import { model } from 'miragejs-orm';
import type { Comment } from '@shared/types';

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
  .json<Comment, Comment[]>()
  .build();

export type CommentModel = typeof commentModel;
