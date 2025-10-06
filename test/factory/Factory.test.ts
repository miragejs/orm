import { Factory } from '@src/factory';
import { model, ModelInstance } from '@src/model';
import { SchemaCollections, SchemaInstance } from '@src/schema';

// Setup test models
interface UserAttrs {
  age?: number;
  createdAt?: string | null;
  email: string;
  id: string;
  name: string;
  role?: string;
}

const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

type UserModel = typeof userModel;

describe('Factory', () => {
  describe('constructor', () => {
    it('should initialize with token, attributes, traits, and afterCreate hook', () => {
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
      const userFactory = new Factory(userModel, attributes, traits, afterCreate);

      expect(userFactory.template).toBe(userModel);
      expect(userFactory.attributes).toBe(attributes);
      expect(userFactory.traits).toBe(traits);
      expect(userFactory.afterCreate).toBe(afterCreate);
    });

    it('should initialize without afterCreate hook', () => {
      const attributes = { name: 'John', email: 'john@example.com' };
      const userFactory = new Factory(userModel, attributes);

      expect(userFactory.template).toBe(userModel);
      expect(userFactory.attributes).toBe(attributes);
      expect(userFactory.traits).toEqual({});
      expect(userFactory.afterCreate).toBeUndefined();
    });
  });

  describe('build method', () => {
    const userFactory = new Factory(
      userModel,
      {
        createdAt: null,
        email: (id: string) => `user${id}@example.com`,
        name: 'John Doe',
        role: 'user',
      },
      {
        admin: {
          role: 'admin',
          email: (id: string) => `admin${id}@example.com`,
        },
        premium: {
          role: 'premium',
          age: 25,
        },
      },
    );

    it('should build model attributes with given ID', () => {
      const attrs = userFactory.build('123');

      expect(attrs).toEqual({
        id: '123',
        createdAt: null,
        email: 'user123@example.com',
        name: 'John Doe',
        role: 'user',
      });
    });

    it('should build model attributes with trait', () => {
      const attrs = userFactory.build('456', 'admin');

      expect(attrs).toEqual({
        id: '456',
        createdAt: null,
        email: 'admin456@example.com',
        name: 'John Doe',
        role: 'admin',
      });
    });

    it('should build model attributes with multiple traits', () => {
      const attrs = userFactory.build('789', 'admin', 'premium');

      expect(attrs).toEqual({
        id: '789',
        createdAt: null,
        email: 'admin789@example.com', // admin trait applied first
        name: 'John Doe',
        role: 'premium', // premium trait overrides admin role
        age: 25, // from premium trait
      });
    });

    it('should build model attributes with default overrides', () => {
      const attrs = userFactory.build('101', { name: 'Jane Doe', age: 30 });

      expect(attrs).toEqual({
        id: '101',
        createdAt: null,
        email: 'user101@example.com',
        name: 'Jane Doe', // overridden
        role: 'user',
        age: 30, // added
      });
    });

    it('should build model attributes with traits and default overrides', () => {
      const attrs = userFactory.build('202', 'admin', { name: 'Super Admin', age: 35 });

      expect(attrs).toEqual({
        id: '202',
        createdAt: null,
        email: 'admin202@example.com',
        name: 'Super Admin', // overridden
        role: 'admin',
        age: 35, // added
      });
    });

    it('should handle function attributes correctly', () => {
      const dynamicFactory = new Factory(
        userModel,
        {
          email: (id: string) => `dynamic${id}@test.com`,
          name: function (this: any, id: string) {
            return `User ${id}`;
          },
          role: 'member',
        },
        {},
      );
      const attrs = dynamicFactory.build('999');

      expect(attrs).toEqual({
        id: '999',
        email: 'dynamic999@test.com',
        name: 'User 999',
        role: 'member',
      });
    });

    it('should handle static values', () => {
      const staticFactory = new Factory(
        userModel,
        {
          email: 'static@example.com',
          name: 'Static User',
          role: 'guest',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {},
      );
      const attrs = staticFactory.build('static');

      expect(attrs).toEqual({
        id: 'static',
        email: 'static@example.com',
        name: 'Static User',
        role: 'guest',
        createdAt: '2024-01-01T00:00:00Z',
      });
    });
  });

  describe('processAfterCreateHooks method', () => {
    it('should be callable with schema, model, and traits parameters', () => {
      let hookCalled = false;
      let modelReceived: any = null;
      let schemaReceived: any = null;

      const factory = new Factory(
        userModel,
        { name: 'John', email: 'john@example.com' },
        {},
        (model, schema) => {
          hookCalled = true;
          modelReceived = model;
          schemaReceived = schema;
        },
      );

      // Create a simple schema mock
      const schemaMock = { users: { create: () => ({}) } };
      const model = { id: '1', name: 'John', email: 'john@example.com' };

      const result = factory.processAfterCreateHooks(
        schemaMock as unknown as SchemaInstance<SchemaCollections>,
        model as unknown as ModelInstance<UserModel>,
      );
      expect(hookCalled).toBe(true);
      expect(modelReceived).toBe(model);
      expect(schemaReceived).toBe(schemaMock);
      expect(result).toBe(model);
    });

    it('should handle models without hooks gracefully', () => {
      const factory = new Factory(userModel, {
        name: 'John',
        email: 'john@example.com',
      });

      // Create a simple schema mock
      const schemaMock = { users: { create: () => ({}) } };
      const model = { id: '1', name: 'John' };

      const result = factory.processAfterCreateHooks(
        schemaMock as unknown as SchemaInstance<SchemaCollections>,
        model as unknown as ModelInstance<UserModel>,
      );
      expect(result).toBe(model);
    });
  });

  describe('error handling', () => {
    it('should throw error for circular dependencies in attributes', () => {
      expect(() => {
        const factory = new Factory(
          userModel,
          {
            email: function (this: any) {
              return this.name + '@example.com';
            },
            name: function (this: any) {
              return this.email.split('@')[0];
            },
          },
          {},
        );

        factory.build('1');
      }).toThrow('Circular dependency detected');
    });

    it('should handle non-existent traits gracefully', () => {
      const factory = new Factory(userModel, { name: 'John', email: 'john@example.com' });

      // This should not throw an error
      const attrs = factory.build('1', 'nonExistentTrait' as any);
      expect(attrs).toMatchObject({
        id: '1',
        name: 'John',
        email: 'john@example.com',
      });
    });
  });
});
