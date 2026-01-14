import type { BelongsTo } from '@src/associations';
import { model, type ModelCreateAttrs } from '@src/model';
import type {
  CollectionConfig,
  FixtureAttrs,
  FixtureConfig,
  FixtureLoadStrategy,
  SchemaCollections,
  SchemaConfig,
  SeedFunction,
  Seeds,
  SeedScenarios,
} from '@src/schema';
import type { SchemaInstance } from '@src/schema/Schema';
import { Serializer } from '@src/serializer';
import { expectTypeOf, test } from 'vitest';

// Test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
}

interface PostAttrs {
  id: number;
  title: string;
  content: string;
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

// Test serializer
const userSerializer = new Serializer(userModel);

test('SchemaCollections should work with basic collections map', () => {
  type AppCollections = {
    users: CollectionConfig<typeof userModel>;
    posts: CollectionConfig<typeof postModel>;
  };

  const collections: SchemaCollections = {} as AppCollections;
  expectTypeOf(collections).toBeObject();
});

test('SchemaConfig should work with logging configuration', () => {
  const config: SchemaConfig = {
    logging: {
      enabled: true,
      level: 'info',
      prefix: '[ORM]',
    },
  };

  expectTypeOf(config).toEqualTypeOf<SchemaConfig>();
});

test('SchemaConfig should work with empty config', () => {
  const config: SchemaConfig = {};

  expectTypeOf(config).toEqualTypeOf<SchemaConfig>();
});

test('CollectionConfig should work with minimal configuration', () => {
  const config: CollectionConfig<typeof userModel> = {
    model: userModel,
  };

  expectTypeOf(config).toEqualTypeOf<CollectionConfig<typeof userModel>>();
});

test('CollectionConfig should work with serializer config', () => {
  const config: CollectionConfig<typeof userModel> = {
    model: userModel,
    serializer: {
      select: ['id', 'name', 'email'],
    },
  };

  expectTypeOf(config).toEqualTypeOf<CollectionConfig<typeof userModel>>();
});

test('CollectionConfig should work with fixtures', () => {
  const config: CollectionConfig<typeof userModel> = {
    model: userModel,
    fixtures: {
      records: [
        { name: 'John', email: 'john@example.com' } as any,
        { name: 'Jane', email: 'jane@example.com' } as any,
      ],
      strategy: 'auto',
    },
  };

  expectTypeOf(config).toEqualTypeOf<CollectionConfig<typeof userModel>>();
});

test('ModelCreateAttrs should work for basic attributes', () => {
  const attrs: ModelCreateAttrs<typeof userModel> = {
    name: 'John',
    email: 'john@example.com',
  };

  // Type is verified by the successful assignment above
  expectTypeOf(attrs).toBeObject();
});

test('ModelCreateAttrs should work with relationships', () => {
  type TestCollections = {
    users: CollectionConfig<typeof userModel>;
    posts: CollectionConfig<typeof postModel>;
  };

  const attrs: ModelCreateAttrs<
    typeof postModel,
    TestCollections,
    { author: BelongsTo<typeof userModel, 'authorId'> }
  > = {
    title: 'Post',
    content: 'Content',
  } as any;

  expectTypeOf(attrs).toEqualTypeOf<
    ModelCreateAttrs<
      typeof postModel,
      TestCollections,
      { author: BelongsTo<typeof userModel, 'authorId'> }
    >
  >();
});

test('SeedFunction should work correctly', () => {
  type AppCollections = {
    users: CollectionConfig<typeof userModel>;
    posts: CollectionConfig<typeof postModel>;
  };

  const seedFn: SeedFunction<AppCollections> = async (schema) => {
    const user = schema.users;
    const posts = schema.posts;
  };

  expectTypeOf(seedFn).toEqualTypeOf<SeedFunction<AppCollections>>();
});

test('SeedScenarios should work with multiple scenarios', () => {
  type AppCollections = {
    users: CollectionConfig<typeof userModel>;
  };

  const scenarios: SeedScenarios<AppCollections> = {
    development: async (schema) => {
      await schema.users;
    },
    production: async (schema) => {
      await schema.users;
    },
  };

  expectTypeOf(scenarios).toEqualTypeOf<SeedScenarios<AppCollections>>();
});

test('Seeds should accept a function', () => {
  type AppCollections = {
    users: CollectionConfig<typeof userModel>;
  };

  const seedFn: SeedFunction<AppCollections> = async (schema) => {
    await schema.users;
  };

  const seeds: Seeds<AppCollections> = seedFn;
  expectTypeOf(seeds).toBeFunction();
});

test('FixtureAttrs should work for basic attributes', () => {
  const attrs: FixtureAttrs<typeof userModel> = {
    name: 'John',
    email: 'john@example.com',
  } as any;

  expectTypeOf(attrs).toEqualTypeOf<FixtureAttrs<typeof userModel>>();
});

test('FixtureConfig should work with records and strategy', () => {
  const fixtures: FixtureConfig<typeof userModel> = {
    records: [
      { name: 'John', email: 'john@example.com' } as any,
      { name: 'Jane', email: 'jane@example.com' } as any,
    ],
    strategy: 'manual',
  };

  expectTypeOf(fixtures).toEqualTypeOf<FixtureConfig<typeof userModel>>();
});

test('FixtureLoadStrategy should accept valid strategies', () => {
  expectTypeOf<FixtureLoadStrategy>().toEqualTypeOf<'auto' | 'manual'>();

  const strategy1: FixtureLoadStrategy = 'auto';
  const strategy2: FixtureLoadStrategy = 'manual';
  expectTypeOf(strategy1).toBeString();
  expectTypeOf(strategy2).toBeString();
});

test('SchemaInstance should work with collections', () => {
  type AppCollections = {
    users: CollectionConfig<typeof userModel>;
    posts: CollectionConfig<typeof postModel>;
  };

  type AppSchema = SchemaInstance<AppCollections>;
  const schema = {} as AppSchema;

  expectTypeOf(schema).toEqualTypeOf<AppSchema>();
});
