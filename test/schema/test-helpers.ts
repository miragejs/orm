import { factory } from '@src/factory';
import { NumberIdentityManager } from '@src/id-manager';
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
export const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
export const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();
export const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .create();

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
  .create();

export const postFactory = factory()
  .model(postModel)
  .attrs({
    content: () => 'This is a test post',
    title: () => 'Hello World',
  })
  .create();

export const commentFactory = factory()
  .model(commentModel)
  .attrs({
    content: () => 'Great post!',
  })
  .create();

// Create post identity manager (reused across tests)
export const postIdentityManager = new NumberIdentityManager();
