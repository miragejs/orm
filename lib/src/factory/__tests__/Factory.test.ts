import { model, type ModelInstance } from '@src/model';
import { collection, CollectionConfig, schema } from '@src/schema';
import { resolveFactoryAttr } from '@src/utils';

import Factory from '../Factory';

// Define test model attributes
interface UserAttrs {
  age?: number;
  bio?: string;
  createdAt?: string | null;
  email: string;
  id: string;
  name: string;
  processed?: boolean;
  role?: string;
  subscription?: string;
  manager?: string;
}

// Create test model
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

// Define test model type
type UserModel = typeof userModel;

// Create simple schema for build() method dependency
const testSchema = schema()
  .collections({
    users: collection().model(userModel).create(),
  })
  .setup();

type TestSchema = {
  users: CollectionConfig<UserModel>;
};

describe('Factory', () => {
  beforeEach(() => {
    // Clear database before each test
    testSchema.db.emptyData();
  });

  describe('Constructor', () => {
    it('should initialize with model, attributes, traits, and afterCreate hook', () => {
      const attributes = {
        name: 'John Doe',
        role: 'user',
        email: (id: string) => `user${id}@example.com`,
      };
      const traits = {
        admin: {
          name: 'Admin',
          role: 'admin',
          email: (id: string) => `admin${id}@example.com`,
        },
      };
      const afterCreate = (model: ModelInstance<UserModel>) => {
        model.processed = true;
      };

      const factory = new Factory(userModel, attributes, traits, undefined, afterCreate);

      expect(factory.template).toBe(userModel);
      expect(factory.attributes).toBe(attributes);
      expect(factory.traits).toBe(traits);
      expect(factory.afterCreate).toBe(afterCreate);
    });

    it('should initialize without afterCreate hook', () => {
      const attributes = { name: 'John', email: 'john@example.com' };
      const factory = new Factory(userModel, attributes);

      expect(factory.template).toBe(userModel);
      expect(factory.attributes).toBe(attributes);
      expect(factory.traits).toMatchObject({});
      expect(factory.afterCreate).toBeUndefined();
    });

    it('should initialize with default empty attributes', () => {
      const factory = new Factory(userModel);

      expect(factory.template).toBe(userModel);
      expect(factory.attributes).toEqual({});
      expect(factory.traits).toEqual({});
      expect(factory.afterCreate).toBeUndefined();
    });
  });

  describe('build()', () => {
    const userFactory = new Factory<UserModel, 'admin' | 'premium', TestSchema>(
      userModel,
      {
        name: () => 'John Doe',
        email(id: string) {
          const name = resolveFactoryAttr(this.name, id).split(' ').join('.').toLowerCase();
          return `${name}-${id}@example.com`;
        },
        role: 'user',
        subscription: 'free',
        createdAt: null,
      },
      {
        admin: {
          role: 'admin',
          email: (id: string) => `admin-${id}@example.com`,
        },
        premium: {
          subscription: 'premium',
        },
      },
    );

    it('should build model attributes with given defaults', () => {
      const attrs = userFactory.build(testSchema, {
        name: 'Alice',
        email: 'alice@example.com',
      });

      expect(attrs).toMatchObject({
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'user',
        createdAt: null,
        subscription: 'free',
      });
    });

    it('should build model attributes with trait', () => {
      const attrs = userFactory.build(testSchema, 'admin');

      expect(attrs).toMatchObject({
        name: 'John Doe',
        role: 'admin',
        createdAt: null,
        subscription: 'free',
      });
      expect(attrs.email).toMatch('admin-1@example.com');
      expect(attrs.id).toBeDefined();
    });

    it('should build model attributes with multiple traits', () => {
      const attrs = userFactory.build(testSchema, 'admin', 'premium');

      expect(attrs).toMatchObject({
        createdAt: null,
        name: 'John Doe',
        role: 'admin',
        subscription: 'premium',
      });
      expect(attrs.email).toMatch('admin-1@example.com');
      expect(attrs.id).toBeDefined();
    });

    it('should build model attributes with traits and default overrides', () => {
      const attrs = userFactory.build(testSchema, 'admin', {
        name: 'Super Admin',
        age: 35,
      });

      expect(attrs).toMatchObject({
        name: 'Super Admin', // overridden
        email: 'admin-1@example.com',
        age: 35, // added
        role: 'admin',
        createdAt: null,
      });
    });

    it('should handle function attributes correctly', () => {
      const dynamicFactory = new Factory<UserModel, 'member', TestSchema>(userModel, {
        name: (id) => {
          return `User ${id}`;
        },
        email(id) {
          const name = resolveFactoryAttr(this.name, id).replace(' ', '-').toLowerCase();
          return `${name}@example.com`;
        },
        role: 'member',
      });

      const attrs = dynamicFactory.build(testSchema);
      expect(attrs).toMatchObject({
        name: 'User 1',
        email: 'user-1@example.com',
        role: 'member',
      });
    });

    it('should handle static values', () => {
      const staticFactory = new Factory<UserModel, never, TestSchema>(userModel, {
        email: 'static@example.com',
        name: 'Static User',
        role: 'guest',
        createdAt: '2024-01-01T00:00:00Z',
      });

      const attrs = staticFactory.build(testSchema);
      expect(attrs).toMatchObject({
        email: 'static@example.com',
        name: 'Static User',
        role: 'guest',
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

    it('should call function attributes only once, especially when they depend on each other', () => {
      const called = new Map<string, number>();

      const dynamicFactory = new Factory<UserModel, never, TestSchema>(userModel, {
        name(id) {
          called.set('name', (called.get('name') ?? 0) + 1);
          return `User ${id}`;
        },
        email(id) {
          called.set('email', (called.get('email') ?? 0) + 1);

          const name = resolveFactoryAttr(this.name, id).split(' ').join('.').toLowerCase();
          return `${name}-${id}@example.com`;
        },
        bio(id) {
          called.set('bio', (called.get('bio') ?? 0) + 1);

          const name = resolveFactoryAttr(this.name, id);
          const email = resolveFactoryAttr(this.email, id);
          return `User: ${name} - ${email}`;
        },
        role: 'member',
      });
      dynamicFactory.build(testSchema);

      expect(called.get('name')).toBe(1);
      expect(called.get('email')).toBe(1);
      expect(called.get('bio')).toBe(1);
    });

    it('should throw error for circular dependencies in attributes', () => {
      expect(() => {
        const factory = new Factory<UserModel, never, TestSchema>(userModel, {
          name(id) {
            const email = resolveFactoryAttr(this.email, id);
            return email?.split('@')[0] ?? '';
          },
          email(id) {
            const name = resolveFactoryAttr(this.name, id);
            return name + '@example.com';
          },
        });

        factory.build(testSchema);
      }).toThrow(`[Mirage]: Circular dependency detected in user factory: name -> email -> name`);
    });

    it('should handle chained attribute dependencies', () => {
      const factory = new Factory<UserModel, never, TestSchema>(userModel, {
        name: () => 'John',
        role: 'admin',
        email(id) {
          const name = resolveFactoryAttr(this.name, id);
          const role = resolveFactoryAttr(this.role, id);
          return `${name}.${role}@example.com`.toLowerCase();
        },
      });

      const attrs = factory.build(testSchema);
      expect(attrs.email).toBe('john.admin@example.com');
    });
  });

  describe('runAfterCreateHooks()', () => {
    it('should execute factory afterCreate hook', () => {
      const factory = new Factory<UserModel, never, TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com', processed: false },
        undefined,
        undefined,
        (model) => {
          model.update({ processed: true });
        },
      );

      const attrs = factory.build(testSchema);
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model);

      expect(model.processed).toBe(true);
    });

    it('should execute trait afterCreate hooks', () => {
      const factory = new Factory<UserModel, 'admin', TestSchema>(
        userModel,
        {
          name: 'John',
          email: 'john@example.com',
          role: 'user',
          subscription: 'free',
        },
        {
          admin: {
            role: 'admin',
            afterCreate(model) {
              model.update({ subscription: 'premium' });
            },
          },
        },
      );

      const attrs = factory.build(testSchema, 'admin');
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model, 'admin');

      expect(model.role).toBe('admin');
      expect(model.subscription).toBe('premium');
    });

    it('should execute multiple trait hooks in order', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory<UserModel, 'first' | 'second', TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com' },
        {
          first: {
            role: 'first',
            afterCreate: () => {
              hooksCalled.push('trait:first');
            },
          },
          second: {
            role: 'second',
            afterCreate: () => {
              hooksCalled.push('trait:second');
            },
          },
        },
      );

      const attrs = factory.build(testSchema, 'first', 'second');
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model, 'first', 'second');

      expect(model.role).toBe('second');
      expect(hooksCalled).toEqual(['trait:first', 'trait:second']);
    });

    it('should execute factory hook before trait hooks', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory<UserModel, 'admin', TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com' },
        {
          admin: {
            afterCreate(model) {
              model.update({ role: 'admin' });
              hooksCalled.push('trait:admin');
            },
          },
        },
        undefined,
        () => {
          model.update({ role: 'user' });
          hooksCalled.push('factory');
        },
      );

      const attrs = factory.build(testSchema, 'admin');
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model, 'admin');

      expect(model.role).toBe('admin');
      expect(hooksCalled).toEqual(['factory', 'trait:admin']);
    });

    it('should handle models without hooks gracefully', () => {
      const factory = new Factory<UserModel, never, TestSchema>(userModel, {
        name: 'John',
        email: 'john@example.com',
      });

      const attrs = factory.build(testSchema);
      const model = testSchema.users.new(attrs).save();
      const result = factory.runAfterCreateHooks(testSchema, model);

      expect(result).toBe(model);
    });

    it('should pass schema to afterCreate hooks', () => {
      testSchema.users.create({
        name: 'Jane',
        email: 'jane@example.com',
      });

      const factory = new Factory<UserModel, never, TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com' },
        undefined,
        undefined,
        (model, schema) => {
          const manager = schema.users.first();
          model.update({ manager: manager?.email, role: 'user' });
        },
      );

      const attrs = factory.build(testSchema);
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model);

      expect(model.id).toBe('2');
      expect(model.name).toBe('John');
      expect(model.email).toBe('john@example.com');
      expect(model.role).toBe('user');
      expect(model.manager).toBe('jane@example.com');
    });

    it('should ignore non-string arguments when processing traits', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory<UserModel, 'admin', TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com' },
        {
          admin: {
            role: 'admin',
            afterCreate: () => {
              hooksCalled.push('trait:admin');
            },
          },
        },
      );

      const attrs = factory.build(testSchema, 'admin', { age: 30 });
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model, 'admin', { age: 30 });

      expect(model.role).toBe('admin');
      expect(model.age).toBe(30);
      expect(hooksCalled).toEqual(['trait:admin']);
    });
  });
});
