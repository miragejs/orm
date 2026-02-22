import { factory } from '@src/factory';
import type { IdentityManagerConfig } from '@src/id-manager';
import { model } from '@src/model';

// Define test model attributes
export interface UserAttrs {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface PostAttrs {
  id: number;
  content: string;
  title: string;
}

export interface CommentAttrs {
  id: string;
  content: string;
}

// Create test models
export const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .build();
export const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .build();
export const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .build();

// Define test model types
export type UserModel = typeof userModel;
export type PostModel = typeof postModel;
export type CommentModel = typeof commentModel;

// Create test factories
export const userFactory = factory()
  .model(userModel)
  .attrs({
    email: () => 'john@example.com',
    name: () => 'John Doe',
  })
  .traits({
    admin: {
      email: 'admin@example.com',
    },
  })
  .build();

export const postFactory = factory()
  .model(postModel)
  .attrs({
    content: () => 'This is a test post',
    title: () => 'Hello World',
  })
  .build();

export const commentFactory = factory()
  .model(commentModel)
  .attrs({
    content: () => 'Great post!',
  })
  .build();

// Create post identity manager config (reused across tests)
export const postIdentityManagerConfig: IdentityManagerConfig<number> = {
  initialCounter: 1,
};
