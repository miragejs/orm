import { collection } from '../CollectionBuilder';
import { schema } from '../SchemaBuilder';
import type { CollectionConfig } from '../types';

import { postModel, userModel, type UserModel, type PostModel } from './test-helpers';

// Define shared schema type
type TestSchema = {
  users: CollectionConfig<UserModel>;
  posts: CollectionConfig<PostModel>;
};

describe('Schema with Seeds', () => {
  describe('Collection.loadSeeds()', () => {
    describe('with function seeds', () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .seeds((schema) => {
              schema.users.create({ name: 'John', email: 'john@example.com' });
              schema.users.create({ name: 'Jane', email: 'jane@example.com' });
            })
            .create(),
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      beforeEach(() => {
        testSchema.db.emptyData();
      });

      it('should load seeds when called without scenarioId', async () => {
        await testSchema.users.loadSeeds();

        const users = testSchema.users.all();
        expect(users.length).toBe(2);
        expect(users.models[0].name).toBe('John');
        expect(users.models[1].name).toBe('Jane');
      });

      it('should load seeds when called with "default" scenarioId', async () => {
        await testSchema.users.loadSeeds('default');

        const users = testSchema.users.all();
        expect(users.length).toBe(2);
        expect(users.models[0].name).toBe('John');
        expect(users.models[1].name).toBe('Jane');
      });

      it('should throw error when called with non-existent scenarioId', async () => {
        await expect(testSchema.users.loadSeeds('nonexistent')).rejects.toThrow(
          "Seed scenario 'nonexistent' does not exist in collection 'users'. Available scenarios: default",
        );
      });
    });

    describe('with named scenario seeds', () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .seeds({
              basic: (schema) => {
                schema.users.create({ name: 'John', email: 'john@example.com' });
              },
              admin: (schema) => {
                schema.users.create({ name: 'Admin', email: 'admin@example.com' });
              },
            })
            .create(),
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      beforeEach(() => {
        testSchema.db.emptyData();
      });

      it('should load all scenarios when called without scenarioId', async () => {
        await testSchema.users.loadSeeds();

        const users = testSchema.users.all();
        expect(users.length).toBe(2);
        expect(users.models.map((u) => u.name)).toEqual(['John', 'Admin']);
      });

      it('should load specific scenario when called with scenarioId', async () => {
        await testSchema.users.loadSeeds('basic');

        const users = testSchema.users.all();
        expect(users.length).toBe(1);
        expect(users.models[0].name).toBe('John');
      });

      it('should load admin scenario', async () => {
        await testSchema.users.loadSeeds('admin');

        const users = testSchema.users.all();
        expect(users.length).toBe(1);
        expect(users.models[0].name).toBe('Admin');
      });

      it('should throw error when called with non-existent scenarioId', async () => {
        await expect(testSchema.users.loadSeeds('nonexistent')).rejects.toThrow(
          "Seed scenario 'nonexistent' does not exist in collection 'users'. Available scenarios: basic, admin",
        );
      });

      it('should allow loading multiple scenarios sequentially', async () => {
        await testSchema.users.loadSeeds('basic');
        await testSchema.users.loadSeeds('admin');

        const users = testSchema.users.all();
        expect(users.length).toBe(2);
        expect(users.models[0].name).toBe('John');
        expect(users.models[1].name).toBe('Admin');
      });
    });

    describe('with no seeds configured', () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>().model(userModel).create(),
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      beforeEach(() => {
        testSchema.db.emptyData();
      });

      it('should do nothing when loadSeeds is called', async () => {
        await testSchema.users.loadSeeds();

        const users = testSchema.users.all();
        expect(users.length).toBe(0);
      });

      it('should do nothing when loadSeeds is called with scenarioId', async () => {
        await testSchema.users.loadSeeds('any');

        const users = testSchema.users.all();
        expect(users.length).toBe(0);
      });
    });

    describe('with async seed functions', () => {
      const testSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .seeds({
              async: async (schema) => {
                await Promise.resolve();
                schema.users.create({ name: 'Async User', email: 'async@example.com' });
              },
            })
            .create(),
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      beforeEach(() => {
        testSchema.db.emptyData();
      });

      it('should handle async seed functions', async () => {
        await testSchema.users.loadSeeds('async');

        const users = testSchema.users.all();
        expect(users.length).toBe(1);
        expect(users.models[0].name).toBe('Async User');
      });
    });
  });

  describe('Schema.loadSeeds()', () => {
    const testSchema = schema()
      .collections({
        users: collection<TestSchema>()
          .model(userModel)
          .seeds((schema) => {
            schema.users.create({ name: 'John', email: 'john@example.com' });
            schema.users.create({ name: 'Jane', email: 'jane@example.com' });
          })
          .create(),
        posts: collection<TestSchema>()
          .model(postModel)
          .seeds((schema) => {
            schema.posts.create({ title: 'Post 1', content: 'Content 1' });
            schema.posts.create({ title: 'Post 2', content: 'Content 2' });
            schema.posts.create({ title: 'Post 3', content: 'Content 3' });
          })
          .create(),
      })
      .setup();

    beforeEach(() => {
      testSchema.db.emptyData();
    });

    it('should load all seeds for all collections', async () => {
      await testSchema.loadSeeds();

      const users = testSchema.users.all();
      expect(users.length).toBe(2);

      const posts = testSchema.posts.all();
      expect(posts.length).toBe(3);
    });

    it('should handle collections without seeds gracefully', async () => {
      const mixedSchema = schema()
        .collections({
          users: collection<TestSchema>()
            .model(userModel)
            .seeds((schema) => {
              schema.users.create({ name: 'User', email: 'user@example.com' });
            })
            .create(),
          posts: collection<TestSchema>().model(postModel).create(),
        })
        .setup();

      await mixedSchema.loadSeeds();

      const users = mixedSchema.users.all();
      expect(users.length).toBe(1);

      const posts = mixedSchema.posts.all();
      expect(posts.length).toBe(0);
    });

    it('should load seeds for a specific collection when collectionName is provided', async () => {
      await testSchema.loadSeeds('users');

      const users = testSchema.users.all();
      expect(users.length).toBe(2);
      expect(users.models[0].name).toBe('John');
      expect(users.models[1].name).toBe('Jane');

      // Posts should not be loaded
      const posts = testSchema.posts.all();
      expect(posts.length).toBe(0);
    });

    it('should load seeds for another specific collection', async () => {
      await testSchema.loadSeeds('posts');

      const posts = testSchema.posts.all();
      expect(posts.length).toBe(3);
      expect(posts.models[0].title).toBe('Post 1');

      // Users should not be loaded
      const users = testSchema.users.all();
      expect(users.length).toBe(0);
    });

    it('should allow loading seeds for specific collections sequentially', async () => {
      await testSchema.loadSeeds('users');
      await testSchema.loadSeeds('posts');

      const users = testSchema.users.all();
      expect(users.length).toBe(2);

      const posts = testSchema.posts.all();
      expect(posts.length).toBe(3);
    });

    it('should throw error when loading seeds for non-existent collection', async () => {
      // @ts-expect-error - Testing invalid collection name
      await expect(testSchema.loadSeeds('nonexistent')).rejects.toThrow(
        "Collection 'nonexistent' not found",
      );
    });
  });
});
