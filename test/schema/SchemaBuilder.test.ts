import { associations } from '@src/associations';
import { factory } from '@src/factory';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';
import { model } from '@src/model';
import { schema, SchemaBuilder, collection } from '@src/schema';

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

const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

// Test factories
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => 'Test User',
    email: () => 'test@example.com',
  })
  .create();

const postFactory = factory()
  .model(postModel)
  .attrs({
    title: () => 'Test Post',
    content: () => 'Test content',
  })
  .create();

// Test identity managers
const appIdentityManager = new StringIdentityManager();
const postIdentityManager = new NumberIdentityManager();

// Test collections
const userCollection = collection()
  .model(userModel)
  .factory(userFactory)
  .relationships({
    posts: associations.hasMany(postModel),
  })
  .create();

const postCollection = collection()
  .model(postModel)
  .factory(postFactory)
  .relationships({
    author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
  })
  .identityManager(postIdentityManager)
  .create();

describe('SchemaBuilder', () => {
  describe('constructor', () => {
    it('should create a new SchemaBuilder instance', () => {
      const builder = schema();
      expect(builder).toBeInstanceOf(SchemaBuilder);
    });
  });

  describe('collections method', () => {
    it('should set collections and return a new builder instance', () => {
      const builder = schema().collections({
        users: userCollection,
        posts: postCollection,
      });

      expect(builder).toBeInstanceOf(SchemaBuilder);
      expect(builder).not.toBe(schema());
    });

    it('should preserve other configurations when setting collections', () => {
      const builder = schema().identityManager(appIdentityManager).collections({
        users: userCollection,
      });
      const schemaInstance = builder.setup();

      expect(schemaInstance.identityManager).toBe(appIdentityManager);
    });
  });

  describe('identityManager method', () => {
    it('should set the identity manager and return a new builder instance', () => {
      const builder = schema()
        .collections({ users: userCollection })
        .identityManager(appIdentityManager);

      expect(builder).toBeInstanceOf(SchemaBuilder);
    });

    it('should preserve other configurations when setting identity manager', () => {
      const collections = {
        users: userCollection,
      };
      const builder = schema().collections(collections).identityManager(appIdentityManager);
      const schemaInstance = builder.setup();

      expect(schemaInstance.identityManager).toBe(appIdentityManager);
    });
  });

  describe('build method', () => {
    it('should create a Schema instance with collections only', () => {
      const schemaInstance = schema()
        .collections({
          users: userCollection,
        })
        .setup();

      expect(schemaInstance).toBeDefined();
      expect(schemaInstance.db).toBeDefined();
      expect(schemaInstance.identityManager).toBeInstanceOf(StringIdentityManager);
    });

    it('should create a complete Schema instance with all options', () => {
      const schemaInstance = schema()
        .collections({
          users: userCollection,
          posts: postCollection,
        })
        .identityManager(appIdentityManager)
        .setup();

      expect(schemaInstance).toBeDefined();
      expect(schemaInstance.db).toBeDefined();
      expect(schemaInstance.identityManager).toBe(appIdentityManager);
    });

    it('should throw error when collections are not set', () => {
      const builder = schema();

      expect(() => builder.setup()).toThrow(
        'SchemaBuilder: collections are required. Call .collections() before .setup()',
      );
    });

    it('should provide access to collections via getCollection', () => {
      const schemaInstance = schema()
        .collections({
          users: userCollection,
          posts: postCollection,
        })
        .setup();

      const userSchemaCollection = schemaInstance.getCollection('users');
      const postSchemaCollection = schemaInstance.getCollection('posts');

      expect(userSchemaCollection).toBeDefined();
      expect(postSchemaCollection).toBeDefined();
    });

    it('should provide access to collections via property accessors', () => {
      const schemaInstance = schema()
        .collections({
          users: userCollection,
          posts: postCollection,
        })
        .setup();

      expect(schemaInstance.users).toBeDefined();
      expect(schemaInstance.posts).toBeDefined();
    });
  });

  describe('fluent interface', () => {
    it('should support method chaining in different orders', () => {
      const collections = {
        users: userCollection,
        posts: postCollection,
      };

      // Order 1: collections -> identityManager
      const schema1 = schema().collections(collections).identityManager(appIdentityManager).setup();
      // Order 2: identityManager -> collections
      const schema2 = schema().identityManager(appIdentityManager).collections(collections).setup();

      expect(schema1.identityManager).toBe(appIdentityManager);
      expect(schema2.identityManager).toBe(appIdentityManager);
    });
  });

  describe('integration with collection builder', () => {
    it('should work seamlessly with collection builder API', () => {
      const appSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .factory(userFactory)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .create(),
          posts: collection()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .identityManager(postIdentityManager)
            .create(),
        })
        .identityManager(appIdentityManager)
        .setup();

      expect(appSchema).toBeDefined();
      expect(appSchema.identityManager).toBe(appIdentityManager);

      // Test collection access
      const userSchemaCollection = appSchema.getCollection('users');
      const postSchemaCollection = appSchema.getCollection('posts');

      expect(userSchemaCollection).toBeDefined();
      expect(postSchemaCollection).toBeDefined();
    });

    it('should handle complex relationship configurations', () => {
      const complexSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .create(),
          posts: collection()
            .model(postModel)
            .relationships({
              author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

      expect(complexSchema).toBeDefined();

      const userCollection = complexSchema.getCollection('users');
      const postCollection = complexSchema.getCollection('posts');

      expect(userCollection.relationships).toBeDefined();
      expect(postCollection.relationships).toBeDefined();
    });
  });
});
