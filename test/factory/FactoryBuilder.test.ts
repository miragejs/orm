import { Factory, FactoryBuilder, factory } from '@src/factory';
import { model, ModelInstance } from '@src/model';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

// Define test model attributes
interface UserAttrs {
  id: string;
  createdAt?: string | null;
  email: string;
  name: string;
  role?: string;
}

// Define extended type for models that have been processed by afterCreate hooks
interface ProcessedUserAttrs extends UserAttrs {
  processed?: boolean;
  adminProcessed?: boolean;
  premiumProcessed?: boolean;
  baseProcessed?: boolean;
  extendedProcessed?: boolean;
}

// Create test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

const processedUserModel = model()
  .name('processedUser')
  .collection('processedUsers')
  .attrs<ProcessedUserAttrs>()
  .create();

describe('FactoryBuilder', () => {
  describe('Constructor', () => {
    it('should create factory using builder pattern', () => {
      const userFactory = factory()
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
          user.createdAt = new Date('2024-01-01').toISOString();
        })
        .create();

      expect(userFactory).toBeInstanceOf(Factory);
      expect(userFactory.template).toBe(userModel);

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
      const builder = factory();
      expect(builder).toBeInstanceOf(FactoryBuilder);

      const builderWithModel = builder.model(userModel);
      expect(builderWithModel).toBeInstanceOf(FactoryBuilder);

      const builderWithAttrs = builderWithModel.attrs({ name: 'Test User' });
      expect(builderWithAttrs).toBeInstanceOf(FactoryBuilder);

      const builderWithTraits = builderWithAttrs.traits({
        premium: { role: 'premium' },
      });
      expect(builderWithTraits).toBeInstanceOf(FactoryBuilder);

      const finalFactory = builderWithTraits.create();
      expect(finalFactory).toBeInstanceOf(Factory);
    });

    it('should merge attributes when called multiple times', () => {
      const userFactory = factory()
        .model(userModel)
        .attrs({ name: 'John' })
        .attrs({ email: 'john@example.com' })
        .attrs({ role: 'user' })
        .create();

      const attrs = userFactory.build('1');
      expect(attrs.name).toBe('John');
      expect(attrs.email).toBe('john@example.com');
      expect(attrs.role).toBe('user');
    });

    it('should create factory with callable processAfterCreateHooks method', () => {
      let hookCalled = false;
      let schemaReceived: any = null;

      const userFactory = factory<SchemaCollections>()
        .model(processedUserModel)
        .attrs({ name: 'John' })
        .afterCreate((model, schema) => {
          hookCalled = true;
          schemaReceived = schema;
          (model as ProcessedUserAttrs).processed = true;
        })
        .create();

      // Create a simple schema mock
      const schemaMock = {
        users: { create: () => ({}) },
      } as unknown as SchemaInstance<SchemaCollections>;
      const user = {
        id: '1',
        name: 'John',
        email: 'john@example.com',
        role: 'user',
      } as unknown as ModelInstance<typeof processedUserModel, SchemaCollections>;

      const result = userFactory.processAfterCreateHooks(schemaMock, user);

      expect(hookCalled).toBe(true);
      expect(result).toBe(user);
      expect(user.processed).toBe(true);
      expect(schemaReceived).toBe(schemaMock);
    });
  });

  describe('Traits functionality', () => {
    it('should add traits and return new builder with merged traits', () => {
      const builder1 = factory()
        .model(userModel)
        .traits({
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
  });

  describe('Factory extension', () => {
    it('should extend existing factory using static method', () => {
      // Create base factory
      const baseFactory = factory()
        .model(userModel)
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
      const extendedBuilder = factory().extend(baseFactory);
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
  });

  describe('Builder extend method', () => {
    it('should extend builder with additional configuration', () => {
      const baseBuilder = factory()
        .model(processedUserModel)
        .attrs({ name: 'John' })
        .traits({ admin: { role: 'admin' } })
        .create();

      const extendedBuilder = factory()
        .extend(baseBuilder)
        .attrs({ email: 'john@example.com' })
        .traits({ premium: { role: 'premium' } })
        .afterCreate((user) => {
          user.processed = true;
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
