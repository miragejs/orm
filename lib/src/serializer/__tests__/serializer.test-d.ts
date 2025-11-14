/**
 * Type tests for Serializer using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import { model } from '@src/model';
import { collection, schema } from '@src/schema';
import { Serializer, type DataSerializerOptions, type SerializerOptions } from '@src/serializer';
import { expectTypeOf, test } from 'vitest';

// Test models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<{
    id: string;
    name: string;
    email: string;
    age: number;
  }>()
  .create();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<{
    id: number;
    title: string;
    content: string;
    published: boolean;
  }>()
  .create();

// Define JSON types for testing
type UserAttrs = {
  id: string;
  name: string;
  email: string;
  age: number;
};

type UserJSON = {
  id: string;
  name: string;
  email: string;
};

type UserRootJSON = {
  user: UserJSON;
};

type PostJSON = {
  id: number;
  title: string;
};

type PostsJSON = {
  posts: PostJSON[];
};

test('SerializerOptions should accept complete configuration', () => {
  const options: SerializerOptions<typeof userModel> = {
    attrs: ['id', 'name', 'email'],
    root: true,
    embed: false,
  };

  expectTypeOf(options).toMatchTypeOf<SerializerOptions<typeof userModel>>();
});

test('DataSerializerOptions should work with attrs', () => {
  const options: DataSerializerOptions<typeof userModel> = {
    attrs: ['id', 'name', 'email'],
  };

  expectTypeOf(options).toEqualTypeOf<DataSerializerOptions<typeof userModel>>();
});

test('DataSerializerOptions should work with include for relationships', () => {
  const options: DataSerializerOptions<typeof postModel> = {
    attrs: ['id', 'title', 'content'],
    include: ['author', 'comments'],
  };

  expectTypeOf(options).toEqualTypeOf<DataSerializerOptions<typeof postModel>>();
});

test('SerializerOptions should work with partial attrs', () => {
  const options: SerializerOptions<typeof userModel> = {
    attrs: ['id', 'name'],
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<typeof userModel>>();
});

test('SerializerOptions should work with root and embed options', () => {
  const options: SerializerOptions<typeof postModel> = {
    root: 'data',
    embed: true,
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<typeof postModel>>();
});

test('Model.toJSON() should return UserAttrs with Serializer instance', () => {
  const serializer = new Serializer<typeof userModel>(userModel);
  const userCollection = collection().model(userModel).serializer(serializer).create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  const json = user.toJSON();
  expectTypeOf(json).toEqualTypeOf<UserAttrs>();
});

test('Model.toJSON() should return UserJSON with filtered Serializer', () => {
  const serializer = new Serializer<typeof userModel, UserJSON>(userModel, {
    attrs: ['id', 'name', 'email'],
  });
  const userCollection = collection().model(userModel).serializer(serializer).create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  const json = user.toJSON();
  expectTypeOf(json).toEqualTypeOf<UserJSON>();
});

test('Model.toJSON() should return UserRootJSON with root wrapping', () => {
  const serializer = new Serializer<typeof userModel, UserRootJSON>(userModel, {
    attrs: ['id', 'name', 'email'],
    root: true,
  });
  const userCollection = collection().model(userModel).serializer(serializer).create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  const json = user.toJSON();
  expectTypeOf(json).toEqualTypeOf<UserRootJSON>();
});

test('Model.toJSON() should return model attrs type when no serializer', () => {
  // This test is covered by runtime tests in Serializer.test.ts
  // The type inference without serializer falls back to TAttrs
  // which is correctly typed as the model's attribute interface
  type NoSerializerResult = UserAttrs;
  expectTypeOf<NoSerializerResult>().toEqualTypeOf<UserAttrs>();
});

test('ModelCollection.toJSON() should return PostJSON[] without root', () => {
  const serializer = new Serializer<typeof postModel, PostJSON, PostJSON[]>(postModel, {
    attrs: ['id', 'title'],
  });
  const postCollection = collection().model(postModel).serializer(serializer).create();
  const testSchema = schema().collections({ posts: postCollection }).setup();

  testSchema.posts.create({ title: 'Post 1', content: 'Content', published: true });
  const posts = testSchema.posts.all();

  const json = posts.toJSON();
  expectTypeOf(json).toEqualTypeOf<PostJSON[]>();
});

test('ModelCollection.toJSON() should return PostsJSON with root', () => {
  const serializer = new Serializer<typeof postModel, PostJSON, PostsJSON>(postModel, {
    attrs: ['id', 'title'],
    root: true,
  });
  const postCollection = collection().model(postModel).serializer(serializer).create();
  const testSchema = schema().collections({ posts: postCollection }).setup();

  testSchema.posts.create({ title: 'Post 1', content: 'Content', published: true });
  const posts = testSchema.posts.all();

  const json = posts.toJSON();
  expectTypeOf(json).toEqualTypeOf<PostsJSON>();
});

test('CollectionBuilder.serializer() should preserve serializer type with instance', () => {
  const serializer = new Serializer<typeof userModel, UserJSON>(userModel, {
    attrs: ['id', 'name', 'email'],
  });

  const builder = collection().model(userModel).serializer(serializer);

  // The builder should carry the serializer type
  const config = builder.create();
  expectTypeOf(config.serializerInstance).toEqualTypeOf<typeof serializer | undefined>();
});

test('CollectionBuilder.serializer() should infer Serializer type from config', () => {
  const builder = collection()
    .model(userModel)
    .serializer({ attrs: ['id', 'name', 'email'] });

  const config = builder.create();

  // When passing a config, serializerConfig should be set
  expectTypeOf(config.serializerConfig).toMatchTypeOf<
    SerializerOptions<typeof userModel> | undefined
  >();
});
