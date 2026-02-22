import { factory } from '@src/factory';
import type { IdentityManagerConfig } from '@src/id-manager';
import { model } from '@src/model';
import { relations, hasMany, belongsTo } from '@src/relations';
import { Serializer, type SerializerConfig } from '@src/serializer';
import { MirageError } from '@src/utils';

import CollectionBuilder, { collection } from '../CollectionBuilder';

// Define test model attributes
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

// Create test factory
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: () => 'Test User',
    email: () => 'test@example.com',
  })
  .traits({
    active: {
      status: 'active',
    },
  })
  .build();

// Create test identity manager config
const userIdentityManagerConfig: IdentityManagerConfig<string> = {
  initialCounter: '1',
};

describe('CollectionBuilder', () => {
  describe('CollectionBuilder class', () => {
    it('should create a CollectionBuilder instance', () => {
      const builder = new CollectionBuilder();
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should allow method chaining with model()', () => {
      const builder = new CollectionBuilder().model(userModel);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should allow method chaining with model() and factory()', () => {
      const builder = new CollectionBuilder()
        .model(userModel)
        .factory(userFactory);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should allow method chaining with all configuration methods', () => {
      const relationships = {
        posts: relations.hasMany(postModel),
      };
      const builder = new CollectionBuilder()
        .model(userModel)
        .factory(userFactory)
        .relationships(relationships)
        .identityManager(userIdentityManagerConfig);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should create a CollectionConfig with create()', () => {
      const testCollection = new CollectionBuilder().model(userModel).build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBeUndefined();
      expect(testCollection.relationships).toBeUndefined();
      expect(testCollection.identityManager).toBeUndefined();
    });

    it('should create a complete CollectionConfig with all options', () => {
      const relationships = {
        posts: relations.hasMany(postModel),
      };
      const testCollection = new CollectionBuilder()
        .model(userModel)
        .factory(userFactory)
        .relationships(relationships)
        .identityManager(userIdentityManagerConfig)
        .serializer({ root: true })
        .build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.relationships).toBe(relationships);
      expect(testCollection.identityManager).toBe(userIdentityManagerConfig);
      expect(testCollection.serializer).toEqual({ root: true });
    });

    it('should throw error if model is not set', () => {
      expect(() => {
        new CollectionBuilder().build();
      }).toThrow(
        '[Mirage]: Model template must be set before building collection. Call .model() first.',
      );
    });

    it('should throw error if model is not set even with other configs', () => {
      expect(() => {
        new CollectionBuilder()
          .factory(userFactory)
          // Cast to any since this test verifies runtime validation, not types
          .identityManager(userIdentityManagerConfig as any)
          .build();
      }).toThrow(
        '[Mirage]: Model template must be set before building collection. Call .model() first.',
      );
    });
  });

  describe('collection()', () => {
    it('should create a CollectionBuilder instance', () => {
      const builder = collection();
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should support fluent API', () => {
      const testCollection = collection()
        .model(userModel)
        .factory(userFactory)
        .build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
    });

    it('should create collection with only model template', () => {
      const testCollection = collection().model(userModel).build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBeUndefined();
    });

    it('should allow flexible method order', () => {
      const collection1 = collection()
        .model(userModel)
        .factory(userFactory)
        .build();
      const collection2 = collection()
        .factory(userFactory)
        .model(userModel)
        .build();

      expect(collection1.model).toBe(userModel);
      expect(collection1.factory).toBe(userFactory);
      expect(collection2.model).toBe(userModel);
      expect(collection2.factory).toBe(userFactory);
    });
  });

  describe('model()', () => {
    it('should set the model template and return a new builder instance', () => {
      const builder = collection().model(userModel);
      expect(builder).toBeInstanceOf(CollectionBuilder);
      expect(builder).not.toBe(collection());
    });

    it('should preserve other configurations when setting template', () => {
      const builder = collection().factory(userFactory).model(userModel);
      const testCollection = builder.build();
      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
    });
  });

  describe('factory()', () => {
    it('should set the factory and return a new builder instance', () => {
      const builder = collection().model(userModel).factory(userFactory);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting factory', () => {
      const builder = collection().model(userModel).factory(userFactory);
      const testCollection = builder.build();
      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
    });
  });

  describe('relationships()', () => {
    it('should set relationships and return a new builder instance', () => {
      const builder = collection()
        .model(userModel)
        .relationships({
          posts: relations.hasMany(postModel),
        });

      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting relationships', () => {
      const relationships = {
        posts: relations.hasMany(postModel),
      };
      const builder = collection()
        .model(userModel)
        .relationships(relationships)
        .factory(userFactory);
      const testCollection = builder.build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.relationships).toBe(relationships);
    });

    it('should work with associations helper', () => {
      const relationships = {
        posts: relations.hasMany(postModel),
        profile: relations.belongsTo(userModel, { foreignKey: 'profileId' }),
      };
      const testCollection = collection()
        .model(userModel)
        .relationships(relationships)
        .build();
      expect(testCollection.relationships).toBe(relationships);
    });
  });

  describe('identityManager()', () => {
    it('should set the identity manager and return a new builder instance', () => {
      const builder = collection()
        .model(userModel)
        .identityManager(userIdentityManagerConfig);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting identity manager', () => {
      const testCollection = collection()
        .model(userModel)
        .factory(userFactory)
        .identityManager(userIdentityManagerConfig)
        .build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.identityManager).toBe(userIdentityManagerConfig);
    });
  });

  describe('serializer()', () => {
    it('should set serializer config and return a new builder instance', () => {
      const builder = collection().model(userModel).serializer({ root: true });
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should set serializer instance and return a new builder instance', () => {
      const customSerializer = new Serializer(userModel, { root: 'userData' });
      const builder = collection()
        .model(userModel)
        .serializer(customSerializer);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should preserve other configurations when setting serializer config', () => {
      const testCollection = collection()
        .model(userModel)
        .factory(userFactory)
        .serializer({ select: ['id', 'name'] })
        .build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.serializer).toEqual({
        select: ['id', 'name'],
      });
    });

    it('should preserve other configurations when setting serializer instance', () => {
      const customSerializer = new Serializer(userModel, { root: true });
      const testCollection = collection()
        .model(userModel)
        .factory(userFactory)
        .serializer(customSerializer)
        .build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.serializer).toBe(customSerializer);
    });

    it('should support select filtering config', () => {
      const testCollection = collection()
        .model(userModel)
        .serializer({ select: ['id', 'name', 'email'] })
        .build();

      expect(testCollection.serializer).toEqual({
        select: ['id', 'name', 'email'],
      });
    });

    it('should support root wrapping config', () => {
      const testCollection = collection()
        .model(userModel)
        .serializer({ root: true })
        .build();

      expect(testCollection.serializer).toEqual({ root: true });
    });

    it('should support custom root key config', () => {
      const testCollection = collection()
        .model(userModel)
        .serializer({ root: 'customUser' })
        .build();

      expect(testCollection.serializer).toEqual({ root: 'customUser' });
    });

    it('should support combined config options', () => {
      const testCollection = collection()
        .model(userModel)
        .serializer({
          root: 'userData',
          select: ['id', 'name'],
          relationsMode: 'embedded',
        })
        .build();

      expect(testCollection.serializer).toEqual({
        root: 'userData',
        select: ['id', 'name'],
        relationsMode: 'embedded',
      });
    });

    it('should allow overriding serializer config', () => {
      const testCollection = collection()
        .model(userModel)
        .serializer({ root: true })
        .serializer({ root: false, select: ['id'] })
        .build();

      expect(testCollection.serializer).toEqual({
        root: false,
        select: ['id'],
      });
    });

    it('should allow switching from config to instance', () => {
      const customSerializer = new Serializer(userModel, { root: 'custom' });
      const testCollection = collection()
        .model(userModel)
        .serializer({ root: true })
        .serializer(customSerializer)
        .build();

      expect(testCollection.serializer).toBe(customSerializer);
    });

    it('should allow switching from instance to config', () => {
      const customSerializer = new Serializer(userModel, { root: 'custom' });
      const testCollection = collection()
        .model(userModel)
        .serializer(customSerializer)
        .serializer({ select: ['id', 'name'] })
        .build();

      expect(testCollection.serializer).toEqual({
        select: ['id', 'name'],
      });
    });

    it('should work with relationships and serializer together', () => {
      const relationships = {
        posts: relations.hasMany(postModel),
      };
      const testCollection = collection()
        .model(userModel)
        .relationships(relationships)
        .serializer({ root: true, with: ['posts'] })
        .build();

      expect(testCollection.relationships).toBe(relationships);
      expect(testCollection.serializer).toEqual({
        root: true,
        with: ['posts'],
      });
    });
  });

  describe('seeds()', () => {
    it('should set a seed function and return a new builder instance', () => {
      const seedFn = () => {};
      const builder = collection().model(userModel).seeds(seedFn);
      expect(builder).toBeInstanceOf(CollectionBuilder);
    });

    it('should set seed function in the config', () => {
      const seedFn = () => {};
      const testCollection = collection()
        .model(userModel)
        .seeds(seedFn)
        .build();
      expect(testCollection.seeds).toBe(seedFn);
    });

    it('should set named scenario seeds in the config', () => {
      const seedScenarios = {
        basic: () => {},
        admin: () => {},
      };
      const testCollection = collection()
        .model(userModel)
        .seeds(seedScenarios)
        .build();
      expect(testCollection.seeds).toBe(seedScenarios);
    });

    it('should allow "default" to be used as a scenario name', () => {
      const seedFn = () => {};
      const testCollection = collection()
        .model(userModel)
        .seeds({
          default: seedFn,
        })
        .build();

      expect(testCollection.seeds).toEqual({ default: seedFn });
    });

    it('should preserve other configurations when setting seeds', () => {
      const seedFn = () => {};
      const testCollection = collection()
        .model(userModel)
        .factory(userFactory)
        .identityManager(userIdentityManagerConfig)
        .seeds(seedFn)
        .build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.identityManager).toBe(userIdentityManagerConfig);
      expect(testCollection.seeds).toBe(seedFn);
    });
  });

  describe('Type safety', () => {
    it('should maintain type information through the builder chain', () => {
      const relationships = {
        posts: relations.hasMany(postModel),
      };
      const testCollection = collection()
        .model(userModel)
        .relationships(relationships)
        .factory(userFactory)
        .identityManager(userIdentityManagerConfig)
        .build();

      // These should be type-safe (no TypeScript errors)
      expect(testCollection.model).toBe(userModel);
      expect(testCollection.factory).toBe(userFactory);
      expect(testCollection.relationships).toBe(relationships);
      expect(testCollection.identityManager).toBe(userIdentityManagerConfig);
    });

    it('should support serializer() method for specifying serialization config', () => {
      const testCollection = collection()
        .model(userModel)
        .serializer({ root: true, select: ['id', 'name'] })
        .build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.serializer).toEqual({
        root: true,
        select: ['id', 'name'],
      });
    });

    it('should support serializer() method for specifying serializer instance', () => {
      const customSerializer = new Serializer(userModel, { root: 'user' });
      const testCollection = collection()
        .model(userModel)
        .serializer(customSerializer)
        .build();

      expect(testCollection.model).toBe(userModel);
      expect(testCollection.serializer).toBe(customSerializer);
    });
  });

  describe('Fluent builder interface', () => {
    it('should support method chaining in different orders', () => {
      const relationships = {
        posts: relations.hasMany(postModel),
      };
      const serializerConfig: SerializerConfig<typeof userModel> = {
        root: true,
        select: ['id', 'name'],
      };

      // Order 1: relationships -> factory -> identityManager -> serializer
      const collection1 = collection()
        .model(userModel)
        .relationships(relationships)
        .factory(userFactory)
        .identityManager(userIdentityManagerConfig)
        .serializer(serializerConfig)
        .build();

      // Order 2: serializer -> identityManager -> factory -> relationships
      const collection2 = collection()
        .model(userModel)
        .serializer(serializerConfig)
        .identityManager(userIdentityManagerConfig)
        .factory(userFactory)
        .relationships(relationships)
        .build();

      expect(collection1.model).toBe(userModel);
      expect(collection1.factory).toBe(userFactory);
      expect(collection1.relationships).toBe(relationships);
      expect(collection1.identityManager).toBe(userIdentityManagerConfig);
      expect(collection1.serializer).toEqual(serializerConfig);

      expect(collection2.model).toBe(userModel);
      expect(collection2.factory).toBe(userFactory);
      expect(collection2.relationships).toBe(relationships);
      expect(collection2.identityManager).toBe(userIdentityManagerConfig);
      expect(collection2.serializer).toEqual(serializerConfig);
    });

    it('should allow overriding configurations', () => {
      const initialFactory = userFactory;
      const newFactory = factory()
        .model(userModel)
        .attrs({
          name: () => 'New User',
          email: () => 'new@example.com',
        })
        .build();

      const testCollection = collection()
        .model(userModel)
        .factory(initialFactory)
        .factory(newFactory)
        .build();

      expect(testCollection.factory).toBe(newFactory);
      expect(testCollection.factory).not.toBe(initialFactory);
    });

    it('should work with different identity manager configs', () => {
      const stringIdConfig: IdentityManagerConfig<string> = {
        initialCounter: '1',
      };
      const numberIdConfig: IdentityManagerConfig<number> = {
        initialCounter: 1,
      };

      const userCollection = collection()
        .model(userModel)
        .identityManager(stringIdConfig)
        .build();
      const postCollection = collection()
        .model(postModel)
        .identityManager(numberIdConfig)
        .build();

      expect(userCollection.identityManager).toEqual(stringIdConfig);
      expect(postCollection.identityManager).toEqual(numberIdConfig);
    });
  });

  describe('Validation', () => {
    describe('model()', () => {
      it('should throw error for null template', () => {
        expect(() => {
          collection().model(null as any);
        }).toThrow(MirageError);

        expect(() => {
          collection().model(null as any);
        }).toThrow('Invalid model template');
      });

      it('should throw error for non-object template', () => {
        expect(() => {
          collection().model('invalid' as any);
        }).toThrow('Invalid model template');
      });

      it('should throw error for template missing modelName', () => {
        expect(() => {
          collection().model({ collectionName: 'users' } as any);
        }).toThrow(MirageError);

        expect(() => {
          collection().model({ collectionName: 'users' } as any);
        }).toThrow('Model template is missing modelName property');
      });

      it('should throw error for template missing collectionName', () => {
        expect(() => {
          collection().model({ modelName: 'user' } as any);
        }).toThrow(MirageError);

        expect(() => {
          collection().model({ modelName: 'user' } as any);
        }).toThrow('Model template is missing collectionName property');
      });

      it('should accept valid model template', () => {
        const validModel = model().name('user').collection('users').build();

        expect(() => {
          collection().model(validModel);
        }).not.toThrow();
      });
    });

    describe('relationships()', () => {
      const testUserModel = model().name('user').collection('users').build();
      const testPostModel = model().name('post').collection('posts').build();

      it('should throw error for null relationships', () => {
        expect(() => {
          collection()
            .model(testUserModel)
            .relationships(null as any);
        }).toThrow(MirageError);

        expect(() => {
          collection()
            .model(testUserModel)
            .relationships(null as any);
        }).toThrow('Invalid relationships configuration');
      });

      it('should throw error for non-object relationships', () => {
        expect(() => {
          collection()
            .model(testUserModel)
            .relationships('invalid' as any);
        }).toThrow('Invalid relationships configuration');
      });

      it('should throw error for invalid relationship object', () => {
        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: 'invalid' as any,
            });
        }).toThrow(MirageError);

        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: 'invalid' as any,
            });
        }).toThrow(`Invalid relationship 'posts'`);
      });

      it('should throw error for relationship missing type', () => {
        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: { targetModel: testPostModel } as any,
            });
        }).toThrow(MirageError);

        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: { targetModel: testPostModel } as any,
            });
        }).toThrow(`Relationship 'posts' is missing type property`);
      });

      it('should throw error for unsupported relationship type', () => {
        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: { type: 'hasOne', targetModel: testPostModel } as any,
            });
        }).toThrow(MirageError);

        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: { type: 'hasOne', targetModel: testPostModel } as any,
            });
        }).toThrow(`Relationship 'posts' has unsupported type 'hasOne'`);

        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: { type: 'hasOne', targetModel: testPostModel } as any,
            });
        }).toThrow('hasMany: One-to-many relationship');

        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: { type: 'hasOne', targetModel: testPostModel } as any,
            });
        }).toThrow('belongsTo: Many-to-one relationship');
      });

      it('should throw error for relationship missing targetModel', () => {
        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: { type: 'hasMany' } as any,
            });
        }).toThrow(MirageError);

        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: { type: 'hasMany' } as any,
            });
        }).toThrow(`Relationship 'posts' is missing model reference`);
      });

      it('should accept valid relationships', () => {
        expect(() => {
          collection()
            .model(testUserModel)
            .relationships({
              posts: hasMany(testPostModel),
            });
        }).not.toThrow();

        expect(() => {
          collection()
            .model(testPostModel)
            .relationships({
              author: belongsTo(testUserModel),
            });
        }).not.toThrow();
      });
    });

    describe('fixtures()', () => {
      interface TestUserAttrs {
        id: string;
        name: string;
        email: string;
      }

      const fixtureUserModel = model()
        .name('user')
        .collection('users')
        .attrs<TestUserAttrs>()
        .build();

      it('should throw error for non-array fixtures', () => {
        expect(() => {
          collection()
            .model(fixtureUserModel)
            .fixtures('invalid' as any);
        }).toThrow(MirageError);

        expect(() => {
          collection()
            .model(fixtureUserModel)
            .fixtures('invalid' as any);
        }).toThrow('Fixtures must be an array of records');
      });

      it('should throw error for invalid fixture record', () => {
        expect(() => {
          collection()
            .model(fixtureUserModel)
            .fixtures([null as any]);
        }).toThrow(MirageError);

        expect(() => {
          collection()
            .model(fixtureUserModel)
            .fixtures([null as any]);
        }).toThrow('Fixture at index 0 is invalid');
      });

      it('should throw error for fixture missing id', () => {
        expect(() => {
          collection()
            .model(fixtureUserModel)
            .fixtures([{ name: 'John', email: 'john@example.com' } as any]);
        }).toThrow(MirageError);

        expect(() => {
          collection()
            .model(fixtureUserModel)
            .fixtures([{ name: 'John', email: 'john@example.com' } as any]);
        }).toThrow("Fixture at index 0 is missing required 'id' property");
      });

      it('should throw error for fixture with null id', () => {
        expect(() => {
          collection()
            .model(fixtureUserModel)
            .fixtures([
              { id: null, name: 'John', email: 'john@example.com' } as any,
            ]);
        }).toThrow("Fixture at index 0 is missing required 'id' property");
      });

      it('should accept valid fixtures', () => {
        expect(() => {
          collection()
            .model(fixtureUserModel)
            .fixtures([
              { id: '1', name: 'John', email: 'john@example.com' },
              { id: '2', name: 'Jane', email: 'jane@example.com' },
            ]);
        }).not.toThrow();
      });

      it('should accept empty fixtures array', () => {
        expect(() => {
          collection().model(fixtureUserModel).fixtures([]);
        }).not.toThrow();
      });
    });
  });
});
