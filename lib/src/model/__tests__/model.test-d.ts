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
  ModelInstance,
  ModelTemplate,
  ModelUpdateAttrs,
  NewModelInstance,
  PartialModelAttrs,
} from '@src/model';
import { model, ModelCollection } from '@src/model';
import type { CollectionConfig } from '@src/schema';
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

// ============================================================================
// SERIALIZER GENERIC DEFAULTS TESTS
// ============================================================================

test('ModelInstance should default to Serializer<TTemplate>', () => {
  type UserInstance = ModelInstance<typeof userModel>;

  // Should default to Serializer<userModel>
  expectTypeOf<UserInstance['_serializer']>().toEqualTypeOf<
    Serializer<typeof userModel> | undefined
  >();
});

test('ModelInstance should accept custom serializer type', () => {
  interface UserJSON {
    id: string;
    name: string;
    email: string;
  }

  type CustomSerializer = Serializer<typeof userModel, UserJSON>;
  type UserInstanceWithSerializer = ModelInstance<typeof userModel, TestSchema, CustomSerializer>;

  // Should use the custom serializer type
  expectTypeOf<UserInstanceWithSerializer['_serializer']>().toEqualTypeOf<
    CustomSerializer | undefined
  >();
});

test('ModelInstance should work with undefined serializer explicitly', () => {
  type UserInstanceNoSerializer = ModelInstance<typeof userModel, TestSchema, undefined>;

  // Should be undefined
  expectTypeOf<UserInstanceNoSerializer['_serializer']>().toEqualTypeOf<undefined>();
});

test('NewModelInstance should default to Serializer<TTemplate>', () => {
  type NewUser = NewModelInstance<typeof userModel>;

  // Should default to Serializer<userModel>
  expectTypeOf<NewUser['_serializer']>().toEqualTypeOf<Serializer<typeof userModel> | undefined>();
});

test('NewModelInstance should accept custom serializer type', () => {
  interface UserJSON {
    id: string;
    name: string;
  }

  type CustomSerializer = Serializer<typeof userModel, UserJSON>;
  type NewUserWithSerializer = NewModelInstance<typeof userModel, TestSchema, CustomSerializer>;

  // Should use the custom serializer type
  expectTypeOf<NewUserWithSerializer['_serializer']>().toEqualTypeOf<
    CustomSerializer | undefined
  >();
});

test('ModelInstance toJSON should infer correct return type with default serializer', () => {
  type UserInstance = ModelInstance<typeof userModel>;

  // toJSON should return UserAttrs by default
  expectTypeOf<ReturnType<UserInstance['toJSON']>>().toEqualTypeOf<UserAttrs>();
});

test('ModelInstance toJSON should infer correct return type with custom serializer', () => {
  interface UserJSON {
    id: string;
    name: string;
    email: string;
  }

  type CustomSerializer = Serializer<typeof userModel, UserJSON>;
  type UserInstanceWithSerializer = ModelInstance<typeof userModel, TestSchema, CustomSerializer>;

  // toJSON should return UserJSON with custom serializer
  expectTypeOf<ReturnType<UserInstanceWithSerializer['toJSON']>>().toEqualTypeOf<UserJSON>();
});

test('ModelInstance toJSON should work with root-wrapped custom serializer', () => {
  interface UserJSON {
    id: string;
    name: string;
  }

  interface UserRootJSON {
    user: UserJSON;
  }

  type CustomSerializer = Serializer<typeof userModel, UserRootJSON>;
  type UserInstanceWithSerializer = ModelInstance<typeof userModel, TestSchema, CustomSerializer>;

  // toJSON should return UserRootJSON with root wrapping
  expectTypeOf<ReturnType<UserInstanceWithSerializer['toJSON']>>().toEqualTypeOf<UserRootJSON>();
});

test('Serializer generic should not conflict with default when undefined', () => {
  // These should all be compatible
  type Instance1 = ModelInstance<typeof userModel>;
  type Instance2 = ModelInstance<typeof userModel, TestSchema>;
  type Instance3 = ModelInstance<typeof userModel, TestSchema, Serializer<typeof userModel>>;
  type Instance4 = ModelInstance<typeof userModel, TestSchema, undefined>;

  // Both use default serializer, so they have the same serializer type
  expectTypeOf<Instance1['_serializer']>().toEqualTypeOf<Instance2['_serializer']>();

  // Instance3 should have compatible attrs with Instance1 (both have same attrs)
  expectTypeOf<Instance3['attrs']>().toMatchTypeOf<Instance1['attrs']>();

  // Instance4 is explicitly undefined, different from default
  expectTypeOf<Instance4['_serializer']>().toEqualTypeOf<undefined>();
});

test('Custom serializer should work through relationship accessors', () => {
  interface UserJSON {
    id: string;
    name: string;
  }

  interface PostJSON {
    id: number;
    title: string;
  }

  type UserSerializer = Serializer<typeof userModel, UserJSON>;
  type PostSerializer = Serializer<typeof postModel, PostJSON>;

  type UserInstance = ModelInstance<typeof userModel, TestSchema, UserSerializer>;
  type PostInstance = ModelInstance<typeof postModel, TestSchema, PostSerializer>;

  // Verify toJSON returns the correct custom types
  expectTypeOf<ReturnType<UserInstance['toJSON']>>().toEqualTypeOf<UserJSON>();
  expectTypeOf<ReturnType<PostInstance['toJSON']>>().toEqualTypeOf<PostJSON>();
});

test('ModelInstance should preserve serializer type through schema collections', () => {
  interface UserJSON {
    id: string;
    name: string;
    email: string;
  }

  type UserSerializer = Serializer<typeof userModel, UserJSON>;
  type UserInstance = ModelInstance<typeof userModel, TestSchema, UserSerializer>;

  // The serializer type should be preserved
  expectTypeOf<UserInstance['_serializer']>().toEqualTypeOf<UserSerializer | undefined>();

  // And toJSON should return the custom type
  expectTypeOf<ReturnType<UserInstance['toJSON']>>().toEqualTypeOf<UserJSON>();
});

// ============================================================================
// MODEL COLLECTION SERIALIZER GENERIC TESTS
// ============================================================================

test('ModelCollection should default to Serializer<TTemplate>', () => {
  type UsersCollection = ModelCollection<typeof userModel, TestSchema>;

  // Should default to Serializer<userModel>
  expectTypeOf<UsersCollection['_serializer']>().toEqualTypeOf<
    Serializer<typeof userModel> | undefined
  >();
});

test('ModelCollection should accept custom serializer type', () => {
  interface UserJSON {
    id: string;
    name: string;
    email: string;
  }

  interface UsersJSON {
    users: UserJSON[];
  }

  type CustomSerializer = Serializer<typeof userModel, UserJSON, UsersJSON>;
  type UsersCollectionWithSerializer = ModelCollection<
    typeof userModel,
    TestSchema,
    CustomSerializer
  >;

  // Should use the custom serializer type
  expectTypeOf<UsersCollectionWithSerializer['_serializer']>().toEqualTypeOf<
    CustomSerializer | undefined
  >();
});

test('ModelCollection toJSON should infer correct return type with default serializer', () => {
  type UsersCollection = ModelCollection<typeof userModel, TestSchema>;

  // toJSON should return UserAttrs[] by default
  expectTypeOf<ReturnType<UsersCollection['toJSON']>>().toEqualTypeOf<UserAttrs[]>();
});

test('ModelCollection toJSON should infer correct return type with custom serializer', () => {
  interface UserJSON {
    id: string;
    name: string;
    email: string;
  }

  interface UsersJSON {
    users: UserJSON[];
  }

  type CustomSerializer = Serializer<typeof userModel, UserJSON, UsersJSON>;
  type UsersCollectionWithSerializer = ModelCollection<
    typeof userModel,
    TestSchema,
    CustomSerializer
  >;

  // toJSON should return UsersJSON with custom collection serializer
  expectTypeOf<ReturnType<UsersCollectionWithSerializer['toJSON']>>().toEqualTypeOf<UsersJSON>();
});

test('ModelCollection should work with different model and collection serialized types', () => {
  interface PostJSON {
    id: number;
    title: string;
  }

  interface PostsJSON {
    posts: PostJSON[];
  }

  type PostSerializer = Serializer<typeof postModel, PostJSON, PostsJSON>;
  type PostsCollection = ModelCollection<typeof postModel, TestSchema, PostSerializer>;

  // Collection toJSON should return PostsJSON (collection type)
  expectTypeOf<ReturnType<PostsCollection['toJSON']>>().toEqualTypeOf<PostsJSON>();
});

test('ModelCollection from relationship accessor should use target collection serializer', () => {
  interface PostJSON {
    id: number;
    title: string;
  }

  type PostSerializer = Serializer<typeof postModel, PostJSON>;

  // When accessing user.posts, the collection should have the post serializer
  type PostsCollection = ModelCollection<typeof postModel, TestSchema, PostSerializer>;

  // toJSON should return PostJSON[]
  expectTypeOf<ReturnType<PostsCollection['toJSON']>>().toEqualTypeOf<PostJSON[]>();
});
