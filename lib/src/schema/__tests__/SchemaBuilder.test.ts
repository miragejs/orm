import { associations } from '@src/associations';
import { factory } from '@src/factory';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';
import { model } from '@src/model';
import { MirageError } from '@src/utils';

import { collection } from '../CollectionBuilder';
import SchemaBuilder, { schema } from '../SchemaBuilder';

// Define test model attributes
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

// Create test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

// Create test factories
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

// Create test identity managers
const appIdentityManager = new StringIdentityManager();
const postIdentityManager = new NumberIdentityManager();

// Create test collections
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
  describe('Constructor', () => {
    it('should create a new SchemaBuilder instance', () => {
      const builder = schema();
      expect(builder).toBeInstanceOf(SchemaBuilder);
    });
  });

  describe('collections()', () => {
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

  describe('identityManager()', () => {
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

  describe('create()', () => {
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

  describe('Fluent builder interface', () => {
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

  describe('Integration with collection builder', () => {
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

  describe('Validation', () => {
    it('should throw error for empty collections', () => {
      expect(() => {
        schema().collections({}).setup();
      }).toThrow(MirageError);

      expect(() => {
        schema().collections({}).setup();
      }).toThrow('Schema must have at least one collection');
    });

    it('should throw error for reserved collection name: db', () => {
      const testModel = model().name('user').collection('users').create();
      const testCollection = collection().model(testModel).create();

      expect(() => {
        schema()
          .collections({
            db: testCollection as any,
          })
          .setup();
      }).toThrow(MirageError);

      expect(() => {
        schema()
          .collections({
            db: testCollection as any,
          })
          .setup();
      }).toThrow(`Collection name 'db' conflicts with existing Schema property or method`);
    });

    it('should throw error for reserved collection name: identityManager', () => {
      const testModel = model().name('user').collection('users').create();
      const testCollection = collection().model(testModel).create();

      expect(() => {
        schema()
          .collections({
            identityManager: testCollection as any,
          })
          .setup();
      }).toThrow('identityManager');
      expect(() => {
        schema()
          .collections({
            identityManager: testCollection as any,
          })
          .setup();
      }).toThrow('schema.identityManager: ID generation manager');
    });

    it('should throw error for reserved collection name: getCollection', () => {
      const testModel = model().name('user').collection('users').create();
      const testCollection = collection().model(testModel).create();

      expect(() => {
        schema()
          .collections({
            getCollection: testCollection as any,
          })
          .setup();
      }).toThrow('getCollection');
    });

    it('should throw error for reserved collection name: loadSeeds', () => {
      const testModel = model().name('user').collection('users').create();
      const testCollection = collection().model(testModel).create();

      expect(() => {
        schema()
          .collections({
            loadSeeds: testCollection as any,
          })
          .setup();
      }).toThrow('loadSeeds');
    });

    it('should throw error for reserved collection name: loadFixtures', () => {
      const testModel = model().name('user').collection('users').create();
      const testCollection = collection().model(testModel).create();

      expect(() => {
        schema()
          .collections({
            loadFixtures: testCollection as any,
          })
          .setup();
      }).toThrow('loadFixtures');
    });

    it('should throw error for invalid JavaScript identifier', () => {
      const testModel = model().name('user').collection('users').create();
      const testCollection = collection().model(testModel).create();

      expect(() => {
        schema()
          .collections({
            '123invalid': testCollection as any,
          })
          .setup();
      }).toThrow(MirageError);

      expect(() => {
        schema()
          .collections({
            '123invalid': testCollection as any,
          })
          .setup();
      }).toThrow('is not a valid JavaScript identifier');
    });

    it('should throw error for collection name with spaces', () => {
      const testModel = model().name('user').collection('users').create();
      const testCollection = collection().model(testModel).create();

      expect(() => {
        schema()
          .collections({
            'user collection': testCollection as any,
          })
          .setup();
      }).toThrow('is not a valid JavaScript identifier');
    });

    it('should allow valid collection names', () => {
      const testModel = model().name('user').collection('users').create();
      const testCollection = collection().model(testModel).create();

      expect(() => {
        schema()
          .collections({
            users: testCollection,
            posts: testCollection,
            blogPosts: testCollection,
            user_profiles: testCollection,
            $special: testCollection,
          })
          .setup();
      }).not.toThrow();
    });
  });
});
