import { collection } from '../CollectionBuilder';
import { schema } from '../SchemaBuilder';

import {
  postFactory,
  postIdentityManager,
  postModel,
  userFactory,
  userModel,
} from './test-helpers';

// Create test collections
const userCollection = collection()
  .model(userModel)
  .factory(userFactory)
  .create();

const postCollection = collection()
  .model(postModel)
  .factory(postFactory)
  .identityManager(postIdentityManager)
  .create();

// Create test schema
const testSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .setup();

describe('Schema', () => {
  beforeEach(() => {
    testSchema.db.emptyData();
  });

  describe('Constructor', () => {
    it('registers models and creates collections', () => {
      const users = testSchema.getCollection('users');
      const posts = testSchema.getCollection('posts');
      expect(users).toBeDefined();
      expect(posts).toBeDefined();
    });

    it('throws error for non-existent model', () => {
      expect(() => testSchema.getCollection('nonExistent' as any)).toThrow();
    });
  });

  describe('Collections registration', () => {
    it('registers collections during schema construction', () => {
      expect(testSchema.users).toBeDefined();
      expect(testSchema.posts).toBeDefined();
      expect(typeof testSchema.users.create).toBe('function');
      expect(typeof testSchema.posts.create).toBe('function');
    });

    it('provides access to database instance', () => {
      expect(testSchema.db).toBeDefined();
      expect(typeof testSchema.db.getCollection).toBe('function');
    });
  });

  describe('Collection access', () => {
    it('provides access to collections via property accessors', () => {
      expect(testSchema.users).toBeDefined();
      expect(testSchema.posts).toBeDefined();
    });

    it('creates models with factory defaults', () => {
      const user = testSchema.users.create();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');

      const post = testSchema.posts.create();
      expect(post.title).toBe('Hello World');
      expect(post.content).toBe('This is a test post');
    });

    it('creates models with custom attributes', () => {
      const user = testSchema.users.create({ name: 'Jane' });
      expect(user.name).toBe('Jane');
      expect(user.email).toBe('john@example.com');

      const post = testSchema.posts.create({ title: 'Custom Title' });
      expect(post.title).toBe('Custom Title');
      expect(post.content).toBe('This is a test post');
    });

    it('creates multiple models with createMany (count + traits)', () => {
      const users = testSchema.users.createMany(3, 'admin');
      expect(users.length).toBe(3);
      expect(users.models[0].email).toBe('admin@example.com');
      expect(users.models[1].email).toBe('admin@example.com');
      expect(users.models[2].email).toBe('admin@example.com');
    });

    it('creates multiple models with createMany (array of attributes)', () => {
      const users = testSchema.users.createMany([
        [{ email: 'alice@example.com' }],
        [{ email: 'bob@example.com' }],
        ['admin'],
      ]);
      expect(users.length).toBe(3);
      expect(users.models[0].email).toBe('alice@example.com');
      expect(users.models[1].email).toBe('bob@example.com');
      expect(users.models[2].email).toBe('admin@example.com');
    });

    it('creates multiple models with createMany (array with mixed traits and attributes)', () => {
      const posts = testSchema.posts.createMany([
        [{ title: 'First Post', content: 'First content' }],
        [{ title: 'Second Post' }], // Uses factory default for content
        [{ content: 'Third content' }], // Uses factory default for title
      ]);
      expect(posts.length).toBe(3);
      expect(posts.models[0].title).toBe('First Post');
      expect(posts.models[0].content).toBe('First content');
      expect(posts.models[1].title).toBe('Second Post');
      expect(posts.models[1].content).toBe('This is a test post');
      expect(posts.models[2].title).toBe('Hello World'); // Factory default
      expect(posts.models[2].content).toBe('Third content');
    });
  });

  describe('Database integration', () => {
    it('persists models to database', () => {
      const user = testSchema.users.create();
      expect(user.isSaved()).toBe(true);
      expect(user.id).toBeDefined();
      expect(testSchema.db.users.find(user.id)).toBeDefined();

      const post = testSchema.posts.create();
      expect(post.isSaved()).toBe(true);
      expect(post.id).toBeDefined();
      expect(testSchema.db.posts.find(post.id)).toBeDefined();
    });

    it('retrieves models from database', () => {
      const user = testSchema.users.create();
      const retrieved = testSchema.users.find(user.id)!;
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe(user.name);
    });

    it('updates models in database', () => {
      const user = testSchema.users.create();
      user.update({ name: 'Updated Name' });
      const retrieved = testSchema.users.find(user.id)!;
      expect(retrieved.name).toBe('Updated Name');
    });

    it('deletes models from database', () => {
      const user = testSchema.users.create();
      testSchema.users.delete(user.id);
      const retrieved = testSchema.users.find(user.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Querying', () => {
    beforeEach(() => {
      testSchema.users.create({ name: 'John', email: 'john@example.com' });
      testSchema.users.create({ name: 'Jane', email: 'jane@example.com' });
      testSchema.posts.create({ title: 'Post 1' });
      testSchema.posts.create({ title: 'Post 2' });
    });

    it('finds models by query', () => {
      const user = testSchema.users.find({ name: 'John' })!;
      expect(user).toBeDefined();
      expect(user.email).toBe('john@example.com');

      const post = testSchema.posts.find({ title: 'Post 1' })!;
      expect(post).toBeDefined();
    });

    it('finds or creates models by query', () => {
      const user = testSchema.users.findOrCreateBy({ name: 'New User' });
      expect(user).toBeDefined();
      expect(user.name).toBe('New User');
    });

    it('finds all models matching query', () => {
      const posts = testSchema.posts.findMany({ title: 'Post 1' });
      expect(posts.length).toBe(1);
      expect(posts.models[0].title).toBe('Post 1');
    });

    it('finds models using function query', () => {
      const users = testSchema.users.findMany({
        where: (user: any) => user.name.startsWith('J'),
      });
      expect(users.length).toBe(2);
      expect(users.models[0].name).toBe('John');
      expect(users.models[1].name).toBe('Jane');
    });

    it('finds many or creates models by object query - returns existing when enough exist', () => {
      // We have 2 users (John and Jane), request 2 users starting with 'J'
      const users = testSchema.users.findManyOrCreateBy(2, (user: any) =>
        user.name.startsWith('J'),
      );
      expect(users.length).toBe(2);
      expect(users.models[0].name).toBe('John');
      expect(users.models[1].name).toBe('Jane');
    });

    it('finds many or creates models - creates new ones when not enough exist', () => {
      // We have 2 posts, request 4 posts
      const posts = testSchema.posts.findManyOrCreateBy(4, {});
      expect(posts.length).toBe(4);
      // First 2 should be existing posts
      expect(posts.models[0].title).toBe('Post 1');
      expect(posts.models[1].title).toBe('Post 2');
      // Last 2 should be newly created (with default titles)
      expect(posts.models[2].title).toBeDefined();
      expect(posts.models[3].title).toBeDefined();
    });

    it('finds many or creates models with object query attributes', () => {
      // Request 3 users with role 'admin', none exist yet
      const admins = testSchema.users.findManyOrCreateBy(3, { role: 'admin' });
      expect(admins.length).toBe(3);
      admins.models.forEach((admin) => {
        expect(admin.role).toBe('admin');
      });
    });

    it('finds many or creates models with function query', () => {
      // Request 5 users starting with 'J', only 2 exist
      const users = testSchema.users.findManyOrCreateBy(5, (user: any) =>
        user.name.startsWith('J'),
      );
      expect(users.length).toBe(5);
      // First 2 should be existing users
      expect(users.models[0].name).toBe('John');
      expect(users.models[1].name).toBe('Jane');
      // Last 3 should be newly created
      expect(users.models[2]).toBeDefined();
      expect(users.models[3]).toBeDefined();
      expect(users.models[4]).toBeDefined();
    });

    it('finds many or creates models with traits and defaults', () => {
      // Request 2 posts, but override the title
      const posts = testSchema.posts.findManyOrCreateBy(
        2,
        {},
        { title: 'Custom Post' },
      );
      expect(posts.length).toBe(2);
      // First 2 posts exist already
      expect(posts.models[0].title).toBe('Post 1');
      expect(posts.models[1].title).toBe('Post 2');

      // Request 4 posts total with custom title
      const morePosts = testSchema.posts.findManyOrCreateBy(
        4,
        {},
        { title: 'New Post' },
      );
      expect(morePosts.length).toBe(4);
      // First 4 posts exist already (2 original + 2 custom)
      expect(morePosts.models[0].title).toBe('Post 1');
      expect(morePosts.models[1].title).toBe('Post 2');
    });
  });

  describe('Identity manager configuration', () => {
    it('uses collection-specific identity managers', () => {
      const user = testSchema.users.create();
      const post = testSchema.posts.create();

      // Users use default StringIdentityManager (no custom one configured)
      expect(typeof user.id).toBe('string');

      // Posts use NumberIdentityManager (configured via collection builder)
      expect(typeof post.id).toBe('number');
    });

    it('each collection has independent ID sequences', () => {
      // Create users and posts in different orders
      testSchema.users.create();
      testSchema.users.create();
      testSchema.posts.create();

      // Each collection should have its own ID sequence starting from 1
      const user3 = testSchema.users.create();
      const post2 = testSchema.posts.create();

      // User should be "3" (third user created)
      expect(user3.id).toBe('3');

      // Post should be 2 (second post created, using NumberIdentityManager)
      expect(post2.id).toBe(2);
    });
  });

  describe('Collection serializer configuration', () => {
    it('should not wrap when no serializer config is set', () => {
      const testSchema = schema()
        .collections({
          users: collection().model(userModel).create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Charlie',
        email: 'charlie@example.com',
      });

      expect(user.toJSON()).toEqual({
        id: user.id,
        name: 'Charlie',
        email: 'charlie@example.com',
      });
    });

    it('should apply collection-level root config', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .serializer({ root: true })
            .create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Alice',
        email: 'alice@example.com',
      });

      expect(user.toJSON()).toEqual({
        user: { id: user.id, name: 'Alice', email: 'alice@example.com' },
      });
    });

    it('should apply collection-level custom root key', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .serializer({ root: 'userData' })
            .create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Henry',
        email: 'henry@example.com',
      });

      expect(user.toJSON()).toEqual({
        userData: { id: user.id, name: 'Henry', email: 'henry@example.com' },
      });
    });

    it('should apply collection select filter to collection serialization', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .serializer({ select: ['id', 'name'] })
            .create(),
        })
        .setup();

      const user1 = testSchema.users.create({
        name: 'Kate',
        email: 'kate@example.com',
      });
      const user2 = testSchema.users.create({
        name: 'Leo',
        email: 'leo@example.com',
      });

      const allUsers = testSchema.users.all();

      expect(allUsers.toJSON()).toEqual([
        { id: user1.id, name: 'Kate' },
        { id: user2.id, name: 'Leo' },
      ]);
    });

    it('should handle empty select array', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .serializer({ select: [] })
            .create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Paul',
        email: 'paul@example.com',
      });

      // Empty select should return all attributes (fallback behavior)
      expect(user.toJSON()).toEqual({
        id: user.id,
        name: 'Paul',
        email: 'paul@example.com',
      });
    });

    it('should handle both root and select at collection level', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .serializer({ root: 'userRecord', select: ['id', 'name'] })
            .create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Rachel',
        email: 'rachel@example.com',
      });

      expect(user.toJSON()).toEqual({
        userRecord: { id: user.id, name: 'Rachel' },
      });
    });
  });
});
