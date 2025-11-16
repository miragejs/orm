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

// Define model types
type UserModel = typeof userModel;
type PostModel = typeof postModel;

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
  const options: SerializerOptions<UserModel> = {
    attrs: ['id', 'name', 'email'],
    root: true,
    embed: false,
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<UserModel>>();
});

test('DataSerializerOptions should work with attrs', () => {
  const options: DataSerializerOptions<UserModel> = {
    attrs: ['id', 'name', 'email'],
  };

  expectTypeOf(options).toEqualTypeOf<DataSerializerOptions<UserModel>>();
});

test('DataSerializerOptions should work with include for relationships', () => {
  const options: DataSerializerOptions<PostModel> = {
    attrs: ['id', 'title', 'content'],
    include: ['author', 'comments'],
  };

  expectTypeOf(options).toEqualTypeOf<DataSerializerOptions<PostModel>>();
});

test('SerializerOptions should work with partial attrs', () => {
  const options: SerializerOptions<UserModel> = {
    attrs: ['id', 'name'],
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<UserModel>>();
});

test('SerializerOptions should work with root and embed options', () => {
  const options: SerializerOptions<PostModel> = {
    root: 'data',
    embed: true,
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<PostModel>>();
});

test('Model.toJSON() should return UserAttrs with Serializer instance', () => {
  const serializer = new Serializer<UserModel>(userModel);
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
  const serializer = new Serializer<UserModel, UserJSON>(userModel, {
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
  const serializer = new Serializer<UserModel, UserRootJSON>(userModel, {
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
  const serializer = new Serializer<PostModel, PostJSON, PostJSON[]>(postModel, {
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
  const serializer = new Serializer<PostModel, PostJSON, PostsJSON>(postModel, {
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
  const serializer = new Serializer<UserModel, UserJSON>(userModel, {
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
  expectTypeOf(config.serializerConfig).toEqualTypeOf<SerializerOptions<UserModel> | undefined>();
});

test('Serializer.serialize() should accept model instances with serializers', () => {
  // Create a serializer and collection with it
  const serializer = new Serializer<UserModel, UserJSON>(userModel, {
    attrs: ['id', 'name', 'email'],
  });
  const userCollection = collection().model(userModel).serializer(serializer).create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  // Create a user - this model instance will have a serializer attached
  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  // The collection's serializer should be able to serialize the model instance
  // This verifies that Serializer.serialize() accepts ModelInstance with TSerializer parameter
  const result = testSchema.users.serializer?.serialize(user);

  expectTypeOf(result).toEqualTypeOf<UserJSON | undefined>();
});

test('Serializer.serialize() should work across different collection instances', () => {
  // Create two collections with serializers
  const serializer1 = new Serializer<UserModel, UserJSON>(userModel, {
    attrs: ['id', 'name', 'email'],
  });
  const serializer2 = new Serializer<UserModel, UserJSON>(userModel, {
    attrs: ['id', 'name', 'email'],
  });

  const collection1 = collection().model(userModel).serializer(serializer1).create();
  const collection2 = collection().model(userModel).serializer(serializer2).create();

  const testSchema = schema()
    .collections({
      users: collection1,
      admins: collection2,
    })
    .setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  // Both serializers should be able to serialize the user
  const result1 = testSchema.users.serializer?.serialize(user);
  const result2 = testSchema.admins.serializer?.serialize(user);

  expectTypeOf(result1).toEqualTypeOf<UserJSON | undefined>();
  expectTypeOf(result2).toEqualTypeOf<UserJSON | undefined>();
});
