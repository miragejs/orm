import { MirageError } from '@src/utils';

import { collection } from '../CollectionBuilder';
import { schema } from '../SchemaBuilder';
import type { CollectionConfig } from '../types';

import { userModel, postModel, type UserModel, type PostModel } from './test-helpers';

// Define shared schema type
type TestSchema = {
  users: CollectionConfig<UserModel>;
  posts: CollectionConfig<PostModel>;
};

describe('Schema with Fixtures', () => {
  describe('CollectionBuilder.fixtures()', () => {
    it('should accept fixture records and default to manual loading', () => {
      const fixtures = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' },
      ];

      const usersCollection = collection<TestSchema>().model(userModel).fixtures(fixtures).create();

      expect(usersCollection.fixtures).toBeDefined();
      expect(usersCollection.fixtures?.records).toEqual(fixtures);
      expect(usersCollection.fixtures?.strategy).toBe('manual');
    });

    it('should accept auto loading strategy', () => {
      const fixtures = [{ id: '1', name: 'John', email: 'john@example.com' }];

      const usersCollection = collection<TestSchema>()
        .model(userModel)
        .fixtures(fixtures, { strategy: 'auto' })
        .create();

      expect(usersCollection.fixtures?.strategy).toBe('auto');
    });

    it('should preserve other configurations when setting fixtures', () => {
      const fixtures = [{ id: '1', name: 'John', email: 'john@example.com' }];

      const testSchema = schema()
        .collections({
          users: collection<TestSchema>().model(userModel).fixtures(fixtures).create(),
        })
        .setup();

      expect(testSchema.users).toBeDefined();
    });
  });

  describe('Collection.loadFixtures()', () => {
    describe('with manual loading', () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([
              { id: '1', name: 'John', email: 'john@example.com' },
              { id: '2', name: 'Jane', email: 'jane@example.com' },
            ])
            .create(),
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      beforeEach(() => {
        testSchema.db.emptyData();
      });

      it('should load fixtures when called', async () => {
        await testSchema.users.loadFixtures();

        const users = testSchema.users.all();
        expect(users.length).toBe(2);
        expect(users.models[0].id).toBe('1');
        expect(users.models[0].name).toBe('John');
        expect(users.models[1].id).toBe('2');
        expect(users.models[1].name).toBe('Jane');
      });

      it('should not load fixtures automatically', () => {
        const users = testSchema.users.all();
        expect(users.length).toBe(0);
      });

      it('should preserve fixture IDs exactly as specified', async () => {
        await testSchema.users.loadFixtures();

        const user1 = testSchema.users.find('1');
        const user2 = testSchema.users.find('2');

        expect(user1).toBeDefined();
        expect(user1?.id).toBe('1');
        expect(user2).toBeDefined();
        expect(user2?.id).toBe('2');
      });
    });

    describe('with auto loading', () => {
      it('should auto-load fixtures during schema setup', () => {
        const testSchema = schema()
          .collections({
            users: collection<TestSchema>()
              .model(userModel)
              .fixtures(
                [
                  { id: '1', name: 'Auto User 1', email: 'auto1@example.com' },
                  { id: '2', name: 'Auto User 2', email: 'auto2@example.com' },
                ],
                { strategy: 'auto' },
              )
              .create(),
          })
          .setup();

        // Fixtures should already be loaded
        const users = testSchema.users.all();
        expect(users.length).toBe(2);
        expect(users.models[0].name).toBe('Auto User 1');
        expect(users.models[1].name).toBe('Auto User 2');
      });

      it('should handle multiple collections with auto-loading', () => {
        const testSchema = schema()
          .collections({
            users: collection<TestSchema>()
              .model(userModel)
              .fixtures([{ id: '1', name: 'User', email: 'user@example.com' }], {
                strategy: 'auto',
              })
              .create(),
            posts: collection<TestSchema>()
              .model(postModel)
              .fixtures(
                [
                  { id: 1, title: 'Post 1', content: 'Content 1' },
                  { id: 2, title: 'Post 2', content: 'Content 2' },
                ],
                { strategy: 'auto' },
              )
              .create(),
          })
          .setup();

        const users = testSchema.users.all();
        const posts = testSchema.posts.all();

        expect(users.length).toBe(1);
        expect(posts.length).toBe(2);
      });
    });

    describe('with no fixtures configured', () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>().model(userModel).create(),
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      beforeEach(() => {
        testSchema.db.emptyData();
      });

      it('should do nothing when loadFixtures is called', async () => {
        await testSchema.users.loadFixtures();

        const users = testSchema.users.all();
        expect(users.length).toBe(0);
      });
    });

    describe('with empty fixtures array', () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>().model(userModel).fixtures([]).create(),
        })
        .setup();

      beforeEach(() => {
        testSchema.db.emptyData();
      });

      it('should do nothing when loadFixtures is called', async () => {
        await testSchema.users.loadFixtures();

        const users = testSchema.users.all();
        expect(users.length).toBe(0);
      });
    });

    describe('with multiple fixture records', () => {
      it('should handle loading many fixtures at once', async () => {
        const manyFixtures = Array.from({ length: 10 }, (_, i) => ({
          id: (i + 1).toString(),
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
        }));

        const testSchema = schema()
          .collections({
            users: collection<TestSchema>().model(userModel).fixtures(manyFixtures).create(),
          })
          .setup();

        await testSchema.users.loadFixtures();

        const users = testSchema.users.all();
        expect(users.length).toBe(10);
        expect(users.models[0].name).toBe('User 1');
        expect(users.models[9].name).toBe('User 10');
      });
    });
  });

  describe('Schema.loadFixtures()', () => {
    describe('with manual loading', () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([
              { id: '1', name: 'User 1', email: 'user1@example.com' },
              { id: '2', name: 'User 2', email: 'user2@example.com' },
            ])
            .create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .fixtures([
              { id: 1, title: 'Post 1', content: 'Content 1' },
              { id: 2, title: 'Post 2', content: 'Content 2' },
              { id: 3, title: 'Post 3', content: 'Content 3' },
            ])
            .create(),
        })
        .setup();

      beforeEach(() => {
        testSchema.db.emptyData();
      });

      it('should load all fixtures for all collections', async () => {
        await testSchema.loadFixtures();

        const users = testSchema.users.all();
        expect(users.length).toBe(2);

        const posts = testSchema.posts.all();
        expect(posts.length).toBe(3);
      });
    });

    it('should handle collections without fixtures gracefully', async () => {
      const mixedSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([{ id: '1', name: 'User', email: 'user@example.com' }])
            .create(),
          posts: collection<TestSchema>().model(postModel).create(), // No fixtures
        })
        .setup();

      await mixedSchema.loadFixtures();

      const users = mixedSchema.users.all();
      expect(users.length).toBe(1);

      const posts = mixedSchema.posts.all();
      expect(posts.length).toBe(0);
    });

    it('should handle mixed auto and manual loading', async () => {
      const mixedSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([{ id: '1', name: 'Auto User', email: 'auto@example.com' }], {
              strategy: 'auto',
            })
            .create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .fixtures([{ id: 1, title: 'Manual Post', content: 'Manual content' }])
            .create(),
        })
        .setup();

      // Users should be auto-loaded
      const usersBeforeLoad = mixedSchema.users.all();
      expect(usersBeforeLoad.length).toBe(1);

      // Posts should not be loaded yet
      const postsBeforeLoad = mixedSchema.posts.all();
      expect(postsBeforeLoad.length).toBe(0);

      // Load posts manually
      await mixedSchema.posts.loadFixtures();
      const postsAfterLoad = mixedSchema.posts.all();
      expect(postsAfterLoad.length).toBe(1);
    });
  });

  describe('Fixtures with Seeds', () => {
    it('should allow both fixtures and seeds in the same collection', async () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([{ id: 'fixture-1', name: 'Fixture User', email: 'fixture@example.com' }])
            .seeds((schema) => {
              schema.users.create({ name: 'Seed User', email: 'seed@example.com' });
            })
            .create(),
        })
        .setup();

      // Load fixtures
      await testSchema.users.loadFixtures();
      let users = testSchema.users.all();
      expect(users.length).toBe(1);
      expect(users.models[0].id).toBe('fixture-1');

      // Load seeds
      await testSchema.users.loadSeeds();
      users = testSchema.users.all();
      expect(users.length).toBe(2);

      // One from fixtures, one from seeds
      const fixtureUser = testSchema.users.find('fixture-1');
      expect(fixtureUser?.name).toBe('Fixture User');
    });

    it('should load fixtures before seeds when both are loaded', async () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([{ id: '1', name: 'Fixture', email: 'fixture@example.com' }])
            .seeds((schema) => {
              schema.users.create({ name: 'Seed', email: 'seed@example.com' });
            })
            .create(),
        })
        .setup();

      await testSchema.loadFixtures();
      await testSchema.loadSeeds();

      const users = testSchema.users.all();
      expect(users.length).toBe(2);
    });
  });

  describe('Type safety', () => {
    it('should enforce correct fixture record types', () => {
      // This is a compile-time test
      // The following should compile without errors
      const validFixtures = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com', role: 'admin' },
      ];

      const usersCollection = collection<TestSchema>()
        .model(userModel)
        .fixtures(validFixtures)
        .create();

      expect(usersCollection.fixtures?.records).toEqual(validFixtures);
    });
  });

  describe('Validation', () => {
    it('should throw error when loading fixtures with conflicting IDs', async () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures(
              [
                { id: '1', name: 'John', email: 'john@example.com' },
                { id: '2', name: 'Jane', email: 'jane@example.com' },
              ],
              { strategy: 'manual' },
            )
            .create(),
        })
        .setup();

      // Insert a record with ID '1'
      testSchema.users.create({ id: '1', name: 'Existing', email: 'existing@example.com' });

      // Try to load fixtures (which includes ID '1')
      await expect(testSchema.users.loadFixtures()).rejects.toThrow(MirageError);

      await expect(testSchema.users.loadFixtures()).rejects.toThrow(
        `Cannot load fixtures for 'users': ID conflicts detected`,
      );

      await expect(testSchema.users.loadFixtures()).rejects.toThrow(
        'The following fixture IDs already exist in the database: 1',
      );

      await expect(testSchema.users.loadFixtures()).rejects.toThrow(
        'Clear the database with db.emptyData()',
      );
    });

    it('should load fixtures successfully when no conflicts exist', async () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .fixtures([
              { id: '1', name: 'John', email: 'john@example.com' },
              { id: '2', name: 'Jane', email: 'jane@example.com' },
            ])
            .create(),
        })
        .setup();

      await testSchema.users.loadFixtures();

      expect(testSchema.users.all()).toHaveLength(2);
      expect(testSchema.users.find('1')?.name).toBe('John');
      expect(testSchema.users.find('2')?.name).toBe('Jane');
    });

    it('should not throw error for collections without fixtures', async () => {
      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      await expect(testSchema.posts.loadFixtures()).resolves.not.toThrow();
    });
  });
});
