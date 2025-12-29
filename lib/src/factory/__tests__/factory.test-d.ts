/**
 * Type tests for Factory using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import { model, ModelInstance } from '@src/model';
import type { CollectionConfig, SchemaInstance } from '@src/schema';
import { resolveFactoryAttr } from '@src/utils';
import { expectTypeOf, test } from 'vitest';

import type Factory from '../Factory';
import { factory } from '../FactoryBuilder';
import type {
  ExtractTraitsFromSchema,
  FactoryAfterCreateHook,
  FactoryAttrFunc,
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

test('FactoryAttrs should require all attributes based on model attributes interface', () => {
  // UserAttrs has: id, name, email, role?, permissions?
  // FactoryAttrs should require: name, email (required fields, excluding id)
  // and also allow: role, permissions (optional fields)
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John',
    email: () => 'john@example.com',
    role: () => 'user',
    permissions: () => ['read', 'write'],
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();

  // This should produce a type error - missing required 'email'
  // @ts-expect-error - Property 'email' is missing
  const _incompleteAttrs: FactoryAttrs<UserModel> = {
    name: () => 'John',
    role: () => 'user',
  };
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
    afterCreate: (
      _model: ModelInstance<UserModel, TestSchema>,
      _schema: SchemaInstance<TestSchema>,
    ) => {
      // Hook implementation - just verifying types
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
  const traits: ModelTraits<
    'admin' | 'moderator' | 'guest',
    UserModel,
    TestSchema
  > = {
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
      afterCreate: (
        model: ModelInstance<UserModel, TestSchema>,
        _schema: SchemaInstance<TestSchema>,
      ) => {
        console.log('Created admin:', model.id);
      },
    },
    verified: {
      email: () => 'verified@example.com',
      afterCreate: (
        _model: ModelInstance<UserModel, TestSchema>,
        _schema: SchemaInstance<TestSchema>,
      ) => {
        // Send verification email
      },
    },
  };

  expectTypeOf(traits).toEqualTypeOf<
    ModelTraits<'admin' | 'verified', UserModel, TestSchema>
  >();
});

test('FactoryAfterCreateHook should work as standalone', () => {
  const hook: FactoryAfterCreateHook<TestSchema, UserModel> = (
    model: ModelInstance<UserModel, TestSchema>,
    _schema: SchemaInstance<TestSchema>,
  ) => {
    console.log('Created user:', model.id);
    const name = model.name;
    const email = model.email;
  };

  expectTypeOf(hook).toEqualTypeOf<
    FactoryAfterCreateHook<TestSchema, UserModel>
  >();
});

test('FactoryAfterCreateHook should work with async', () => {
  const hook: FactoryAfterCreateHook<TestSchema, UserModel> = async (
    model: ModelInstance<UserModel, TestSchema>,
    _schema: SchemaInstance<TestSchema>,
  ) => {
    await Promise.resolve();
    console.log('User:', model.id);
  };

  expectTypeOf(hook).toEqualTypeOf<
    FactoryAfterCreateHook<TestSchema, UserModel>
  >();
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

  expectTypeOf(partialTrait).toEqualTypeOf<
    TraitDefinition<UserModel, TestSchema>
  >();
});

test('FactoryAttrs this context should allow calling other attribute functions', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John Doe',
    email: function (id: string) {
      // Should be able to call this.name as a function
      const name = typeof this.name === 'function' ? this.name(id) : this.name;
      return `${name}@example.com`.toLowerCase().replace(/\s+/g, '.');
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('FactoryAttrs this context should allow accessing static values', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: 'Static Name',
    email: function (id: string) {
      // Should be able to access this.name as a value
      const name = typeof this.name === 'function' ? this.name(id) : this.name;
      return `${name}${id}@example.com`;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('FactoryAttrs this context should handle mixed static and function attributes', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John',
    role: 'admin',
    email: function (id: string) {
      // Should handle both function and static attributes
      const name = typeof this.name === 'function' ? this.name(id) : this.name;
      const role = typeof this.role === 'function' ? this.role(id) : this.role;
      return `${name}.${role}@example.com`;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('FactoryAttrs this context should allow chaining attribute dependencies', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John Doe',
    email: function (id: string) {
      const name = typeof this.name === 'function' ? this.name(id) : this.name;
      return `${name}@example.com`.toLowerCase();
    },
    role: function (id: string) {
      // Should be able to reference email which references name
      const email =
        typeof this.email === 'function' ? this.email(id) : this.email;
      return email?.includes('admin') ? 'admin' : 'user';
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('FactoryAttrs this context should preserve type safety', () => {
  const attrs: FactoryAttrs<PostModel> = {
    title: () => 'Post Title',
    content: function (id: number) {
      // this.title is required, so resolved value is string (not string | undefined)
      const title =
        typeof this.title === 'function' ? this.title(id) : this.title;
      expectTypeOf(title).toEqualTypeOf<string>();
      return `Content for ${title}`;
    },
    published: function (id: number) {
      // this.published is optional, so resolved value is boolean | undefined
      const pub =
        typeof this.published === 'function'
          ? this.published(id)
          : this.published;
      expectTypeOf(pub).toEqualTypeOf<boolean | undefined>();
      return pub ?? false;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<PostModel>>();
});

test('FactoryAttrFunc should provide type safety for attribute functions', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John Doe',
    email: function (id: string) {
      // Using FactoryAttrFunc for type assertion
      const getName = this.name as FactoryAttrFunc<typeof this.name, string>;
      const name = typeof getName === 'function' ? getName(id) : getName;
      expectTypeOf(name).toEqualTypeOf<string>();
      return `${name}@example.com`;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('resolveFactoryAttr should resolve function attributes', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John Doe',
    email: function (id: string) {
      // Using resolveFactoryAttr helper
      const name = resolveFactoryAttr(this.name!, id);
      expectTypeOf(name).toEqualTypeOf<string>();
      return `${name}@example.com`;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('resolveFactoryAttr should resolve static values', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: 'Static Name',
    email: function (id: string) {
      // resolveFactoryAttr works with static values too
      const name = resolveFactoryAttr(this.name!, id);
      expectTypeOf(name).toEqualTypeOf<string>();
      return `${name}@example.com`;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

test('resolveFactoryAttr should work with complex attribute chains', () => {
  const attrs: FactoryAttrs<PostModel> = {
    title: () => 'Post Title',
    content: function (id: number) {
      const title = resolveFactoryAttr(this.title!, id);
      expectTypeOf(title).toEqualTypeOf<string>();
      return `Content for ${title}`;
    },
    published: function (id: number) {
      const content = resolveFactoryAttr(this.content!, id);
      expectTypeOf(content).toEqualTypeOf<string>();
      return content.length > 10;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<PostModel>>();
});

test('resolveFactoryAttr should work with required attributes only', () => {
  const attrs: FactoryAttrs<UserModel> = {
    name: () => 'John',
    email: () => 'john@example.com',
    role: function (id: string) {
      // Required attributes work directly with resolveFactoryAttr
      const name = resolveFactoryAttr(this.name!, id);
      const email = resolveFactoryAttr(this.email!, id);
      expectTypeOf(name).toEqualTypeOf<string>();
      expectTypeOf(email).toEqualTypeOf<string>();
      return `${name}:${email}`;
    },
  };

  expectTypeOf(attrs).toEqualTypeOf<FactoryAttrs<UserModel>>();
});

// ============================================================================
// ExtractTraitsFromSchema Tests
// ============================================================================

test('ExtractTraitsFromSchema should extract trait names from schema', () => {
  type SchemaWithTraits = {
    users: CollectionConfig<
      UserModel,
      {},
      Factory<UserModel, 'admin' | 'moderator' | 'guest'>
    >;
  };

  type ExtractedTraits = ExtractTraitsFromSchema<SchemaWithTraits, UserModel>;

  expectTypeOf<ExtractedTraits>().toEqualTypeOf<
    'admin' | 'moderator' | 'guest'
  >();
});

test('ExtractTraitsFromSchema should fallback to string when no traits defined', () => {
  type SchemaWithoutTraits = {
    users: CollectionConfig<UserModel>;
  };

  type ExtractedTraits = ExtractTraitsFromSchema<
    SchemaWithoutTraits,
    UserModel
  >;

  // Should be assignable to string (fallback type)
  expectTypeOf<ExtractedTraits>().toMatchTypeOf<string>();
  expectTypeOf<'custom'>().toMatchTypeOf<ExtractedTraits>();
});

test('ExtractTraitsFromSchema should fallback to string when model not in schema', () => {
  type SchemaWithoutModel = {
    posts: CollectionConfig<
      PostModel,
      {},
      Factory<PostModel, 'published' | 'draft'>
    >;
  };

  type ExtractedTraits = ExtractTraitsFromSchema<SchemaWithoutModel, UserModel>;

  // Should be assignable to string (fallback type)
  expectTypeOf<ExtractedTraits>().toMatchTypeOf<string>();
  expectTypeOf<'anyTrait'>().toMatchTypeOf<ExtractedTraits>();
});

// ============================================================================
// Factory Builder Trait Autocomplete Tests
// ============================================================================

test('FactoryBuilder.traits() should accept schema-defined traits', () => {
  type SchemaWithTraits = {
    users: CollectionConfig<
      UserModel,
      {},
      Factory<UserModel, 'admin' | 'premium'>
    >;
  };

  const builder = factory<SchemaWithTraits>().model(userModel);

  // Should accept schema-defined trait 'admin'
  const builderWithAdmin = builder.traits({
    admin: { role: 'admin' },
  });

  // Verify it returns a builder
  expectTypeOf(builderWithAdmin).toBeObject();
  expectTypeOf(builderWithAdmin.create).toBeFunction();

  // Should accept schema-defined trait 'premium'
  const builderWithPremium = builder.traits({
    premium: { role: 'premium' },
  });

  expectTypeOf(builderWithPremium).toBeObject();

  // Should accept multiple schema-defined traits
  const builderWithBoth = builder.traits({
    admin: { role: 'admin' },
    premium: { role: 'premium' },
  });

  expectTypeOf(builderWithBoth).toBeObject();
});

test('FactoryBuilder.traits() should allow custom traits alongside schema traits', () => {
  type SchemaWithTraits = {
    users: CollectionConfig<
      UserModel,
      {},
      Factory<UserModel, 'admin' | 'premium'>
    >;
  };

  const builder = factory<SchemaWithTraits>().model(userModel);

  // Should allow custom traits not in schema
  const builderWithCustom = builder.traits({
    verified: { email: () => 'verified@example.com' },
    suspended: { role: 'suspended' },
  });

  expectTypeOf(builderWithCustom).toBeObject();
  expectTypeOf(builderWithCustom.create).toBeFunction();

  // Should allow mixing schema and custom traits
  const builderWithMixed = builder.traits({
    admin: { role: 'admin' },
    verified: { email: () => 'verified@example.com' },
  });

  expectTypeOf(builderWithMixed).toBeObject();
});

test('FactoryBuilder.traits() should work without schema-defined traits', () => {
  type SchemaWithoutTraits = {
    users: CollectionConfig<UserModel>;
  };

  const builder = factory<SchemaWithoutTraits>().model(userModel);

  // Should accept any trait names when schema doesn't define traits
  const builderWithAnyTraits = builder.traits({
    customTrait1: { role: 'custom1' },
    customTrait2: { role: 'custom2' },
  });

  expectTypeOf(builderWithAnyTraits).toBeObject();
  expectTypeOf(builderWithAnyTraits.create).toBeFunction();
});

test('FactoryBuilder.traits() should preserve trait names through chaining', () => {
  type SchemaWithTraits = {
    users: CollectionConfig<
      UserModel,
      {},
      Factory<UserModel, 'admin' | 'premium'>
    >;
  };

  const builder1 = factory<SchemaWithTraits>()
    .model(userModel)
    .traits({
      admin: { role: 'admin' },
    });

  // Verify builder has correct methods
  expectTypeOf(builder1).toBeObject();
  expectTypeOf(builder1.traits).toBeFunction();
  expectTypeOf(builder1.create).toBeFunction();

  const builder2 = builder1.traits({
    premium: { role: 'premium' },
  });

  // Verify chained builder also has correct methods
  expectTypeOf(builder2).toBeObject();
  expectTypeOf(builder2.create).toBeFunction();
});

test('FactoryBuilder.create() should return Factory with correct trait types', () => {
  type SchemaWithTraits = {
    users: CollectionConfig<
      UserModel,
      {},
      Factory<UserModel, 'admin' | 'premium'>
    >;
  };

  const userFactory = factory<SchemaWithTraits>()
    .model(userModel)
    .attrs({
      name: 'John Doe',
      email: 'john@example.com',
    })
    .traits({
      admin: { role: 'admin' },
      premium: { role: 'premium' },
    })
    .create();

  // Factory should have the correct trait types
  expectTypeOf(userFactory).toMatchTypeOf<
    Factory<UserModel, 'admin' | 'premium', SchemaWithTraits>
  >();

  // Verify traits property has correct type
  expectTypeOf(userFactory.traits).toMatchTypeOf<
    ModelTraits<'admin' | 'premium', UserModel, SchemaWithTraits>
  >();
});
