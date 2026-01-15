import { factory } from '@src/factory';
import type { IdentityManagerConfig } from '@src/id-manager';
import { model } from '@src/model';
import { relations } from '@src/relations';
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
}

// Create test models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .build();
const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .build();

// Create test factories
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => 'Test User',
    email: () => 'test@example.com',
  })
  .build();

const postFactory = factory()
  .model(postModel)
  .attrs({
    title: () => 'Test Post',
    content: () => 'Test content',
  })
  .build();

// Create test identity manager configs
const postIdentityManagerConfig: IdentityManagerConfig<number> = {
  initialCounter: 1,
};

// Create test collections
const userCollection = collection()
  .model(userModel)
  .factory(userFactory)
  .relationships({
    posts: relations.hasMany(postModel),
  })
  .build();

const postCollection = collection()
  .model(postModel)
  .factory(postFactory)
  .relationships({
    author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
  })
  .identityManager(postIdentityManagerConfig)
  .build();

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
  });

  describe('setup()', () => {
    it('should create a Schema instance with collections', () => {
      const schemaInstance = schema()
        .collections({
          users: userCollection,
        })
        .build();

      expect(schemaInstance).toBeDefined();
      expect(schemaInstance.db).toBeDefined();
    });

    it('should create a complete Schema instance with all options', () => {
      const schemaInstance = schema()
        .collections({
          users: userCollection,
          posts: postCollection,
        })
        .build();

      expect(schemaInstance).toBeDefined();
      expect(schemaInstance.db).toBeDefined();
    });

    it('should throw error when collections are not set', () => {
      const builder = schema();

      expect(() => builder.build()).toThrow(
        'SchemaBuilder: collections are required. Call .collections() before .build()',
      );
    });

    it('should provide access to collections via getCollection', () => {
      const schemaInstance = schema()
        .collections({
          users: userCollection,
          posts: postCollection,
        })
        .build();

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
        .build();

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

      // Order 1: collections -> logging
      const schema1 = schema()
        .collections(collections)
        .logging({ enabled: false, level: 'info' })
        .build();
      // Order 2: logging -> collections
      const schema2 = schema()
        .logging({ enabled: false, level: 'info' })
        .collections(collections)
        .build();

      expect(schema1.db).toBeDefined();
      expect(schema2.db).toBeDefined();
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
              posts: relations.hasMany(postModel),
            })
            .build(),
          posts: collection()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: relations.belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .identityManager(postIdentityManagerConfig)
            .build(),
        })
        .build();

      expect(appSchema).toBeDefined();

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
              posts: relations.hasMany(postModel),
            })
            .build(),
          posts: collection()
            .model(postModel)
            .relationships({
              author: relations.belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .build(),
        })
        .build();

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
        schema().collections({}).build();
      }).toThrow(MirageError);

      expect(() => {
        schema().collections({}).build();
      }).toThrow('Schema must have at least one collection');
    });

    it('should throw error for reserved collection name: db', () => {
      const testModel = model().name('user').collection('users').build();
      const testCollection = collection().model(testModel).build();

      expect(() => {
        schema()
          .collections({
            db: testCollection,
          })
          .build();
      }).toThrow(MirageError);

      expect(() => {
        schema()
          .collections({
            db: testCollection,
          })
          .build();
      }).toThrow(
        `Collection name 'db' conflicts with existing Schema property or method`,
      );
    });

    it('should throw error for reserved collection name: getCollection', () => {
      const testModel = model().name('user').collection('users').build();
      const testCollection = collection().model(testModel).build();

      expect(() => {
        schema()
          .collections({
            getCollection: testCollection,
          })
          .build();
      }).toThrow('getCollection');
    });

    it('should throw error for reserved collection name: loadSeeds', () => {
      const testModel = model().name('user').collection('users').build();
      const testCollection = collection().model(testModel).build();

      expect(() => {
        schema()
          .collections({
            loadSeeds: testCollection,
          })
          .build();
      }).toThrow('loadSeeds');
    });

    it('should throw error for reserved collection name: loadFixtures', () => {
      const testModel = model().name('user').collection('users').build();
      const testCollection = collection().model(testModel).build();

      expect(() => {
        schema()
          .collections({
            loadFixtures: testCollection,
          })
          .build();
      }).toThrow('loadFixtures');
    });

    it('should throw error for invalid JavaScript identifier', () => {
      const testModel = model().name('user').collection('users').build();
      const testCollection = collection().model(testModel).build();

      expect(() => {
        schema()
          .collections({
            '123invalid': testCollection,
          })
          .build();
      }).toThrow(MirageError);

      expect(() => {
        schema()
          .collections({
            '123invalid': testCollection,
          })
          .build();
      }).toThrow('is not a valid JavaScript identifier');
    });

    it('should throw error for collection name with spaces', () => {
      const testModel = model().name('user').collection('users').build();
      const testCollection = collection().model(testModel).build();

      expect(() => {
        schema()
          .collections({
            'user collection': testCollection,
          })
          .build();
      }).toThrow('is not a valid JavaScript identifier');
    });

    it('should allow valid collection names', () => {
      const testModel = model().name('user').collection('users').build();
      const testCollection = collection().model(testModel).build();

      expect(() => {
        schema()
          .collections({
            users: testCollection,
            posts: testCollection,
            blogPosts: testCollection,
            user_profiles: testCollection,
            $special: testCollection,
          })
          .build();
      }).not.toThrow();
    });
  });
});
