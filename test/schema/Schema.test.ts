import { NumberIdentityManager } from '@src/db';
import { Factory } from '@src/factory';
import { Model } from '@src/model';
import { Schema, type SchemaInstance } from '@src/schema';

// -- TEST MODELS --

interface UserModel {
  id: string;
  email: string;
  name: string;
}

interface PostModel {
  id: number;
  content: string;
  title: string;
  userId: string;
}

// -- TEST FACTORIES --

const UserFactory = Factory.define<UserModel>({
  attributes: {
    email: 'john@example.com',
    name: 'John Doe',
  },
  traits: {
    admin: {
      email: 'admin@example.com',
    },
  },
});

const PostFactory = Factory.define<PostModel>({
  attributes: {
    content: 'This is a test post',
    title: 'Hello World',
    userId: '1',
  },
});

describe('Schema', () => {
  let schema: SchemaInstance<{
    users: UserModel;
    posts: PostModel;
  }>;

  beforeEach(() => {
    schema = Schema.setup<{
      users: UserModel;
      posts: PostModel;
    }>({
      models: {
        users: Model.define<UserModel>(),
        posts: Model.define<PostModel>(),
      },
      factories: {
        users: UserFactory,
        posts: PostFactory,
      },
      identityManagers: {
        posts: new NumberIdentityManager(),
      },
    });
  });

  describe('model registration', () => {
    it('registers models and creates collections', () => {
      expect(schema.getCollection('users')).toBeDefined();
      expect(schema.getCollection('posts')).toBeDefined();
    });

    it('throws error for non-existent model', () => {
      expect(() => schema.getCollection('nonExistent' as any)).toThrow();
    });
  });

  describe('collection access', () => {
    it('provides access to collections via property accessors', () => {
      expect(schema.users).toBeDefined();
      expect(schema.posts).toBeDefined();
    });

    it('creates models with factory defaults', () => {
      const user = schema.users.create();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');

      const post = schema.posts.create();
      expect(post.title).toBe('Hello World');
      expect(post.content).toBe('This is a test post');
      expect(post.userId).toBe('1');
    });

    it('creates models with custom attributes', () => {
      const user = schema.users.create({ name: 'Jane' });
      expect(user.name).toBe('Jane');
      expect(user.email).toBe('john@example.com');

      const post = schema.posts.create({ title: 'Custom Title' });
      expect(post.title).toBe('Custom Title');
      expect(post.content).toBe('This is a test post');
    });

    it('creates multiple models with createList', () => {
      const users = schema.users.createList(3, 'admin');
      expect(users.length).toBe(3);
      expect(users[0].email).toBe('admin@example.com');
      expect(users[1].email).toBe('admin@example.com');
      expect(users[2].email).toBe('admin@example.com');
    });
  });

  describe('database integration', () => {
    it('persists models to database', () => {
      const user = schema.users.create();
      expect(user.isSaved()).toBe(true);
      expect(user.id).toBeDefined();

      const post = schema.posts.create();
      expect(post.isSaved()).toBe(true);
      expect(post.id).toBeDefined();
    });

    it('retrieves models from database', () => {
      const user = schema.users.create();
      const retrieved = schema.users.find(user.id!);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(user.name);
    });

    it('updates models in database', () => {
      const user = schema.users.create();
      user.update({ name: 'Updated Name' });
      const retrieved = schema.users.find(user.id!);
      expect(retrieved?.name).toBe('Updated Name');
    });

    it('removes models from database', () => {
      const user = schema.users.create();
      schema.users.remove(user.id!);
      const retrieved = schema.users.find(user.id!);
      expect(retrieved).toBeNull();
    });
  });

  describe('querying', () => {
    beforeEach(() => {
      schema.users.create({ name: 'John', email: 'john@example.com' });
      schema.users.create({ name: 'Jane', email: 'jane@example.com' });
      schema.posts.create({ title: 'Post 1', userId: '1' });
      schema.posts.create({ title: 'Post 2', userId: '1' });
    });

    it('finds models by query', () => {
      const user = schema.users.findBy({ name: 'John' });
      expect(user).toBeDefined();
      expect(user?.email).toBe('john@example.com');

      const post = schema.posts.findBy({ title: 'Post 1' });
      expect(post).toBeDefined();
      expect(post?.userId).toBe('1');
    });

    it('finds or creates models by query', () => {
      const user = schema.users.findOrCreateBy({ name: 'New User' });
      expect(user).toBeDefined();
      expect(user.name).toBe('New User');
    });

    it('finds all models matching query', () => {
      const posts = schema.posts.where({ userId: '1' });
      expect(posts.length).toBe(2);
      expect(posts[0].title).toBe('Post 1');
      expect(posts[1].title).toBe('Post 2');
    });

    it('finds models using function query', () => {
      const users = schema.users.where((user) => user.name.startsWith('J'));
      expect(users.length).toBe(2);
      expect(users[0].name).toBe('John');
      expect(users[1].name).toBe('Jane');
    });
  });
});
