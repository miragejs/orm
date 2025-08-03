import { DbCollection } from '@src/db';
import { Factory, type FactoryAttrs } from '@src/factory';
import { defineModel, type ModelAttrs } from '@src/model';

interface UserAttrs extends ModelAttrs {
  name: string;
  email: string;
  fullName?: string;
  createdAt?: Date | string | null;
}

const UserModel = defineModel<UserAttrs>();

describe('Factory', () => {
  let collection: DbCollection<UserAttrs>;
  let attributes: FactoryAttrs<UserAttrs>;
  let factory: Factory<UserAttrs>;

  beforeEach(() => {
    collection = new DbCollection<UserAttrs>({ name: 'users' });

    attributes = {
      createdAt: null,
      email: (id: string) => `user${id}@example.com`,
      fullName: (id: string) => `User ${id}`,
      name: 'John',
    };

    factory = new Factory<UserAttrs>(attributes);
  });

  describe('build', () => {
    it('should build model with static attributes', () => {
      const attrs = factory.build('1');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'user1@example.com',
        fullName: 'User 1',
        id: '1',
        name: 'John',
      });
    });

    it('should handle function attributes', () => {
      const attrs = factory.build('2');
      expect(attrs.email).toBe('user2@example.com');
      expect(attrs.fullName).toBe('User 2');
    });

    it('should apply traits', () => {
      const traits = {
        admin: {
          email: (id: string) => `admin${id}@example.com`,
          name: 'Admin User',
        },
      };

      factory = new Factory<UserAttrs>(attributes, traits);
      const attrs = factory.build('1', 'admin');

      expect(attrs).toEqual({
        createdAt: null,
        email: 'admin1@example.com',
        fullName: 'User 1',
        id: '1',
        name: 'Admin User',
      });
    });

    it('should apply multiple traits in order', () => {
      const traits = {
        admin: {
          name: 'Admin User',
        },
        verified: {
          email: (id: string) => `verified${id}@example.com`,
        },
      };

      factory = new Factory<UserAttrs>(attributes, traits);
      const attrs = factory.build('1', 'admin', 'verified');

      expect(attrs.name).toBe('Admin User');
      expect(attrs.email).toBe('verified1@example.com');
    });

    it('should handle default values overriding traits', () => {
      const traits = {
        admin: {
          name: 'Admin User',
        },
      };

      factory = new Factory<UserAttrs>(attributes, traits);
      const attrs = factory.build('1', 'admin', { name: 'Custom Name' });

      expect(attrs.name).toBe('Custom Name');
    });

    it('should process afterCreate hooks', () => {
      let hookCalled = false;
      const afterCreate = (model: InstanceType<typeof UserModel>) => {
        hookCalled = true;
        model.name = 'Modified Name';
      };

      factory = new Factory<UserAttrs>(attributes, {}, afterCreate);

      const attrs = factory.build('1');
      const model = new UserModel({ name: 'User', attrs, collection });

      factory.processAfterCreateHooks(model);

      expect(hookCalled).toBe(true);
      expect(model.attrs.name).toBe('Modified Name');
    });

    it('should process trait afterCreate hooks', () => {
      let hookCalled = false;
      const traits = {
        admin: {
          name: 'Admin User',
          afterCreate: (model: InstanceType<typeof UserModel>) => {
            hookCalled = true;
            model.createdAt = new Date('2024-01-01').toISOString();
          },
        },
      };

      factory = new Factory<UserAttrs>(attributes, traits);

      const attrs = factory.build('1', 'admin');
      const model = new UserModel({ name: 'User', attrs, collection });

      factory.processAfterCreateHooks(model, 'admin');

      expect(hookCalled).toBe(true);
      expect(model.attrs.createdAt).toBe(new Date('2024-01-01').toISOString());
    });

    it('should handle circular dependencies in attributes', () => {
      const circularAttrs: FactoryAttrs<UserAttrs> = {
        name() {
          const fullNameValue = this.fullName;
          return `User ${fullNameValue}`;
        },
        fullName() {
          const nameValue = this.name;
          return `User ${nameValue}`;
        },
        email: (id: string) => `user${id}@example.com`,
      };

      factory = new Factory<UserAttrs>(circularAttrs);
      expect(() => factory.build('1')).toThrow('[Mirage]: Circular dependency detected: name');
    });
  });
});
