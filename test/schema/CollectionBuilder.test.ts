import { Factory } from '@src/factory';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';
import { belongsTo, hasMany } from '@src/associations';
// import { Serializer } from '@src/serializer';
import { collection, CollectionBuilder, associations } from '@src/schema';
import { token } from '@src/token';

describe('CollectionBuilder', () => {
  // Test tokens
  interface UserAttrs {
    id: string;
    name: string;
    email: string;
  }

  interface PostAttrs {
    id: number;
    title: string;
    content: string;
    authorId: string;
  }

  const userToken = token('user', 'users').attrs<UserAttrs>().create();
  const postToken = token('post', 'posts').attrs<PostAttrs>().create();

  // Test factory
  const userFactory = new Factory(userToken, {
    name: () => 'Test User',
    email: () => 'test@example.com',
  });

  // Test serializer (temporarily disabled)
  // const userSerializer = new Serializer(userToken, {
  //   only: ['name', 'email'],
  // });

  // Test identity manager
  const userIdentityManager = new StringIdentityManager();

  describe('constructor', () => {
    it('should create a new CollectionBuilder instance', () => {
      const builder = collection();
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });
  });

  describe('token method', () => {
    it('should set the token and return a new builder instance', () => {
      const builder = collection().token(userToken);
      expect(builder).toBeInstanceOf(CollectionBuilder);
      expect(builder).not.toBe(collection());
    });

    it('should preserve other configurations when setting token', () => {
      const builder = collection()
        .factory(userFactory as any)
        .token(userToken);

      const config = builder.build();
      expect(config.model).toBe(userToken);
      expect(config.factory).toBe(userFactory);
    });
  });

  describe('factory method', () => {
    it('should set the factory and return a new builder instance', () => {
      const builder = collection().token(userToken).factory(userFactory);

      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting factory', () => {
      const builder = collection().token(userToken).factory(userFactory);

      const config = builder.build();
      expect(config.model).toBe(userToken);
      expect(config.factory).toBe(userFactory);
    });
  });

  describe('relationships method', () => {
    it('should set relationships and return a new builder instance', () => {
      const relationships = {
        posts: hasMany(postToken),
      };

      const builder = collection().token(userToken).relationships(relationships);

      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting relationships', () => {
      const relationships = {
        posts: hasMany(postToken),
      };

      const builder = collection()
        .token(userToken)
        .factory(userFactory)
        .relationships(relationships);

      const config = builder.build();
      expect(config.model).toBe(userToken);
      expect(config.factory).toBe(userFactory);
      expect(config.relationships).toBe(relationships);
    });

    it('should work with associations helper', () => {
      const relationships = {
        posts: associations.hasMany(postToken),
        profile: associations.belongsTo(userToken, { foreignKey: 'profileId' }),
      };

      const builder = collection().token(userToken).relationships(relationships);

      const config = builder.build();
      expect(config.relationships).toBe(relationships);
    });
  });

  describe('serializer method', () => {
    it('should be temporarily disabled', () => {
      // Serializer method is temporarily disabled
      const builder = collection().token(userToken);
      expect(builder.serializer).toBeUndefined();
    });
  });

  describe('identityManager method', () => {
    it('should set the identity manager and return a new builder instance', () => {
      const builder = collection().token(userToken).identityManager(userIdentityManager);

      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting identity manager', () => {
      const builder = collection()
        .token(userToken)
        .factory(userFactory)
        .identityManager(userIdentityManager);

      const config = builder.build();
      expect(config.model).toBe(userToken);
      expect(config.factory).toBe(userFactory);
      expect(config.identityManager).toBe(userIdentityManager);
    });
  });

  describe('build method', () => {
    it('should create a SchemaCollectionConfig with token only', () => {
      const config = collection().token(userToken).build();

      expect(config.model).toBe(userToken);
      expect(config.factory).toBeUndefined();
      expect(config.relationships).toBeUndefined();
      expect(config.identityManager).toBeUndefined();
    });

    it('should create a complete SchemaCollectionConfig with all options', () => {
      const relationships = {
        posts: hasMany(postToken),
      };

      const config = collection()
        .token(userToken)
        .factory(userFactory)
        .relationships(relationships)
        .identityManager(userIdentityManager)
        .build();

      expect(config.model).toBe(userToken);
      expect(config.factory).toBe(userFactory);
      expect(config.relationships).toBe(relationships);
      expect(config.identityManager).toBe(userIdentityManager);
    });

    it('should throw error when token is not set', () => {
      const builder = collection();

      expect(() => builder.build()).toThrow(
        'CollectionBuilder: token is required. Call .token() before .build()',
      );
    });
  });

  describe('fluent interface', () => {
    it('should support method chaining in different orders', () => {
      const relationships = {
        posts: hasMany(postToken),
      };

      // Order 1: token -> factory -> relationships -> identityManager
      const config1 = collection()
        .token(userToken)
        .factory(userFactory)
        .relationships(relationships)
        .identityManager(userIdentityManager)
        .build();

      // Order 2: factory -> relationships -> token -> identityManager
      const config2 = collection()
        .factory(userFactory as any)
        .relationships(relationships as any)
        .token(userToken)
        .identityManager(userIdentityManager)
        .build();

      expect(config1.model).toBe(userToken);
      expect(config1.factory).toBe(userFactory);
      expect(config1.relationships).toBe(relationships);
      expect(config1.identityManager).toBe(userIdentityManager);

      expect(config2.model).toBe(userToken);
      expect(config2.factory).toBe(userFactory);
      expect(config2.relationships).toBe(relationships);
      expect(config2.identityManager).toBe(userIdentityManager);
    });

    it('should allow overriding configurations', () => {
      const initialFactory = userFactory;
      const newFactory = new Factory(userToken, {
        name: () => 'New User',
        email: () => 'new@example.com',
      });

      const config = collection()
        .token(userToken)
        .factory(initialFactory)
        .factory(newFactory) // Override
        .build();

      expect(config.factory).toBe(newFactory);
      expect(config.factory).not.toBe(initialFactory);
    });

    it('should work with different identity manager types', () => {
      const stringIdManager = new StringIdentityManager();
      const numberIdManager = new NumberIdentityManager();

      const config1 = collection().token(userToken).identityManager(stringIdManager).build();

      const config2 = collection().token(postToken).identityManager(numberIdManager).build();

      expect(config1.identityManager).toBe(stringIdManager);
      expect(config2.identityManager).toBe(numberIdManager);
    });
  });

  describe('type safety', () => {
    it('should maintain type safety throughout the builder chain', () => {
      const relationships = {
        posts: hasMany(postToken),
      };

      // This should compile without type errors
      const config = collection()
        .token(userToken)
        .factory(userFactory)
        .relationships(relationships)
        .identityManager(userIdentityManager)
        .build();

      expect(config.model.modelName).toBe('user');
      expect(config.model.collectionName).toBe('users');
    });
  });
});
