/**
 * Type tests for Serializer using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import { model } from '@src/model';
import { relations, type BelongsTo, type HasMany } from '@src/relations';
import { collection, schema, type SchemaCollections } from '@src/schema';
import {
  Serializer,
  type DataSerializerOptions,
  type SerializerConfig,
  type WithOption,
  type NestedSerializerOptions,
} from '@src/serializer';
import { expectTypeOf, test } from 'vitest';

test('SerializerConfig should accept complete configuration', () => {
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

  const options: SerializerConfig<typeof userModel> = {
    select: ['id', 'name', 'email'],
    root: true,
    relationsMode: 'sideLoaded',
  };

  expectTypeOf(options).toEqualTypeOf<SerializerConfig<typeof userModel>>();
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

  expectTypeOf(options).toEqualTypeOf<
    DataSerializerOptions<typeof userModel>
  >();
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

  expectTypeOf(options).toEqualTypeOf<
    DataSerializerOptions<typeof postModel>
  >();
});

test('SerializerConfig should work with partial select', () => {
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

  const options: SerializerConfig<typeof userModel> = {
    select: ['id', 'name'],
  };

  expectTypeOf(options).toEqualTypeOf<SerializerConfig<typeof userModel>>();
});

test('SerializerConfig should work with root and relationsMode options', () => {
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

  const options: SerializerConfig<typeof postModel> = {
    root: 'data',
    relationsMode: 'embedded',
  };

  expectTypeOf(options).toEqualTypeOf<SerializerConfig<typeof postModel>>();
});

test('Model.toJSON() should return model attrs by default (no serializer)', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
    age: number;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

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

  testSchema.posts.create({
    title: 'Post 1',
    content: 'Content',
    published: true,
  });
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

  testSchema.posts.create({
    title: 'Post 1',
    content: 'Content',
    published: true,
  });
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

  const serializer = new Serializer<
    typeof userModel,
    SchemaCollections,
    UserJSON
  >(userModel, {
    select: ['id', 'name', 'email'],
  });

  const builder = collection().model(userModel).serializer(serializer);

  const config = builder.create();
  expectTypeOf(config.serializer).toEqualTypeOf<
    SerializerConfig<typeof userModel> | typeof serializer | undefined
  >();
});

test('CollectionBuilder.serializer() should infer Serializer type from config', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
    age: number;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  const builder = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name', 'email'] });

  const config = builder.create();

  expectTypeOf(config.serializer).toEqualTypeOf<
    | SerializerConfig<typeof userModel>
    | Serializer<typeof userModel>
    | undefined
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

  const serializer = new Serializer<
    typeof userModel,
    SchemaCollections,
    UserJSON
  >(userModel, {
    select: ['id', 'name', 'email'],
  });

  const collection1 = collection()
    .model(userModel)
    .serializer(serializer)
    .create();
  const collection2 = collection()
    .model(userModel)
    .serializer(serializer)
    .create();

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

// -- LAYERED SERIALIZATION METHODS --

test('Serializer.serializeAttrs() should return Record<string, unknown>', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name'] })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
  });

  const result = testSchema.users.serializer?.serializeAttrs(user);
  expectTypeOf(result).toEqualTypeOf<Record<string, unknown> | undefined>();
});

test('Serializer.serializeCollectionAttrs() should return Record<string, unknown>[]', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name'] })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  testSchema.users.create({ name: 'John', email: 'john@example.com' });
  testSchema.users.create({ name: 'Jane', email: 'jane@example.com' });
  const users = testSchema.users.all();

  const result = testSchema.users.serializer?.serializeCollectionAttrs(users);
  expectTypeOf(result).toEqualTypeOf<Record<string, unknown>[] | undefined>();
});

test('Serializer.serializeModel() should return Record<string, unknown>', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name'] })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
  });

  const result = testSchema.users.serializer?.serializeModel(user);
  expectTypeOf(result).toEqualTypeOf<Record<string, unknown> | undefined>();
});

test('Serializer.serializeCollectionModels() should return Record<string, unknown>[]', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name'] })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  testSchema.users.create({ name: 'John', email: 'john@example.com' });
  testSchema.users.create({ name: 'Jane', email: 'jane@example.com' });
  const users = testSchema.users.all();

  const result = testSchema.users.serializer?.serializeCollectionModels(users);
  expectTypeOf(result).toEqualTypeOf<Record<string, unknown>[] | undefined>();
});

// -- PUBLIC SERIALIZER PROPERTY --

test('Model instance should have public serializer property', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
  };

  type UserJSON = {
    id: string;
    name: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .json<UserJSON>()
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name'] })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  const user = testSchema.users.create({
    name: 'John',
    email: 'john@example.com',
  });

  // Model should have public serializer property (readonly, optional)
  expectTypeOf(user).toHaveProperty('serializer');

  // When serializer exists, it should have serialize and serializeAttrs methods
  if (user.serializer) {
    expectTypeOf(user.serializer.serialize).toBeFunction();
    expectTypeOf(user.serializer.serializeAttrs).toBeFunction();
    expectTypeOf(user.serializer.serializeModel).toBeFunction();
  }
});

test('ModelCollection should have public serializer property', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
  };

  type UserJSON = {
    id: string;
    name: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .json<UserJSON>()
    .create();

  const userCollection = collection()
    .model(userModel)
    .serializer({ select: ['id', 'name'] })
    .create();
  const testSchema = schema().collections({ users: userCollection }).setup();

  testSchema.users.create({ name: 'John', email: 'john@example.com' });
  const users = testSchema.users.all();

  // ModelCollection should have public serializer property (readonly, optional)
  expectTypeOf(users).toHaveProperty('serializer');

  // When serializer exists, it should have serializeCollection and serializeCollectionAttrs methods
  if (users.serializer) {
    expectTypeOf(users.serializer.serializeCollection).toBeFunction();
    expectTypeOf(users.serializer.serializeCollectionAttrs).toBeFunction();
    expectTypeOf(users.serializer.serializeCollectionModels).toBeFunction();
  }
});

// -- TYPED WITH OPTION --

test('WithOption should infer relationship names from schema', () => {
  type UserAttrs = { id: string; name: string; postIds: string[] };
  type PostAttrs = { id: string; title: string; content: string };

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .create();

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  // Define relationships type for user
  type UserRelationships = {
    posts: HasMany<typeof postModel, 'postIds'>;
  };

  // WithOption should accept relationship names as keys
  type UserWithOption = WithOption<UserRelationships>;

  // Valid: 'posts' is a relationship name
  const withArray: UserWithOption = ['posts'];
  expectTypeOf(withArray).toMatchTypeOf<UserWithOption>();

  const withObject: UserWithOption = { posts: true };
  expectTypeOf(withObject).toMatchTypeOf<UserWithOption>();

  const withNestedOptions: UserWithOption = {
    posts: { select: ['id', 'title'] },
  };
  expectTypeOf(withNestedOptions).toMatchTypeOf<UserWithOption>();
});

test('WithOption should infer target model attributes for nested select', () => {
  type UserAttrs = { id: string; name: string; email: string };
  type PostAttrs = {
    id: string;
    title: string;
    content: string;
    authorId: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .create();

  // Define relationships type for user
  type UserRelationships = {
    posts: HasMany<typeof postModel, 'postIds'>;
  };

  type UserWithOption = WithOption<UserRelationships>;

  // Nested select should accept Post attributes
  const withNestedSelect: UserWithOption = {
    posts: { select: ['id', 'title', 'content', 'authorId'] },
  };
  expectTypeOf(withNestedSelect).toMatchTypeOf<UserWithOption>();
});

test('NestedSerializerOptions should type select based on target model', () => {
  type PostAttrs = {
    id: string;
    title: string;
    content: string;
    published: boolean;
  };

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .create();

  // NestedSerializerOptions for Post model
  type PostNestedOptions = NestedSerializerOptions<typeof postModel>;

  // Array format select
  const arraySelect: PostNestedOptions = {
    select: ['id', 'title'],
  };
  expectTypeOf(arraySelect).toMatchTypeOf<PostNestedOptions>();

  // Object format select
  const objectSelect: PostNestedOptions = {
    select: { content: false, published: false },
  };
  expectTypeOf(objectSelect).toMatchTypeOf<PostNestedOptions>();
});

test('SerializerConfig with should infer relationships from schema', () => {
  type UserAttrs = { id: string; name: string; postIds: string[] };
  type PostAttrs = { id: string; title: string; authorId: string };

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .create();

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  const userCollection = collection()
    .model(userModel)
    .relationships({
      posts: relations.hasMany(postModel),
    })
    .serializer({
      with: {
        // This should suggest Post attributes for select
        posts: { select: ['id', 'title'] },
      },
      relationsMode: 'embedded',
    })
    .create();

  const postCollection = collection()
    .model(postModel)
    .relationships({
      author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
    })
    .create();

  const testSchema = schema()
    .collections({
      users: userCollection,
      posts: postCollection,
    })
    .setup();

  // The schema should be set up correctly with typed serializer
  expectTypeOf(testSchema.users.serializer).not.toBeUndefined();
});

// -- SELECT OPTION FORMATS --

test('SelectOption should accept array format', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
    password: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  // Array format: include only specified attributes - should type check
  const options: SerializerConfig<typeof userModel> = {
    select: ['id', 'name', 'email'],
  };

  expectTypeOf(options).toEqualTypeOf<SerializerConfig<typeof userModel>>();
});

test('SelectOption should accept object exclusion format', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
    password: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  // Object exclusion format: all false values - should type check
  const options: SerializerConfig<typeof userModel> = {
    select: { password: false },
  };

  expectTypeOf(options).toEqualTypeOf<SerializerConfig<typeof userModel>>();
});

test('SelectOption should accept object inclusion format', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
    password: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  // Object inclusion format: include only true keys - should type check
  const options: SerializerConfig<typeof userModel> = {
    select: { id: true, name: true },
  };

  expectTypeOf(options).toEqualTypeOf<SerializerConfig<typeof userModel>>();
});

test('SelectOption should accept mixed object format', () => {
  type UserAttrs = {
    id: string;
    name: string;
    email: string;
    password: string;
  };

  const userModel = model()
    .name('user')
    .collection('users')
    .attrs<UserAttrs>()
    .create();

  // Mixed format: include true keys, exclude false keys - should type check
  const options: SerializerConfig<typeof userModel> = {
    select: { id: true, name: true, password: false },
  };

  expectTypeOf(options).toEqualTypeOf<SerializerConfig<typeof userModel>>();
});

// -- WITH OPTION FORMATS --

test('WithOption should accept array format', () => {
  type UserRelationships = {
    posts: HasMany<any, 'postIds'>;
    profile: BelongsTo<any, 'profileId'>;
  };

  // Array format: include specified relationships
  const withArray: WithOption<UserRelationships> = ['posts', 'profile'];
  expectTypeOf(withArray).toMatchTypeOf<WithOption<UserRelationships>>();
});

test('WithOption should accept object with boolean values', () => {
  type UserRelationships = {
    posts: HasMany<any, 'postIds'>;
    profile: BelongsTo<any, 'profileId'>;
  };

  // Object format with boolean values
  const withBooleans: WithOption<UserRelationships> = {
    posts: true,
    profile: false,
  };
  expectTypeOf(withBooleans).toMatchTypeOf<WithOption<UserRelationships>>();
});

test('WithOption should accept object with nested options', () => {
  type PostAttrs = { id: string; title: string; content: string };

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .create();

  type UserRelationships = {
    posts: HasMany<typeof postModel, 'postIds'>;
  };

  // Object format with nested serializer options
  const withNested: WithOption<UserRelationships> = {
    posts: {
      select: ['id', 'title'],
      mode: 'embedded',
    },
  };
  expectTypeOf(withNested).toMatchTypeOf<WithOption<UserRelationships>>();
});

test('WithOption should accept mixed object values', () => {
  type PostAttrs = { id: string; title: string };
  type ProfileAttrs = { id: string; bio: string };

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .create();

  const profileModel = model()
    .name('profile')
    .collection('profiles')
    .attrs<ProfileAttrs>()
    .create();

  type UserRelationships = {
    posts: HasMany<typeof postModel, 'postIds'>;
    profile: BelongsTo<typeof profileModel, 'profileId'>;
  };

  // Mixed: boolean and nested options
  const withMixed: WithOption<UserRelationships> = {
    posts: { select: ['id', 'title'] },
    profile: true,
  };
  expectTypeOf(withMixed).toMatchTypeOf<WithOption<UserRelationships>>();
});

test('WithOption nested options should support mode override', () => {
  type PostAttrs = { id: string; title: string; content: string };

  const postModel = model()
    .name('post')
    .collection('posts')
    .attrs<PostAttrs>()
    .create();

  type UserRelationships = {
    posts: HasMany<typeof postModel, 'postIds'>;
  };

  // Nested options with mode override
  const withModeOverride: WithOption<UserRelationships> = {
    posts: {
      select: ['id', 'title'],
      mode: 'sideLoaded',
      with: { author: true },
    },
  };
  expectTypeOf(withModeOverride).toMatchTypeOf<WithOption<UserRelationships>>();
});
