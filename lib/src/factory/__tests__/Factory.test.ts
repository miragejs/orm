import { model, type ModelInstance } from '@src/model';
import { type SchemaCollections, type SchemaInstance } from '@src/schema';

import Factory from '../Factory';
import { resolveFactoryAttr } from '../utils';

// Define test model attributes
interface UserAttrs {
  age?: number;
  createdAt?: string | null;
  email: string;
  id: string;
  name: string;
  role?: string;
  processed?: boolean;
}

// Create test model
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

// Define test model type
type UserModel = typeof userModel;

describe('Factory', () => {
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

      const userFactory = new Factory(userModel, attributes, traits, undefined, afterCreate);

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
      expect(userFactory.traits).toMatchObject({});
      expect(userFactory.afterCreate).toBeUndefined();
    });
  });

  describe('Build method', () => {
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
      const dynamicFactory = new Factory(userModel, {
        email: (id: string) => `dynamic${id}@test.com`,
        name: function (id: string) {
          return `User ${id}`;
        },
        role: 'member',
      });
      const attrs = dynamicFactory.build('999');

      expect(attrs).toEqual({
        id: '999',
        email: 'dynamic999@test.com',
        name: 'User 999',
        role: 'member',
      });
    });

    it('should handle static values', () => {
      const staticFactory = new Factory(userModel, {
        email: 'static@example.com',
        name: 'Static User',
        role: 'guest',
        createdAt: '2024-01-01T00:00:00Z',
      });
      const model = staticFactory.build('static');

      expect(model).toEqual({
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
      let modelReceived: ModelInstance<UserModel> | null = null;
      let schemaReceived: SchemaInstance<SchemaCollections> | null = null;

      const factory = new Factory(
        userModel,
        { name: 'John', email: 'john@example.com' },
        undefined,
        undefined,
        (model, schema) => {
          hookCalled = true;
          modelReceived = model;
          schemaReceived = schema;
        },
      );

      // Create a simple schema mock
      const schemaMock = { users: { create: () => ({}) } };
      const model = { id: '1', name: 'John' };

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

  describe('Error handling', () => {
    it('should throw error for circular dependencies in attributes', () => {
      expect(() => {
        const factory = new Factory(userModel, {
          email: function (id) {
            // Access this.name to create circular dependency
            // The proxy will detect this before the function executes
            const name = resolveFactoryAttr(this.name, id);
            return name + '@example.com';
          },
          name: function (id) {
            // Access this.email to create circular dependency
            // The proxy will detect this before the function executes
            const email = resolveFactoryAttr(this.email, id);
            return email?.split('@')[0] ?? '';
          },
        });

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

describe('resolveFactoryAttr', () => {
  it('should call function attributes with modelId', () => {
    const attr = (id: string) => `value-${id}`;
    const result = resolveFactoryAttr(attr, '123');
    expect(result).toBe('value-123');
  });

  it('should return static values as-is', () => {
    const attr = 'static-value';
    const result = resolveFactoryAttr(attr, '123');
    expect(result).toBe('static-value');
  });

  it('should work with complex types', () => {
    const attr = (id: number) => ({ count: id * 2, valid: true });
    const result = resolveFactoryAttr(attr, 5);
    expect(result).toEqual({ count: 10, valid: true });
  });

  it('should work with arrays', () => {
    const attr = (id: string) => [`item-${id}`, 'static'];
    const result = resolveFactoryAttr(attr, 'abc');
    expect(result).toEqual(['item-abc', 'static']);
  });

  it('should be usable in factory attribute functions', () => {
    const factory = new Factory(userModel, {
      name: () => 'John Doe',
      email: function (id: string) {
        const name = resolveFactoryAttr(this.name, id);
        return `${name}@example.com`.toLowerCase().replace(/\s+/g, '.');
      },
    });

    const attrs = factory.build('1');
    expect(attrs.email).toBe('john.doe@example.com');
  });

  it('should handle chained attribute dependencies', () => {
    const factory = new Factory(userModel, {
      name: () => 'John',
      role: 'admin',
      email: function (id: string) {
        const name = resolveFactoryAttr(this.name, id);
        const role = resolveFactoryAttr(this.role, id);
        return `${name}.${role}@example.com`.toLowerCase();
      },
    });

    const attrs = factory.build('1');
    expect(attrs.email).toBe('john.admin@example.com');
  });
});
