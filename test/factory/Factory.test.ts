import { Factory, createFactory, extendFactory, type FactoryDefinition } from '@src/factory';
import { defineModel, defineToken, type ModelAttrs } from '@src/model';

// Define the UserAttrs interface
interface UserAttrs {
  id: string;
  createdAt?: string | null;
  email: string;
  name: string;
  role?: string;
}

// Create token for User model
const UserToken = defineToken<UserAttrs>('User', 'users');
const UserModel = defineModel(UserToken);

describe('Factory', () => {
  let factory: Factory<typeof UserToken>;

  beforeEach(() => {
    factory = createFactory(UserToken, {
      attributes: {
        createdAt: null,
        email: (id: string) => `user${id}@example.com`,
        name: 'John',
        role: 'user',
      },
      traits: {
        admin: {
          email: (id: string) => `admin${id}@example.com`,
          role: 'admin',
        },
      },
    });
  });

  describe('createFactory', () => {
    it('should create a factory with the given definition', () => {
      const attrs = factory.build('1');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'user1@example.com',
        id: '1',
        name: 'John',
        role: 'user',
      });
    });

    it('should create a factory with traits', () => {
      const attrs = factory.build('1', 'admin');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'admin1@example.com',
        id: '1',
        name: 'John',
        role: 'admin',
      });
    });
  });

  describe('extendFactory', () => {
    it('should extend a factory with new attributes', () => {
      const extendedFactory = extendFactory(factory, {
        attributes: {
          email: (id: string) => `user${id}@example.com`,
          name: 'John',
          role: 'user',
        },
      });

      const attrs = extendedFactory.build('1');
      expect(attrs).toEqual({
        createdAt: null,
        id: '1',
        name: 'John',
        email: 'user1@example.com',
        role: 'user',
      });
    });

    it('should extend a factory with new traits', () => {
      const extendedFactory = extendFactory(factory, {
        traits: {
          moderator: {
            role: 'moderator',
            email: (id: string) => `mod${id}@example.com`,
          },
        },
      });

      const attrs = extendedFactory.build('1', 'moderator');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'mod1@example.com',
        id: '1',
        name: 'John',
        role: 'moderator',
      });
    });

    it('should override existing traits', () => {
      const extendedFactory = extendFactory(factory, {
        traits: {
          admin: {
            role: 'superadmin',
            email: (id: string) => `superadmin${id}@example.com`,
          },
        },
      });

      const attrs = extendedFactory.build('1', 'admin');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'superadmin1@example.com',
        id: '1',
        name: 'John',
        role: 'superadmin',
      });
    });

    it('should extend with new afterCreate hook', () => {
      let hookCalled = false;
      const extendedFactory = extendFactory(factory, {
        afterCreate(model) {
          hookCalled = true;
          model.createdAt = new Date('2024-01-01').toISOString();
        },
      });
      const attrs = extendedFactory.build('1');
      const model = new UserModel({ attrs });
      extendedFactory.processAfterCreateHooks(model);

      expect(hookCalled).toBe(true);
      expect(model.attrs.createdAt).toBe(new Date('2024-01-01').toISOString());
    });

    it('should preserve original afterCreate hook if not overridden', () => {
      const extendedFactory = extendFactory(factory, {
        attributes: {
          email: (id: string) => `user${id}@example.com`,
          name: 'John',
          role: 'user',
        },
      });

      const attrs = extendedFactory.build('1');
      expect(attrs.name).toBe('John');
    });
  });
});
