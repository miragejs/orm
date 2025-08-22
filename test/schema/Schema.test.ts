import { createFactory } from '@src/factory';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';
import { defineToken, ModelToken } from '@src/model';
import { SchemaCollectionConfig, setupSchema, type SchemaInstance } from '@src/schema';

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

// -- TEST MODEL TOKENS --

const UserToken = defineToken<UserModel>('user', 'users');
const PostToken = defineToken<PostModel>('post', 'posts');

// -- TEST FACTORIES --

const userFactory = createFactory(UserToken, {
  attributes: {
    email: () => 'john@example.com',
    name: () => 'John Doe',
  },
  traits: {
    admin: {
      email: 'admin@example.com',
    },
  },
});

const postFactory = createFactory(PostToken, {
  attributes: {
    content: () => 'This is a test post',
    title: () => 'Hello World',
    userId: () => '1',
  },
});

describe('Schema', () => {
  let schema: SchemaInstance<{
    users: SchemaCollectionConfig<ModelToken<UserModel>>;
    posts: SchemaCollectionConfig<ModelToken<PostModel>>;
  }>;

  beforeEach(() => {
    schema = setupSchema(
      {
        users: {
          model: UserToken,
          factory: userFactory,
          identityManager: new StringIdentityManager(),
        },
        posts: {
          model: PostToken,
          factory: postFactory,
          identityManager: new NumberIdentityManager(),
        },
      },
      {
        identityManager: new StringIdentityManager(),
      },
    );
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
      expect(users.models[0].email).toBe('admin@example.com');
      expect(users.models[1].email).toBe('admin@example.com');
      expect(users.models[2].email).toBe('admin@example.com');
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

    it('deletes models from database', () => {
      const user = schema.users.create();
      schema.users.delete(user.id!);
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
      expect(posts.models[0].title).toBe('Post 1');
      expect(posts.models[1].title).toBe('Post 2');
    });

    it('finds models using function query', () => {
      const users = schema.users.where((user: any) => user.name.startsWith('J'));
      expect(users.length).toBe(2);
      expect(users.models[0].name).toBe('John');
      expect(users.models[1].name).toBe('Jane');
    });
  });

  describe('identity manager configuration', () => {
    it('uses collection-specific identity managers', () => {
      const user = schema.users.create();
      const post = schema.posts.create();

      // Users use StringIdentityManager
      expect(typeof user.id).toBe('string');

      // Posts use NumberIdentityManager
      expect(typeof post.id).toBe('number');
    });

    it('allows global identity manager override', () => {
      const schemaWithNumberDefault = setupSchema(
        {
          users: {
            model: UserToken,
            factory: userFactory,
            identityManager: new StringIdentityManager(),
          },
          posts: {
            model: PostToken,
            factory: postFactory,
          },
        },
        {
          identityManager: new NumberIdentityManager(),
        },
      );

      const user = schemaWithNumberDefault.users.create();
      const post = schemaWithNumberDefault.posts.create();

      expect(typeof user.id).toBe('string');
      expect(typeof post.id).toBe('number');
    });
  });

  describe('collection registration', () => {
    it('registers collections during schema construction', () => {
      expect(schema.users).toBeDefined();
      expect(schema.posts).toBeDefined();
      expect(typeof schema.users.create).toBe('function');
      expect(typeof schema.posts.create).toBe('function');
    });

    it('provides access to database instance', () => {
      expect(schema.db).toBeDefined();
      expect(typeof schema.db.getCollection).toBe('function');
    });

    it('provides access to identity manager', () => {
      expect(schema.identityManager).toBeDefined();
      expect(typeof schema.identityManager.get).toBe('function');
    });
  });
});
