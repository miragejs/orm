import { associations } from '@src/associations';
import { factory } from '@src/factory';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';
import { model } from '@src/model';
import { collection, CollectionBuilder } from '@src/schema';

describe('CollectionBuilder', () => {
  // Test templates
  interface UserAttrs {
    id: string;
    name: string;
    email: string;
    status?: string;
  }

  interface PostAttrs {
    id: number;
    title: string;
    content: string;
    authorId: string;
  }

  const UserModel = model('user', 'users').attrs<UserAttrs>().create();
  const PostModel = model('post', 'posts').attrs<PostAttrs>().create();

  // Test factory
  const userFactory = factory()
    .model(UserModel)
    .attrs({
      name: () => 'Test User',
      email: () => 'test@example.com',
    })
    .traits({
      active: {
        status: 'active',
      },
    })
    .create();

  // Test identity manager
  const userIdentityManager = new StringIdentityManager();

  describe('constructor', () => {
    it('should create a new CollectionBuilder instance', () => {
      const builder = collection();
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });
  });

  describe('model method', () => {
    it('should set the model template and return a new builder instance', () => {
      const builder = collection().model(UserModel);
      expect(builder).toBeInstanceOf(CollectionBuilder);
      expect(builder).not.toBe(collection());
    });

    it('should preserve other configurations when setting template', () => {
      const builder = collection().factory(userFactory).model(UserModel);
      const testCollection = builder.create();
      expect(testCollection.model).toBe(UserModel);
      expect(testCollection.factory).toBe(userFactory);
    });
  });

  describe('factory method', () => {
    it('should set the factory and return a new builder instance', () => {
      const builder = collection().model(UserModel).factory(userFactory);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting factory', () => {
      const builder = collection().model(UserModel).factory(userFactory);
      const testCollection = builder.create();
      expect(testCollection.model).toBe(UserModel);
      expect(testCollection.factory).toBe(userFactory);
    });
  });

  describe('relationships method', () => {
    it('should set relationships and return a new builder instance', () => {
      const builder = collection()
        .model(UserModel)
        .relationships({
          posts: associations.hasMany(PostModel),
        });

      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting relationships', () => {
      const relationships = {
        posts: associations.hasMany(PostModel),
      };
      const builder = collection()
        .model(UserModel)
        .relationships(relationships)
        .factory(userFactory);
      const testCollection = builder.create();

      expect(testCollection.model).toBe(UserModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.relationships).toBe(relationships);
    });

    it('should work with associations helper', () => {
      const relationships = {
        posts: associations.hasMany(PostModel),
        profile: associations.belongsTo(UserModel, { foreignKey: 'profileId' }),
      };
      const testCollection = collection().model(UserModel).relationships(relationships).create();
      expect(testCollection.relationships).toBe(relationships);
    });
  });

  describe('identityManager method', () => {
    it('should set the identity manager and return a new builder instance', () => {
      const builder = collection().model(UserModel).identityManager(userIdentityManager);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting identity manager', () => {
      const testCollection = collection()
        .model(UserModel)
        .factory(userFactory)
        .identityManager(userIdentityManager)
        .create();

      expect(testCollection.model).toBe(UserModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.identityManager).toBe(userIdentityManager);
    });
  });

  describe('build method', () => {
    it('should create a SchemaCollectionConfig with model template only', () => {
      const testCollection = collection().model(UserModel).create();
      expect(testCollection.model).toBe(UserModel);
      expect(testCollection.factory).toBeUndefined();
      expect(testCollection.relationships).toBeUndefined();
      expect(testCollection.identityManager).toBeUndefined();
    });

    it('should create a complete SchemaCollectionConfig with all options', () => {
      const relationships = {
        posts: associations.hasMany(PostModel),
      };
      const testCollection = collection()
        .model(UserModel)
        .relationships(relationships)
        .factory(userFactory)
        .identityManager(userIdentityManager)
        .create();

      expect(testCollection.model).toBe(UserModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.relationships).toBe(relationships);
      expect(testCollection.identityManager).toBe(userIdentityManager);
    });

    it('should throw error when template is not set', () => {
      const builder = collection();
      expect(() => builder.create()).toThrow(
        '[Mirage]: Model template must be set before creating collection. Call .model() first.',
      );
    });
  });

  describe('fluent builder interface', () => {
    it('should support method chaining in different orders', () => {
      const relationships = {
        posts: associations.hasMany(PostModel),
      };

      // Order 1: relationships -> factory -> identityManager
      const collection1 = collection()
        .model(UserModel)
        .relationships(relationships)
        .factory(userFactory)
        .identityManager(userIdentityManager)
        .create();

      // Order 2: identityManager -> factory -> relationships
      const collection2 = collection()
        .model(UserModel)
        .identityManager(userIdentityManager)
        .factory(userFactory)
        .relationships(relationships)
        .create();

      expect(collection1.model).toBe(UserModel);
      expect(collection1.factory).toBe(userFactory);
      expect(collection1.relationships).toBe(relationships);
      expect(collection1.identityManager).toBe(userIdentityManager);

      expect(collection2.model).toBe(UserModel);
      expect(collection2.factory).toBe(userFactory);
      expect(collection2.relationships).toBe(relationships);
      expect(collection2.identityManager).toBe(userIdentityManager);
    });

    it('should allow overriding configurations', () => {
      const initialFactory = userFactory;
      const newFactory = factory()
        .model(UserModel)
        .attrs({
          name: () => 'New User',
          email: () => 'new@example.com',
        })
        .create();

      const testCollection = collection()
        .model(UserModel)
        .factory(initialFactory)
        .factory(newFactory)
        .create();

      expect(testCollection.factory).toBe(newFactory);
      expect(testCollection.factory).not.toBe(initialFactory);
    });

    it('should work with different identity manager types', () => {
      const stringIdManager = new StringIdentityManager();
      const numberIdManager = new NumberIdentityManager();

      const userCollection = collection()
        .model(UserModel)
        .identityManager(stringIdManager)
        .create();
      const postCollection = collection()
        .model(PostModel)
        .identityManager(numberIdManager)
        .create();

      expect(userCollection.identityManager).toBe(stringIdManager);
      expect(postCollection.identityManager).toBe(numberIdManager);
    });
  });
});
