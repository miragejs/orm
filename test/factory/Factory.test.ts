import { BaseFactory, Factory, type FactoryDefinition } from '@src/factory';
import { createModelInstance, type ModelAttrs } from '@src/model';

interface UserAttrs extends ModelAttrs<number> {
  createdAt?: string | null;
  email: string;
  name: string;
  role?: string;
}

describe('Factory', () => {
  let baseDefinition: FactoryDefinition<UserAttrs>;
  let baseFactory: BaseFactory<UserAttrs>;

  beforeEach(() => {
    baseDefinition = {
      attributes: {
        createdAt: null,
        email: (id) => `user${id}@example.com`,
        name: 'John',
        role: 'user',
      },
      traits: {
        admin: {
          email: (id) => `admin${id}@example.com`,
          role: 'admin',
        },
      },
    };

    baseFactory = Factory.define(baseDefinition);
  });

  describe('define', () => {
    it('should create a factory with the given definition', () => {
      const { attrs } = baseFactory.build(1);
      expect(attrs).toEqual({
        createdAt: null,
        email: 'user1@example.com',
        id: 1,
        name: 'John',
        role: 'user',
      });
    });

    it('should create a factory with traits', () => {
      const { attrs } = baseFactory.build(1, 'admin');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'admin1@example.com',
        id: 1,
        name: 'John',
        role: 'admin',
      });
    });
  });

  describe('extend', () => {
    it('should extend a factory with new attributes', () => {
      const extendedFactory = Factory.extend(baseFactory, {
        attributes: {
          email: (id) => `user${id}@example.com`,
          name: 'John',
          role: 'user',
        },
      });

      const { attrs } = extendedFactory.build(1);
      expect(attrs).toEqual({
        createdAt: null,
        id: 1,
        name: 'John',
        email: 'user1@example.com',
        role: 'user',
      });
    });

    it('should extend a factory with new traits', () => {
      const extendedFactory = Factory.extend(baseFactory, {
        traits: {
          moderator: {
            role: 'moderator',
            email: (id) => `mod${id}@example.com`,
          },
        },
      });

      const { attrs } = extendedFactory.build(1, 'moderator');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'mod1@example.com',
        id: 1,
        name: 'John',
        role: 'moderator',
      });
    });

    it('should override existing traits', () => {
      const extendedFactory = Factory.extend(baseFactory, {
        traits: {
          admin: {
            role: 'superadmin',
            email: (id) => `superadmin${id}@example.com`,
          },
        },
      });

      const { attrs } = extendedFactory.build(1, 'admin');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'superadmin1@example.com',
        id: 1,
        name: 'John',
        role: 'superadmin',
      });
    });

    it('should extend with new afterCreate hook', () => {
      let hookCalled = false;
      const extendedFactory = Factory.extend(baseFactory, {
        afterCreate(model) {
          hookCalled = true;
          model.createdAt = new Date('2024-01-01').toISOString();
        },
      });
      const { attrs } = extendedFactory.build(1);
      const model = createModelInstance<UserAttrs>({ name: 'User', attrs });
      extendedFactory.processAfterCreate(model);

      expect(hookCalled).toBe(true);
      expect(model.attrs.createdAt).toBe(new Date('2024-01-01').toISOString());
    });

    it('should preserve original afterCreate hook if not overridden', () => {
      const extendedFactory = Factory.extend(baseFactory, {
        attributes: {
          email: (id) => `user${id}@example.com`,
          name: 'John',
          role: 'user',
        },
      });

      const { attrs } = extendedFactory.build(1);
      expect(attrs.name).toBe('John');
    });
  });
});
