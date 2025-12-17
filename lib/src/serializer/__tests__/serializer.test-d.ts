/**
 * Type tests for Serializer using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import { model } from '@src/model';
import { collection, schema, type SchemaCollections } from '@src/schema';
import { Serializer, type DataSerializerOptions, type SerializerOptions } from '@src/serializer';
import { expectTypeOf, test } from 'vitest';

test('SerializerOptions should accept complete configuration', () => {
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

  const options: SerializerOptions<typeof userModel> = {
    select: ['id', 'name', 'email'],
    root: true,
    relationsMode: 'sideLoaded',
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<typeof userModel>>();
});

test('DataSerializerOptions should work with select', () => {
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

  const options: DataSerializerOptions<typeof userModel> = {
    select: ['id', 'name', 'email'],
  };

  expectTypeOf(options).toEqualTypeOf<DataSerializerOptions<typeof userModel>>();
});

test('DataSerializerOptions should work with with for relationships', () => {
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

  const options: DataSerializerOptions<typeof postModel> = {
    select: ['id', 'title', 'content'],
    with: ['author', 'comments'],
  };

  expectTypeOf(options).toEqualTypeOf<DataSerializerOptions<typeof postModel>>();
});

test('SerializerOptions should work with partial select', () => {
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

  const options: SerializerOptions<typeof userModel> = {
    select: ['id', 'name'],
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<typeof userModel>>();
});

test('SerializerOptions should work with root and relationsMode options', () => {
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

  const options: SerializerOptions<typeof postModel> = {
    root: 'data',
    relationsMode: 'embedded',
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<typeof postModel>>();
});

test('Model.toJSON() should return model attrs by default (no serializer)', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
    age: number;
  };

  const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

  const userCollection = collection().model(userModel).create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  const json = user.toJSON();
  expectTypeOf(json).toEqualTypeOf<UserAttrs>();
});

test('Model.toJSON() should return UserJSON when defined via .json()', () => {
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

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .json<UserJSON>() // Define serialized type
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name', 'email'] })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  const json = user.toJSON();
  expectTypeOf(json).toEqualTypeOf<UserJSON>();
});

test('Model.toJSON() should return root-wrapped type when defined via .json()', () => {
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

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .json<UserRootJSON>() // Define root-wrapped serialized type
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name', 'email'], root: true })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  const json = user.toJSON();
  expectTypeOf(json).toEqualTypeOf<UserRootJSON>();
});

test('ModelCollection.toJSON() should return PostJSON[] when defined via .json()', () => {
  type PostAttrs = {
    id: number;
    title: string;
    content: string;
    published: boolean;
  };

  type PostJSON = {
    id: number;
    title: string;
  };

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .json<PostJSON, PostJSON[]>() // Define serialized types for model and collection
    .create();

  const postCollection = collection()
    .model(postModel)
    .serializer({ select: ['id', 'title'] })
    .create();
  const testSchema = schema().collections({ posts: postCollection }).setup();

  testSchema.posts.create({ title: 'Post 1', content: 'Content', published: true });
  const posts = testSchema.posts.all();

  const json = posts.toJSON();
  expectTypeOf(json).toEqualTypeOf<PostJSON[]>();
});

test('ModelCollection.toJSON() should return root-wrapped type when defined via .json()', () => {
  type PostAttrs = {
    id: number;
    title: string;
    content: string;
    published: boolean;
  };

  type PostJSON = {
    id: number;
    title: string;
  };

  type PostsJSON = {
    posts: PostJSON[];
  };

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .json<PostJSON, PostsJSON>() // Define serialized types for model and collection with root
    .create();

  const postCollection = collection()
    .model(postModel)
    .serializer({ select: ['id', 'title'], root: true })
    .create();
  const testSchema = schema().collections({ posts: postCollection }).setup();

  testSchema.posts.create({ title: 'Post 1', content: 'Content', published: true });
  const posts = testSchema.posts.all();

  const json = posts.toJSON();
  expectTypeOf(json).toEqualTypeOf<PostsJSON>();
});

test('CollectionBuilder.serializer() should preserve serializer type with instance', () => {
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

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .json<UserJSON>()
    .create();

  const serializer = new Serializer<typeof userModel, SchemaCollections, UserJSON>(userModel, {
    select: ['id', 'name', 'email'],
  });

  const builder = collection().model(userModel).serializer(serializer);

  const config = builder.create();
  expectTypeOf(config.serializerInstance).toEqualTypeOf<typeof serializer | undefined>();
});

test('CollectionBuilder.serializer() should infer Serializer type from config', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
    age: number;
  };

  const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

  const builder = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name', 'email'] });

  const config = builder.create();

  expectTypeOf(config.serializerConfig).toEqualTypeOf<
    SerializerOptions<typeof userModel> | undefined
  >();
});

test('Serializer.serialize() should accept model instances', () => {
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

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .json<UserJSON>()
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name', 'email'] })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });
  const result = testSchema.users.serializer?.serialize(user);

  expectTypeOf(result).toEqualTypeOf<UserJSON | undefined>();
});

test('Serializer instance can serialize models from different collections', () => {
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

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .json<UserJSON>()
    .create();

  const serializer = new Serializer<typeof userModel, SchemaCollections, UserJSON>(userModel, {
    select: ['id', 'name', 'email'],
  });

  const collection1 = collection().model(userModel).serializer(serializer).create();
  const collection2 = collection().model(userModel).serializer(serializer).create();

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

  const result1 = testSchema.users.serializer?.serialize(user);
  const result2 = testSchema.admins.serializer?.serialize(user);

  expectTypeOf(result1).toEqualTypeOf<UserJSON | undefined>();
  expectTypeOf(result2).toEqualTypeOf<UserJSON | undefined>();
});
