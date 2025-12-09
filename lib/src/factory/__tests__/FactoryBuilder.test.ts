import { associations } from '@src/associations';
import { model } from '@src/model';
import { collection, schema, type CollectionConfig } from '@src/schema';

import Factory from '../Factory';
import FactoryBuilder from '../FactoryBuilder';
import { factory } from '../FactoryBuilder';

// Define test model attributes
interface UserAttrs {
  id: string;
  createdAt?: string | null;
  email: string;
  name: string;
  role?: string;
  processed?: boolean;
  lastLogin?: string;
}

// Create test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

// Define test model type
type UserModel = typeof userModel;

// Create simple test schema for factory.build() calls
const testSchema = schema()
  .collections({
    users: collection().model(userModel).create(),
  })
  .setup();

// Define test schema type
type TestSchema = {
  users: CollectionConfig<UserModel, {}, Factory<UserModel, 'admin' | 'premium'>>;
};

describe('FactoryBuilder', () => {
  beforeEach(() => {
    // Clear database before each test
    testSchema.db.emptyData();
  });

  describe('Constructor', () => {
    it('should create factory using builder pattern', () => {
      const userFactory = factory<TestSchema>()
        .model(userModel)
        .attrs({
          createdAt: null,
          email: (id: string) => `user${id}@example.com`,
          name: 'John Doe',
          role: 'user',
        })
        .traits({
          admin: {
            email: (id: string) => `admin${id}@example.com`,
            role: 'admin',
          },
        })
        .afterCreate((user) => {
          user.update({ createdAt: new Date('2024-01-01').toISOString() });
        })
        .create();

      expect(userFactory).toBeInstanceOf(Factory);
      expect(userFactory.template).toBe(userModel);

      const attrs = userFactory.build(testSchema);
      expect(attrs).toMatchObject({
        id: '1',
        createdAt: null,
        email: 'user1@example.com',
        name: 'John Doe',
        role: 'user',
      });

      const adminAttrs = userFactory.build(testSchema, 'admin');
      expect(adminAttrs).toMatchObject({
        id: '2',
        createdAt: null,
        email: 'admin2@example.com',
        name: 'John Doe',
        role: 'admin',
      });
    });

    it('should support method chaining', () => {
      const builder = factory();
      expect(builder).toBeInstanceOf(FactoryBuilder);

      const builderWithModel = builder.model(userModel);
      expect(builderWithModel).toBeInstanceOf(FactoryBuilder);

      const builderWithAttrs = builderWithModel.attrs({
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(builderWithAttrs).toBeInstanceOf(FactoryBuilder);

      const builderWithTraits = builderWithAttrs.traits({
        premium: { role: 'premium' },
      });
      expect(builderWithTraits).toBeInstanceOf(FactoryBuilder);

      const finalFactory = builderWithTraits.create();
      expect(finalFactory).toBeInstanceOf(Factory);
    });

    it('should merge attributes when called multiple times', () => {
      const userFactory = factory<TestSchema>()
        .model(userModel)
        .attrs({ name: 'John', email: 'john@example.com' })
        .attrs({ role: 'user', createdAt: null })
        .create();

      const attrs = userFactory.build(testSchema);
      expect(attrs).toMatchObject({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        role: 'user',
        createdAt: null,
      });
    });

    it('should create factory with callable runAfterCreateHooks method', () => {
      // Create a manager user first
      testSchema.users.create({
        name: 'Manager',
        email: 'manager@example.com',
        role: 'manager',
      });

      const userFactory = factory<TestSchema>()
        .model(userModel)
        .attrs({
          name: 'John',
          email: 'john@example.com',
          role: 'user',
          processed: false,
        })
        .afterCreate((model, schema) => {
          const manager = schema.users.first();
          model.update({
            processed: true,
            lastLogin: new Date('2024-01-01').toISOString(),
            createdAt: manager?.email,
          });
        })
        .create();

      const attrs = userFactory.build(testSchema);
      const user = testSchema.users.new(attrs).save();
      const result = userFactory.runAfterCreateHooks(testSchema, user);

      expect(result).toBe(user);
      expect(user.id).toBe('2');
      expect(user.name).toBe('John');
      expect(user.processed).toBe(true);
      expect(user.lastLogin).toBe('2024-01-01T00:00:00.000Z');
      expect(user.createdAt).toBe('manager@example.com');
    });
  });

  describe('traits()', () => {
    it('should add traits and return new builder with merged traits', () => {
      const builder1 = factory<TestSchema>()
        .model(userModel)
        .attrs({ name: 'John', email: 'john@example.com', role: 'user' })
        .traits({
          admin: {
            role: 'admin',
            email: (id) => `admin${id}@example.com`,
          },
        });

      const builder2 = builder1.traits({
        premium: { role: 'premium', lastLogin: '2024-01-01T00:00:00.000Z' },
      });

      // Should be different instances
      expect(builder1).not.toBe(builder2);

      const testFactory = builder2.create();
      const adminAttrs = testFactory.build(testSchema, 'admin');
      const premiumAttrs = testFactory.build(testSchema, 'premium');

      expect(adminAttrs).toMatchObject({
        id: '1',
        name: 'John',
        role: 'admin',
        email: 'admin1@example.com',
      });
      expect(premiumAttrs).toMatchObject({
        id: '2',
        name: 'John',
        role: 'premium',
        lastLogin: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  describe('attrs()', () => {
    it('should set factory attributes', () => {
      const userFactory = factory<TestSchema>()
        .model(userModel)
        .attrs({
          name: 'Alice',
          email: 'alice@example.com',
          role: 'user',
        })
        .create();

      const attrs = userFactory.build(testSchema);
      expect(attrs).toMatchObject({
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'user',
      });
    });

    it('should support function attributes', () => {
      const userFactory = factory<TestSchema>()
        .model(userModel)
        .attrs({
          name: 'Bob',
          email: (id) => `user${id}@example.com`,
          role: 'member',
        })
        .create();

      const attrs = userFactory.build(testSchema);
      expect(attrs).toMatchObject({
        id: '1',
        name: 'Bob',
        email: 'user1@example.com',
        role: 'member',
      });
    });

    it('should merge multiple attrs() calls', () => {
      const userFactory = factory<TestSchema>()
        .model(userModel)
        .attrs({ name: 'Charlie' })
        .attrs({ email: 'charlie@example.com' })
        .attrs({ role: 'guest' })
        .create();

      const attrs = userFactory.build(testSchema);
      expect(attrs).toMatchObject({
        id: '1',
        name: 'Charlie',
        email: 'charlie@example.com',
        role: 'guest',
      });
    });
  });

  describe('associations()', () => {
    it('should define associations for factory', () => {
      const postModel = model()
        .name('post')
        .collection('posts')
        .attrs<{ id: string; title: string; authorId?: string }>()
        .create();

      type PostTestSchema = {
        users: CollectionConfig<UserModel>;
        posts: CollectionConfig<typeof postModel>;
      };

      const postFactory = factory<PostTestSchema>()
        .model(postModel)
        .attrs({ title: 'My Post' })
        .associations({
          author: associations.create(userModel),
        })
        .create();

      expect(postFactory).toBeInstanceOf(Factory);
      expect(postFactory.associations).toBeDefined();
      expect(Object.keys(postFactory.associations || {})).toContain('author');
    });

    it('should support multiple associations', () => {
      const postModel = model()
        .name('post')
        .collection('posts')
        .attrs<{ id: string; title: string; authorId?: string; editorId?: string }>()
        .create();

      type PostTestSchema = {
        users: CollectionConfig<UserModel>;
        posts: CollectionConfig<typeof postModel>;
      };

      const postFactory = factory<PostTestSchema>()
        .model(postModel)
        .attrs({ title: 'Article' })
        .associations({
          author: associations.create<PostTestSchema, UserModel>(userModel, {
            name: 'Article Author',
            email: 'author@example.com',
            role: 'author',
          }),
          editor: associations.create<PostTestSchema, UserModel>(userModel, {
            name: 'Editor',
            email: 'editor@example.com',
            role: 'editor',
          }),
        })
        .create();

      expect(postFactory).toBeInstanceOf(Factory);
      expect(postFactory.associations).toBeDefined();
      expect(Object.keys(postFactory.associations || {})).toContain('author');
      expect(Object.keys(postFactory.associations || {})).toContain('editor');
    });
  });

  describe('extend()', () => {
    it('should extend existing factory and add new configuration', () => {
      // Create base factory
      const baseFactory = factory<TestSchema>()
        .model(userModel)
        .attrs({
          email: (id: string) => `user${id}@example.com`,
          name: 'John Doe',
          role: 'user',
          createdAt: null,
        })
        .traits({
          admin: { role: 'admin', email: (id) => `admin${id}@example.com` },
        })
        .create();

      // Extend using static method
      const extendedBuilder = factory<TestSchema>().extend(baseFactory);
      expect(extendedBuilder).toBeInstanceOf(FactoryBuilder);

      const extendedFactory = extendedBuilder
        .attrs({ email: 'john@example.com' }) // Override email from base
        .traits({
          premium: {
            role: 'premium',
            email: (id: string) => `premium${id}@example.com`,
            lastLogin: '2024-01-01T00:00:00.000Z',
          },
        })
        .afterCreate((user) => {
          user.update({ processed: true });
        })
        .create();

      // Test base factory still works
      const basicAttrs = baseFactory.build(testSchema);
      expect(basicAttrs).toMatchObject({
        id: '1',
        role: 'user',
        email: 'user1@example.com',
        name: 'John Doe',
        createdAt: null,
      });

      // Test extended factory with overridden attributes
      const userAttrs = extendedFactory.build(testSchema);
      expect(userAttrs).toMatchObject({
        id: '2',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: null,
      });

      // Test extended factory with premium trait
      const premiumAttrs = extendedFactory.build(testSchema, 'premium');
      expect(premiumAttrs).toMatchObject({
        id: '3',
        role: 'premium',
        email: 'premium3@example.com',
        name: 'John Doe',
        lastLogin: '2024-01-01T00:00:00.000Z',
      });

      // Test that admin trait from base is still available
      const adminAttrs = extendedFactory.build(testSchema, 'admin');
      expect(adminAttrs).toMatchObject({
        id: '4',
        role: 'admin',
        email: 'admin4@example.com',
        name: 'John Doe',
      });
    });
  });
});
