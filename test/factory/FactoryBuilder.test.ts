import { Factory, FactoryBuilder, factory } from '@src/factory';
import { model } from '@src/model';

interface UserAttrs {
  id: string;
  createdAt?: string | null;
  email: string;
  name: string;
  role?: string;
}

// Extended type for models that have been processed by afterCreate hooks
interface ProcessedUserAttrs extends UserAttrs {
  processed?: boolean;
  adminProcessed?: boolean;
  premiumProcessed?: boolean;
  baseProcessed?: boolean;
  extendedProcessed?: boolean;
}

const UserModel = model('user', 'users').attrs<UserAttrs>().create();
const ProcessedUserModel = model('processedUser', 'processedUsers')
  .attrs<ProcessedUserAttrs>()
  .create();

describe('FactoryBuilder', () => {
  describe('basic factory creation', () => {
    it('should create factory using builder pattern', () => {
      const userFactory = factory(UserModel)
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
          user.createdAt = new Date('2024-01-01').toISOString();
        })
        .create();

      expect(userFactory).toBeInstanceOf(Factory);
      expect(userFactory.template).toBe(UserModel);

      const attrs = userFactory.build('1');
      expect(attrs).toEqual({
        createdAt: null,
        email: 'user1@example.com',
        id: '1',
        name: 'John Doe',
        role: 'user',
      });

      const adminAttrs = userFactory.build('2', 'admin');
      expect(adminAttrs).toEqual({
        createdAt: null,
        email: 'admin2@example.com',
        id: '2',
        name: 'John Doe',
        role: 'admin',
      });
    });

    it('should support method chaining', () => {
      const builder = factory(UserModel);
      expect(builder).toBeInstanceOf(FactoryBuilder);

      const builderWithAttrs = builder.attrs({ name: 'Test User' });
      expect(builderWithAttrs).toBeInstanceOf(FactoryBuilder);

      const builderWithTraits = builderWithAttrs.traits({
        premium: { role: 'premium' },
      });
      expect(builderWithTraits).toBeInstanceOf(FactoryBuilder);

      const finalFactory = builderWithTraits.create();
      expect(finalFactory).toBeInstanceOf(Factory);
    });

    it('should merge attributes when called multiple times', () => {
      const userFactory = factory(UserModel)
        .attrs({ name: 'John' })
        .attrs({ email: 'john@example.com' })
        .attrs({ role: 'user' })
        .create();

      const attrs = userFactory.build('1');
      expect(attrs.name).toBe('John');
      expect(attrs.email).toBe('john@example.com');
      expect(attrs.role).toBe('user');
    });

    it('should handle afterCreate hooks', () => {
      let hookCalled = false;
      let modelReceived: any = null;

      const userFactory = factory(ProcessedUserModel)
        .attrs({ name: 'John' })
        .afterCreate((model) => {
          hookCalled = true;
          modelReceived = model;
          model.processed = true;
        })
        .create();

      const user: ProcessedUserAttrs = { id: '1', name: 'John', email: 'john@example.com' };
      userFactory.processAfterCreateHooks(user);

      expect(hookCalled).toBe(true);
      expect(modelReceived).toBe(user);
      expect(user.processed).toBe(true);
    });
  });

  describe('traits functionality', () => {
    it('should add traits and return new builder with merged traits', () => {
      const builder1 = factory(UserModel).traits({
        admin: { role: 'admin' },
      });

      const builder2 = builder1.traits({
        premium: { role: 'premium' },
      });

      // Should be different instances
      expect(builder1).not.toBe(builder2);

      const testFactory = builder2.create();
      const adminUser = testFactory.build('1', 'admin');
      const premiumUser = testFactory.build('2', 'premium');

      expect(adminUser.role).toBe('admin');
      expect(premiumUser.role).toBe('premium');
    });

    it('should handle trait afterCreate hooks', () => {
      const hooksCalled: string[] = [];

      const userFactory = factory(ProcessedUserModel)
        .attrs({ name: 'John' })
        .traits({
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
        })
        .create();

      const user: ProcessedUserAttrs = {
        id: '1',
        name: 'John',
        role: 'admin',
        email: 'admin1@example.com',
      };
      userFactory.processAfterCreateHooks(user, 'admin');

      expect(hooksCalled).toEqual(['admin']);
      expect(user.adminProcessed).toBe(true);
      expect(user.premiumProcessed).toBeUndefined();
    });
  });

  describe('factory extension', () => {
    it('should extend existing factory using static method', () => {
      // Create base factory
      const baseFactory = factory(UserModel)
        .attrs({
          email: (id: string) => `user${id}@example.com`,
          name: 'John Doe',
          role: 'user',
        })
        .traits({
          admin: { role: 'admin' },
        })
        .create();

      // Extend using static method
      const extendedBuilder = FactoryBuilder.extend(baseFactory);
      expect(extendedBuilder).toBeInstanceOf(FactoryBuilder);

      const extendedFactory = extendedBuilder
        .traits({
          premium: {
            role: 'premium',
            email: (id: string) => `premium${id}@example.com`,
          },
        })
        .create();

      // Test base factory still works
      const basicUser = baseFactory.build('1');
      expect(basicUser.role).toBe('user');
      expect(basicUser.email).toBe('user1@example.com');

      // Test extended factory
      const premiumUser = extendedFactory.build('2', 'premium');
      expect(premiumUser.role).toBe('premium');
      expect(premiumUser.email).toBe('premium2@example.com');
      expect(premiumUser.name).toBe('John Doe'); // Inherited from base factory

      // Test that admin trait is still available
      const adminUser = extendedFactory.build('3', 'admin');
      expect(adminUser.role).toBe('admin');
    });

    it('should preserve afterCreate hooks when extending', () => {
      const hooksCalled: string[] = [];

      const baseFactory = factory(ProcessedUserModel)
        .attrs({ name: 'John' })
        .afterCreate((model) => {
          hooksCalled.push('base');
          model.baseProcessed = true;
        })
        .create();

      const extendedFactory = FactoryBuilder.extend(baseFactory)
        .afterCreate((model) => {
          hooksCalled.push('extended');
          model.extendedProcessed = true;
        })
        .create();

      const user: ProcessedUserAttrs = { id: '1', name: 'John', email: 'john@example.com' };
      extendedFactory.processAfterCreateHooks(user);

      // Should call the extended hook (overwrites base)
      expect(hooksCalled).toEqual(['extended']);
      expect(user.extendedProcessed).toBe(true);
      expect(user.baseProcessed).toBeUndefined();
    });
  });

  describe('builder extend method', () => {
    it('should extend builder with additional configuration', () => {
      const baseBuilder = factory(ProcessedUserModel)
        .attrs({ name: 'John' })
        .traits({ admin: { role: 'admin' } });

      const extendedBuilder = baseBuilder.extend({
        attributes: { email: 'john@example.com' },
        traits: { premium: { role: 'premium' } },
        afterCreate: (user) => {
          user.processed = true;
        },
      });

      expect(extendedBuilder).toBeInstanceOf(FactoryBuilder);
      expect(extendedBuilder).not.toBe(baseBuilder);

      const testFactory = extendedBuilder.create();
      const user = testFactory.build('1');

      expect(user.name).toBe('John'); // From base
      expect(user.email).toBe('john@example.com'); // From extension

      const adminUser = testFactory.build('2', 'admin');
      expect(adminUser.role).toBe('admin'); // From base traits

      const premiumUser = testFactory.build('3', 'premium');
      expect(premiumUser.role).toBe('premium'); // From extended traits
    });
  });
});
