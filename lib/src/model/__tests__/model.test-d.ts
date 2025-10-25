/**
 * Type tests for Model using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import type { BelongsTo, HasMany } from '@src/associations';
import type {
  InferCollectionName,
  InferModelAttrs,
  InferModelName,
  ModelAttrs,
  ModelForeignKeys,
  ModelTemplate,
  ModelUpdateAttrs,
  PartialModelAttrs,
} from '@src/model';
import { model } from '@src/model';
import type { CollectionConfig } from '@src/schema';
import { expectTypeOf, test } from 'vitest';

// Test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
  age: number;
}

interface PostAttrs {
  id: number;
  title: string;
  content: string;
  published: boolean;
}

interface CommentAttrs {
  id: string;
  content: string;
  rating?: number;
}

// Test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();
const commentModel = model().name('comment').collection('comments').attrs<CommentAttrs>().create();

// Test schema type
type TestSchema = {
  users: CollectionConfig<typeof userModel>;
  posts: CollectionConfig<typeof postModel>;
  comments: CollectionConfig<typeof commentModel>;
};

test('ModelTemplate should work for basic models', () => {
  const model1: ModelTemplate = userModel;
  const model2: ModelTemplate = postModel;

  expectTypeOf(model1.modelName).toBeString();
  expectTypeOf(model2.collectionName).toBeString();
});

test('InferModelName should extract model names correctly', () => {
  type UserName = InferModelName<typeof userModel>;
  const userName: UserName = 'user';
  expectTypeOf(userName).toEqualTypeOf<'user'>();

  type PostName = InferModelName<typeof postModel>;
  const postName: PostName = 'post';
  expectTypeOf(postName).toEqualTypeOf<'post'>();
});

test('InferCollectionName should extract collection names correctly', () => {
  type UsersCollection = InferCollectionName<typeof userModel>;
  const collection: UsersCollection = 'users';
  expectTypeOf(collection).toEqualTypeOf<'users'>();

  type PostsCollection = InferCollectionName<typeof postModel>;
  const posts: PostsCollection = 'posts';
  expectTypeOf(posts).toEqualTypeOf<'posts'>();
});

test('InferModelAttrs should infer attribute types correctly', () => {
  const attrs: InferModelAttrs<typeof userModel> = {
    id: '1',
    name: 'John',
    email: 'john@example.com',
    age: 30,
  };

  expectTypeOf(attrs).toEqualTypeOf<InferModelAttrs<typeof userModel>>();
});

test('ModelAttrs should work for basic attributes', () => {
  const attrs: ModelAttrs<typeof userModel> = {
    id: '1',
    name: 'John',
    email: 'john@example.com',
    age: 30,
  };

  expectTypeOf(attrs.id).toBeString();
  expectTypeOf(attrs.name).toBeString();
  expectTypeOf(attrs.age).toBeNumber();
});

test('ModelUpdateAttrs should make all fields optional except id', () => {
  const update: ModelUpdateAttrs<typeof userModel> = {
    id: '1',
    name: 'Jane',
  };

  const updateAge: ModelUpdateAttrs<typeof userModel> = {
    id: '1',
    age: 31,
  };

  // Types are verified by the successful assignments above
  expectTypeOf(update).toBeObject();
  expectTypeOf(updateAge).toBeObject();
});

test('PartialModelAttrs should make all fields optional', () => {
  const partial: PartialModelAttrs<typeof userModel> = {
    name: 'John',
  };

  expectTypeOf(partial.name).toEqualTypeOf<string | undefined>();
  expectTypeOf(partial.id).toEqualTypeOf<string | undefined>();

  const empty: PartialModelAttrs<typeof userModel> = {};
  expectTypeOf(empty).toBeObject();
});

test('ModelForeignKeys should work with BelongsTo', () => {
  type PostRelationships = {
    author: BelongsTo<typeof userModel, 'authorId'>;
  };

  type PostForeignKeys = ModelForeignKeys<PostRelationships>;
  const fk: PostForeignKeys = {
    authorId: 'user-1',
  };

  expectTypeOf(fk).toEqualTypeOf<PostForeignKeys>();
});

test('ModelForeignKeys should work with HasMany', () => {
  type UserRelationships = {
    posts: HasMany<typeof postModel, 'postIds'>;
  };

  type UserForeignKeys = ModelForeignKeys<UserRelationships>;
  const fk: UserForeignKeys = {
    postIds: [1, 2, 3],
  };

  expectTypeOf(fk).toEqualTypeOf<UserForeignKeys>();
});

test('ModelAttrs should work with relationships', () => {
  type PostRelationships = {
    author: BelongsTo<typeof userModel, 'authorId'>;
  };

  const attrs: ModelAttrs<typeof postModel, TestSchema, PostRelationships> = {
    id: 1,
    title: 'Post',
    content: 'Content',
    published: true,
    authorId: 'user-1',
  };

  expectTypeOf(attrs).toEqualTypeOf<ModelAttrs<typeof postModel, TestSchema, PostRelationships>>();
});

test('ModelUpdateAttrs should work with optional fields', () => {
  const update: ModelUpdateAttrs<typeof commentModel> = {
    id: 'comment-1',
    rating: 5,
  };

  // Type is verified by the successful assignment above
  expectTypeOf(update).toBeObject();
});

test('PartialModelAttrs should work with optional fields', () => {
  const partial: PartialModelAttrs<typeof commentModel> = {
    rating: 4,
  };

  expectTypeOf(partial.rating).toEqualTypeOf<number | undefined>();
});
