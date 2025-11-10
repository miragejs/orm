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

// Test model types
type UserModel = typeof userModel;
type PostModel = typeof postModel;

// Test schema type
type TestSchema = {
  users: CollectionConfig<UserModel>;
  posts: CollectionConfig<PostModel>;
};

test('FactoryAttrs should work with basic attribute functions', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John Doe',
    email: () => 'john@example.com',
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('FactoryAttrs should work with this context', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John Doe',
    email: function (this: any, id: string) {
      return `user${id}@example.com`;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('FactoryAttrs should work with optional attributes', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John',
    role: () => 'user',
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('TraitDefinition should work with attributes only', () => {
  const trait: TraitDefinition<UserModel, TestSchema> = {
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
  };

  expectTypeOf(trait).toEqualTypeOf<TraitDefinition<UserModel, TestSchema>>();
});

test('TraitDefinition should work with afterCreate hook', () => {
  const trait: TraitDefinition<UserModel, TestSchema> = {
    role: 'admin',
    afterCreate: (model: any, schema: SchemaInstance<TestSchema>) => {
      const user = schema.users;
    },
  };

  expectTypeOf(trait).toEqualTypeOf<TraitDefinition<UserModel, TestSchema>>();
});

test('TraitDefinition should work with attribute functions', () => {
  const trait: TraitDefinition<UserModel, TestSchema> = {
    name: () => 'Trait Name',
    email: (id: string) => `trait${id}@example.com`,
  };

  expectTypeOf(trait).toEqualTypeOf<TraitDefinition<UserModel, TestSchema>>();
});

test('ModelTraits should work with multiple traits', () => {
  const traits: ModelTraits<'admin' | 'moderator' | 'guest', UserModel, TestSchema> = {
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

  expectTypeOf(traits).toEqualTypeOf<
    ModelTraits<'admin' | 'moderator' | 'guest', UserModel, TestSchema>
  >();
});

test('ModelTraits should work with afterCreate hooks', () => {
  const traits: ModelTraits<'admin' | 'verified', UserModel, TestSchema> = {
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

  expectTypeOf(traits).toEqualTypeOf<ModelTraits<'admin' | 'verified', UserModel, TestSchema>>();
});

test('FactoryAfterCreateHook should work as standalone', () => {
  const hook: FactoryAfterCreateHook<TestSchema, UserModel> = (
    model: any,
    schema: SchemaInstance<TestSchema>,
  ) => {
    console.log('Created user:', model.id);
    const name = model.name;
    const email = model.email;
  };

  expectTypeOf(hook).toEqualTypeOf<FactoryAfterCreateHook<TestSchema, UserModel>>();
});

test('FactoryAfterCreateHook should work with async', () => {
  const hook: FactoryAfterCreateHook<TestSchema, UserModel> = async (
    model: any,
    schema: SchemaInstance<TestSchema>,
  ) => {
    await Promise.resolve();
    console.log('User:', model.id);
  };

  expectTypeOf(hook).toEqualTypeOf<FactoryAfterCreateHook<TestSchema, UserModel>>();
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
  const partialTrait: TraitDefinition<UserModel, TestSchema> = {
    name: () => 'Partial',
  };

  expectTypeOf(partialTrait).toEqualTypeOf<TraitDefinition<UserModel, TestSchema>>();
});
