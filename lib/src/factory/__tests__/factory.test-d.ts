/**
 * Type tests for Factory using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import { model } from '@src/model';
import type { CollectionConfig } from '@src/schema';
import type { SchemaInstance } from '@src/schema/Schema';
import { expectTypeOf, test } from 'vitest';

import type {
  FactoryAfterCreateHook,
  FactoryAttrs,
  ModelTraits,
  TraitDefinition,
  TraitName,
} from '../types';

// Test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

interface PostAttrs {
  id: number;
  title: string;
  content: string;
  published?: boolean;
}

// Test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

// Test schema type
type TestSchema = {
  users: CollectionConfig<typeof userModel>;
  posts: CollectionConfig<typeof postModel>;
};

test('FactoryAttrs should work with basic attribute functions', () => {
  const attrs: FactoryAttrs<typeof userModel> = {
    name: () => 'John Doe',
    email: () => 'john@example.com',
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<typeof userModel>>();
});

test('FactoryAttrs should work with this context', () => {
  const attrs: FactoryAttrs<typeof userModel> = {
    name: () => 'John Doe',
    email: function (this: any, id: string) {
      return `user${id}@example.com`;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<typeof userModel>>();
});

test('FactoryAttrs should work with optional attributes', () => {
  const attrs: FactoryAttrs<typeof userModel> = {
    name: () => 'John',
    role: () => 'user',
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<typeof userModel>>();
});

test('TraitDefinition should work with attributes only', () => {
  const trait: TraitDefinition<TestSchema, typeof userModel> = {
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
  };

  expectTypeOf(trait).toEqualTypeOf<TraitDefinition<TestSchema, typeof userModel>>();
});

test('TraitDefinition should work with afterCreate hook', () => {
  const trait: TraitDefinition<TestSchema, typeof userModel> = {
    role: 'admin',
    afterCreate: (model: any, schema: SchemaInstance<TestSchema>) => {
      const user = schema.users;
    },
  };

  expectTypeOf(trait).toEqualTypeOf<TraitDefinition<TestSchema, typeof userModel>>();
});

test('TraitDefinition should work with attribute functions', () => {
  const trait: TraitDefinition<TestSchema, typeof userModel> = {
    name: () => 'Trait Name',
    email: (id: string) => `trait${id}@example.com`,
  };

  expectTypeOf(trait).toEqualTypeOf<TraitDefinition<TestSchema, typeof userModel>>();
});

test('ModelTraits should work with multiple traits', () => {
  const traits: ModelTraits<TestSchema, typeof userModel> = {
    admin: {
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
    },
    moderator: {
      role: 'moderator',
      permissions: ['read', 'write'],
    },
    guest: {
      role: 'guest',
    },
  };

  expectTypeOf(traits).toEqualTypeOf<ModelTraits<TestSchema, typeof userModel>>();
});

test('ModelTraits should work with afterCreate hooks', () => {
  const traits: ModelTraits<TestSchema, typeof userModel> = {
    admin: {
      role: 'admin',
      afterCreate: (model: any, schema: SchemaInstance<TestSchema>) => {
        console.log('Created admin:', model.id);
      },
    },
    verified: {
      email: () => 'verified@example.com',
      afterCreate: (model: any, schema: SchemaInstance<TestSchema>) => {
        // Send verification email
      },
    },
  };

  expectTypeOf(traits).toEqualTypeOf<ModelTraits<TestSchema, typeof userModel>>();
});

test('FactoryAfterCreateHook should work as standalone', () => {
  const hook: FactoryAfterCreateHook<TestSchema, typeof userModel> = (
    model: any,
    schema: SchemaInstance<TestSchema>,
  ) => {
    console.log('Created user:', model.id);
    const name = model.name;
    const email = model.email;
  };

  expectTypeOf(hook).toEqualTypeOf<FactoryAfterCreateHook<TestSchema, typeof userModel>>();
});

test('FactoryAfterCreateHook should work with async', () => {
  const hook: FactoryAfterCreateHook<TestSchema, typeof userModel> = async (
    model: any,
    schema: SchemaInstance<TestSchema>,
  ) => {
    await Promise.resolve();
    console.log('User:', model.id);
  };

  expectTypeOf(hook).toEqualTypeOf<FactoryAfterCreateHook<TestSchema, typeof userModel>>();
});

test('TraitName should extract trait names correctly', () => {
  type UserTraitsObj = {
    admin: { role: string };
    moderator: { role: string };
    guest: { role: string };
  };

  type Names = TraitName<UserTraitsObj>;

  expectTypeOf<Names>().toEqualTypeOf<'admin' | 'moderator' | 'guest'>();

  // Test assignability
  const traitName: Names = 'admin' as const;
  expectTypeOf(traitName).toBeString();
});

test('TraitDefinition should allow partial attributes', () => {
  const partialTrait: TraitDefinition<TestSchema, typeof userModel> = {
    name: () => 'Partial',
  };

  expectTypeOf(partialTrait).toEqualTypeOf<TraitDefinition<TestSchema, typeof userModel>>();
});
