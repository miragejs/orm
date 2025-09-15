import { Factory } from '@src/factory';
import { model } from '@src/model';

interface UserAttrs {
  id: string;
  createdAt?: string | null;
  email: string;
  name: string;
  role?: string;
  age?: number;
}

const UserModel = model('user', 'users').attrs<UserAttrs>().create();

describe('Factory', () => {
  describe('constructor', () => {
    it('should initialize with token, attributes, traits, and afterCreate hook', () => {
      const attributes = {
        email: (id: string) => `user${id}@example.com`,
        name: 'John Doe',
        role: 'user',
      };

      const traits = {
        admin: {
          role: 'admin',
          email: (id: string) => `admin${id}@example.com`,
        },
      };

      const afterCreate = (model: any) => {
        model.processed = true;
      };

      const userFactory = new Factory(UserModel, attributes, traits, afterCreate);
      expect(userFactory.template).toBe(UserModel);
      expect(userFactory.attributes).toBe(attributes);
      expect(userFactory.traits).toBe(traits);
      expect(userFactory.afterCreate).toBe(afterCreate);
    });

    it('should initialize without afterCreate hook', () => {
      const attributes = { name: 'John', email: 'john@example.com' };

      const userFactory = new Factory(UserModel, attributes);

      expect(userFactory.template).toBe(UserModel);
      expect(userFactory.attributes).toBe(attributes);
      expect(userFactory.traits).toEqual({});
      expect(userFactory.afterCreate).toBeUndefined();
    });
  });

  describe('build method', () => {
    const userFactory = new Factory(
      UserModel,
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
        UserModel,
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
        UserModel,
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
    it('should execute factory afterCreate hook', () => {
      let hookCalled = false;
      let modelReceived: any = null;

      const factory = new Factory(
        UserModel,
        { name: 'John', email: 'john@example.com' },
        {},
        (model) => {
          hookCalled = true;
          modelReceived = model;
          model.processed = true;
        },
      );

      const model = { id: '1', name: 'John', email: 'john@example.com' };
      const result = factory.processAfterCreateHooks(model);

      expect(hookCalled).toBe(true);
      expect(modelReceived).toBe(model);
      expect(result.processed).toBe(true);
    });

    it('should execute trait afterCreate hooks', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory(
        UserModel,
        { name: 'John', email: 'john@example.com' },
        {
          admin: {
            role: 'admin',
            afterCreate: (model) => {
              hooksCalled.push('admin');
              model.adminProcessed = true;
            },
          },
          premium: {
            role: 'premium',
            afterCreate: (model) => {
              hooksCalled.push('premium');
              model.premiumProcessed = true;
            },
          },
        },
      );

      const model = { id: '1', name: 'John', role: 'admin' } as any;
      factory.processAfterCreateHooks(model, 'admin');

      expect(hooksCalled).toEqual(['admin']);
      expect(model.adminProcessed).toBe(true);
      expect(model.premiumProcessed).toBeUndefined();
    });

    it('should execute multiple trait hooks in order', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory(
        UserModel,
        { name: 'John', email: 'john@example.com' },
        {
          admin: {
            role: 'admin',
            afterCreate: (model) => {
              hooksCalled.push('admin');
            },
          },
          premium: {
            role: 'premium',
            afterCreate: (model) => {
              hooksCalled.push('premium');
            },
          },
        },
      );

      const model = { id: '1', name: 'John' };
      factory.processAfterCreateHooks(model, 'admin', 'premium');

      expect(hooksCalled).toEqual(['admin', 'premium']);
    });

    it('should execute factory hook before trait hooks', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory(
        UserModel,
        { name: 'John', email: 'john@example.com' },
        {
          admin: {
            role: 'admin',
            afterCreate: (model) => {
              hooksCalled.push('trait');
            },
          },
        },
        (model) => {
          hooksCalled.push('factory');
        },
      );

      const model = { id: '1', name: 'John' };
      factory.processAfterCreateHooks(model, 'admin');

      expect(hooksCalled).toEqual(['factory', 'trait']);
    });

    it('should handle models without hooks gracefully', () => {
      const factory = new Factory(UserModel, { name: 'John' });

      const model = { id: '1', name: 'John' };
      const result = factory.processAfterCreateHooks(model);

      expect(result).toBe(model);
      expect(result.id).toBe('1');
      expect(result.name).toBe('John');
    });

    it('should ignore non-string arguments when processing traits', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory(
        UserModel,
        { name: 'John', email: 'john@example.com' },
        {
          admin: {
            role: 'admin',
            afterCreate: (model) => {
              hooksCalled.push('admin');
            },
          },
        },
      );

      const model = { id: '1', name: 'John' };
      factory.processAfterCreateHooks(model, 'admin', { age: 30 });

      expect(hooksCalled).toEqual(['admin']);
    });
  });

  describe('error handling', () => {
    it('should throw error for circular dependencies in attributes', () => {
      expect(() => {
        const factory = new Factory(
          UserModel,
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
      const factory = new Factory(UserModel, { name: 'John', email: 'john@example.com' });

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
