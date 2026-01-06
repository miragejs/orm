/**
 * Type tests for Model using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import type { BelongsTo, HasMany } from '@src/associations';
import type {
  CollectionNameFor,
  ModelAttrsFor,
  ModelNameFor,
  SerializedCollectionFor,
  SerializedModelFor,
  ModelAttrs,
  ModelForeignKeys,
  ModelInstance,
  ModelTemplate,
  ModelUpdateAttrs,
  NewModelInstance,
  PartialModelAttrs,
} from '@src/model';
import { model, ModelCollection } from '@src/model';
import type { CollectionConfig, SchemaCollections } from '@src/schema';
import Serializer from '@src/serializer/Serializer';
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
const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .create();

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

test('ModelNameFor should extract model names correctly', () => {
  type UserName = ModelNameFor<typeof userModel>;
  const userName: UserName = 'user';
  expectTypeOf(userName).toEqualTypeOf<'user'>();

  type PostName = ModelNameFor<typeof postModel>;
  const postName: PostName = 'post';
  expectTypeOf(postName).toEqualTypeOf<'post'>();
});

test('CollectionNameFor should extract collection names correctly', () => {
  type UsersCollection = CollectionNameFor<typeof userModel>;
  const collection: UsersCollection = 'users';
  expectTypeOf(collection).toEqualTypeOf<'users'>();

  type PostsCollection = CollectionNameFor<typeof postModel>;
  const posts: PostsCollection = 'posts';
  expectTypeOf(posts).toEqualTypeOf<'posts'>();
});

test('ModelAttrsFor should infer attribute types correctly', () => {
  const attrs: ModelAttrsFor<typeof userModel> = {
    id: '1',
    name: 'John',
    email: 'john@example.com',
    age: 30,
  };

  expectTypeOf(attrs).toEqualTypeOf<ModelAttrsFor<typeof userModel>>();
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

  expectTypeOf(attrs).toEqualTypeOf<
    ModelAttrs<typeof postModel, TestSchema, PostRelationships>
  >();
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

// ============================================================================
// SERIALIZER GENERIC DEFAULTS TESTS
// ============================================================================

test('ModelInstance should default to Serializer<TTemplate, SchemaCollections>', () => {
  type UserInstance = ModelInstance<typeof userModel>;

  // Should default to Serializer<userModel, SchemaCollections>
  expectTypeOf<UserInstance['serializer']>().toEqualTypeOf<
    | Serializer<
        typeof userModel,
        SchemaCollections,
        SerializedModelFor<typeof userModel>,
        SerializedCollectionFor<typeof userModel>
      >
    | undefined
  >();
});

test('ModelInstance serializer type is inferred from template', () => {
  type UserInstance = ModelInstance<typeof userModel, TestSchema>;

  // Serializer type should be inferred from the template and schema
  type ExpectedSerializer = Serializer<
    typeof userModel,
    TestSchema,
    SerializedModelFor<typeof userModel>,
    SerializedCollectionFor<typeof userModel>
  >;

  expectTypeOf<UserInstance['serializer']>().toEqualTypeOf<
    ExpectedSerializer | undefined
  >();
});

test('NewModelInstance should default to Serializer<TTemplate, SchemaCollections>', () => {
  type NewUser = NewModelInstance<typeof userModel>;

  // Should default to Serializer<userModel, SchemaCollections>
  expectTypeOf<NewUser['serializer']>().toEqualTypeOf<
    | Serializer<
        typeof userModel,
        SchemaCollections,
        SerializedModelFor<typeof userModel>,
        SerializedCollectionFor<typeof userModel>
      >
    | undefined
  >();
});

test('NewModelInstance serializer type is inferred from template', () => {
  type NewUser = NewModelInstance<typeof userModel, TestSchema>;

  // Serializer type should be inferred from the template and schema
  type ExpectedSerializer = Serializer<
    typeof userModel,
    TestSchema,
    SerializedModelFor<typeof userModel>,
    SerializedCollectionFor<typeof userModel>
  >;

  expectTypeOf<NewUser['serializer']>().toEqualTypeOf<
    ExpectedSerializer | undefined
  >();
});

test('ModelInstance toJSON should infer correct return type with default serializer', () => {
  type UserInstance = ModelInstance<typeof userModel>;

  // toJSON should return UserAttrs by default
  expectTypeOf<ReturnType<UserInstance['toJSON']>>().toEqualTypeOf<UserAttrs>();
});

test('ModelInstance toJSON infers correct return type from template', () => {
  type UserInstance = ModelInstance<typeof userModel, TestSchema>;

  // toJSON should return SerializedModelFor<TTemplate>
  expectTypeOf<ReturnType<UserInstance['toJSON']>>().toEqualTypeOf<
    SerializedModelFor<typeof userModel>
  >();
});

test('ModelInstance toJSON returns SerializedModelFor<TTemplate>', () => {
  type UserInstance = ModelInstance<typeof userModel, TestSchema>;

  // toJSON should return SerializedModelFor<TTemplate>
  expectTypeOf<ReturnType<UserInstance['toJSON']>>().toEqualTypeOf<
    SerializedModelFor<typeof userModel>
  >();
});

test('ModelInstance with same template and schema have same serializer type', () => {
  // These should all be compatible - serializer type is inferred from template and schema
  type Instance1 = ModelInstance<typeof userModel, TestSchema>;
  type Instance2 = ModelInstance<typeof userModel, TestSchema>;

  // Both use the same template and schema, so they have the same serializer type
  expectTypeOf<Instance1['_serializer']>().toEqualTypeOf<
    Instance2['_serializer']
  >();

  // Both should have the same attrs
  expectTypeOf<Instance1['attrs']>().toMatchTypeOf<Instance2['attrs']>();
});

test('Serializer type is correctly inferred for different templates', () => {
  type UserInstance = ModelInstance<typeof userModel, TestSchema>;
  type PostInstance = ModelInstance<typeof postModel, TestSchema>;

  // Verify toJSON returns the correct inferred types from templates
  expectTypeOf<ReturnType<UserInstance['toJSON']>>().toEqualTypeOf<
    SerializedModelFor<typeof userModel>
  >();
  expectTypeOf<ReturnType<PostInstance['toJSON']>>().toEqualTypeOf<
    SerializedModelFor<typeof postModel>
  >();
});

// ============================================================================
// MODEL COLLECTION SERIALIZER GENERIC TESTS
// ============================================================================

test('ModelCollection should default to Serializer<TTemplate, TSchema>', () => {
  type UsersCollection = ModelCollection<typeof userModel, TestSchema>;

  // Should default to Serializer<userModel, TestSchema>
  expectTypeOf<UsersCollection['serializer']>().toEqualTypeOf<
    | Serializer<
        typeof userModel,
        TestSchema,
        SerializedModelFor<typeof userModel>,
        SerializedCollectionFor<typeof userModel>
      >
    | undefined
  >();
});

test('ModelCollection serializer type is inferred from template', () => {
  type UsersCollection = ModelCollection<typeof userModel, TestSchema>;

  // Serializer type should be inferred from the template and schema
  type ExpectedSerializer = Serializer<
    typeof userModel,
    TestSchema,
    SerializedModelFor<typeof userModel>,
    SerializedCollectionFor<typeof userModel>
  >;

  expectTypeOf<UsersCollection['serializer']>().toEqualTypeOf<
    ExpectedSerializer | undefined
  >();
});

test('ModelCollection toJSON returns SerializedCollectionFor<TTemplate>', () => {
  type UsersCollection = ModelCollection<typeof userModel, TestSchema>;

  // toJSON should return SerializedCollectionFor<TTemplate>
  expectTypeOf<ReturnType<UsersCollection['toJSON']>>().toEqualTypeOf<
    SerializedCollectionFor<typeof userModel>
  >();
});

test('ModelCollection toJSON returns collection type inferred from template', () => {
  type PostsCollection = ModelCollection<typeof postModel, TestSchema>;

  // Collection toJSON should return SerializedCollectionFor<TTemplate>
  expectTypeOf<ReturnType<PostsCollection['toJSON']>>().toEqualTypeOf<
    SerializedCollectionFor<typeof postModel>
  >();
});

test('ModelCollection from relationship accessor uses target collection serializer', () => {
  // When accessing user.posts, the collection should use the post template's serializer
  type PostsCollection = ModelCollection<typeof postModel, TestSchema>;

  // toJSON should return SerializedCollectionFor<postModel>
  expectTypeOf<ReturnType<PostsCollection['toJSON']>>().toEqualTypeOf<
    SerializedCollectionFor<typeof postModel>
  >();
});
