import { createFactory } from '@src/factory';
import { StringIdentityManager, NumberIdentityManager } from '@src/id-manager';
import { defineToken } from '@src/model';
import { createCollection, composeCollections, setupSchema } from '@src/schema';

// -- TEST MODELS --

interface UserModel {
  id: string;
  email: string;
  name: string;
}

interface PostModel {
  id: number;
  title: string;
  content: string;
}

interface CategoryModel {
  id: string;
  name: string;
  description: string;
}

// -- TEST MODEL TOKENS --

const UserToken = defineToken<UserModel>('user', 'users');
const PostToken = defineToken<PostModel>('post', 'posts');
const CategoryToken = defineToken<CategoryModel>('category', 'categories');

// -- TEST FACTORIES --

const userFactory = createFactory(UserToken, {
  attributes: {
    email: () => 'test@example.com',
    name: () => 'Test User',
  },
});

const postFactory = createFactory(PostToken, {
  attributes: {
    title: () => 'Test Post',
    content: () => 'Test content',
  },
});

const categoryFactory = createFactory(CategoryToken, {
  attributes: {
    name: () => 'Test Category',
    description: () => 'Test description',
  },
});

describe('Schema Utils', () => {
  describe('createCollection', () => {
    it('creates a collection module with correct structure', () => {
      const usersCollection = createCollection('users', {
        model: UserToken,
        factory: userFactory,
        identityManager: new StringIdentityManager(),
      });

      expect(usersCollection).toHaveProperty('users');
      expect(usersCollection.users.model).toBe(UserToken);
      expect(usersCollection.users.factory).toBe(userFactory);
      expect(usersCollection.users.identityManager).toBeInstanceOf(StringIdentityManager);
    });

    it('creates collection modules with different names', () => {
      const postsCollection = createCollection('posts', {
        model: PostToken,
        factory: postFactory,
        identityManager: new NumberIdentityManager(),
      });

      expect(postsCollection).toHaveProperty('posts');
      expect(postsCollection.posts.model).toBe(PostToken);
      expect(postsCollection.posts.identityManager).toBeInstanceOf(NumberIdentityManager);
    });
  });

  describe('composeCollections', () => {
    it('composes multiple collection modules into one object', () => {
      const usersCollection = createCollection('users', {
        model: UserToken,
        factory: userFactory,
      });

      const postsCollection = createCollection('posts', {
        model: PostToken,
        factory: postFactory,
      });

      const composed = composeCollections([usersCollection, postsCollection]);

      expect(composed).toHaveProperty('users');
      expect(composed).toHaveProperty('posts');
      expect(composed.users.model).toBe(UserToken);
      expect(composed.posts.model).toBe(PostToken);
    });

    it('handles empty array', () => {
      const composed = composeCollections([]);
      expect(composed).toEqual({});
    });

    it('handles single collection', () => {
      const usersCollection = createCollection('users', {
        model: UserToken,
        factory: userFactory,
      });

      const composed = composeCollections([usersCollection]);

      expect(composed).toHaveProperty('users');
      expect(composed.users.model).toBe(UserToken);
    });

    it('composes three collections', () => {
      const usersCollection = createCollection('users', {
        model: UserToken,
        factory: userFactory,
      });

      const postsCollection = createCollection('posts', {
        model: PostToken,
        factory: postFactory,
      });

      const categoriesCollection = createCollection('categories', {
        model: CategoryToken,
        factory: categoryFactory,
      });

      const composed = composeCollections([usersCollection, postsCollection, categoriesCollection]);

      expect(composed).toHaveProperty('users');
      expect(composed).toHaveProperty('posts');
      expect(composed).toHaveProperty('categories');
      expect(Object.keys(composed)).toHaveLength(3);
    });
  });

  describe('integration with setupSchema', () => {
    it('works with createCollection + composeCollections', () => {
      const usersCollection = createCollection('users', {
        model: UserToken,
        factory: userFactory,
        identityManager: new StringIdentityManager(),
      });

      const postsCollection = createCollection('posts', {
        model: PostToken,
        factory: postFactory,
        identityManager: new NumberIdentityManager(),
      });

      const collections = composeCollections([usersCollection, postsCollection]);
      const schema = setupSchema(collections, {
        identityManager: new StringIdentityManager(),
      });

      expect(schema.users).toBeDefined();
      expect(schema.posts).toBeDefined();
      expect(typeof schema.users.create).toBe('function');
      expect(typeof schema.posts.create).toBe('function');

      // Test actual usage
      const user = schema.users.create();
      const post = schema.posts.create();

      expect(user).toBeDefined();
      expect(post).toBeDefined();
      expect(typeof user.id).toBe('string');
      expect(typeof post.id).toBe('number');
    });

    it('works with direct collections object', () => {
      const collections = {
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
      };

      const schema = setupSchema(collections, {
        identityManager: new StringIdentityManager(),
      });

      expect(schema.users).toBeDefined();
      expect(schema.posts).toBeDefined();

      // Test actual usage
      const user = schema.users.create();
      const post = schema.posts.create();

      expect(user.name).toBe('Test User');
      expect(post.title).toBe('Test Post');
      expect(typeof user.id).toBe('string');
      expect(typeof post.id).toBe('number');
    });
  });

  describe('modular composition', () => {
    it('allows composing collections from different modules', () => {
      // User module
      const userModule = composeCollections([
        createCollection('users', {
          model: UserToken,
          factory: userFactory,
        }),
      ]);

      // Content module
      const contentModule = composeCollections([
        createCollection('posts', {
          model: PostToken,
          factory: postFactory,
        }),
        createCollection('categories', {
          model: CategoryToken,
          factory: categoryFactory,
        }),
      ]);

      // Combine modules
      const allCollections = composeCollections([userModule, contentModule] as const);

      expect(allCollections).toHaveProperty('users');
      expect(allCollections).toHaveProperty('posts');
      expect(allCollections).toHaveProperty('categories');

      const schema = setupSchema(allCollections, {
        identityManager: new StringIdentityManager(),
      });

      expect(schema.users).toBeDefined();
      expect(schema.posts).toBeDefined();
      expect(schema.categories).toBeDefined();
    });
  });
});
