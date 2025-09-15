import { hasMany, belongsTo } from '@src/associations';
import { factory } from '@src/factory';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';
import { model } from '@src/model';
import { ModelCollection } from '@src/model';
import { schema } from '@src/schema';

// -- TEST MODELS --
interface UserAttrs {
  id: string;
  email: string;
  name: string;
}

interface PostAttrs {
  id: number;
  content: string;
  title: string;
}

interface CommentAttrs {
  id: string;
  content: string;
}

const UserModel = model('user', 'users').attrs<UserAttrs>().create();
const PostModel = model('post', 'posts').attrs<PostAttrs>().create();
const CommentModel = model('comment', 'comments').attrs<CommentAttrs>().create();

// -- TEST FACTORIES --
const userFactory = factory(UserModel)
  .attrs({
    email: () => 'john@example.com',
    name: () => 'John Doe',
  })
  .traits({
    admin: {
      email: 'admin@example.com',
    },
  })
  .create();

const postFactory = factory(PostModel)
  .attrs({
    content: () => 'This is a test post',
    title: () => 'Hello World',
  })
  .create();

const commentFactory = factory(CommentModel)
  .attrs({
    content: () => 'Great post!',
  })
  .create();

describe('Schema', () => {
  const appSchema = schema()
    .collections({
      users: {
        model: UserModel,
        factory: userFactory,
        identityManager: new StringIdentityManager(),
      },
      posts: {
        model: PostModel,
        factory: postFactory,
        identityManager: new NumberIdentityManager(),
      },
    })
    .identityManager(new StringIdentityManager())
    .build();

  beforeEach(() => {
    appSchema.db.emptyData();
  });

  describe('model registration', () => {
    it('registers models and creates collections', () => {
      const users = appSchema.getCollection('users');
      const posts = appSchema.getCollection('posts');
      expect(users).toBeDefined();
      expect(posts).toBeDefined();
    });

    it('throws error for non-existent model', () => {
      expect(() => appSchema.getCollection('nonExistent' as any)).toThrow();
    });
  });

  describe('collection registration', () => {
    it('registers collections during schema construction', () => {
      expect(appSchema.users).toBeDefined();
      expect(appSchema.posts).toBeDefined();
      expect(typeof appSchema.users.create).toBe('function');
      expect(typeof appSchema.posts.create).toBe('function');
    });

    it('provides access to database instance', () => {
      expect(appSchema.db).toBeDefined();
      expect(typeof appSchema.db.getCollection).toBe('function');
    });

    it('provides access to identity manager', () => {
      expect(appSchema.identityManager).toBeDefined();
      expect(typeof appSchema.identityManager.get).toBe('function');
    });
  });

  describe('collection access', () => {
    it('provides access to collections via property accessors', () => {
      expect(appSchema.users).toBeDefined();
      expect(appSchema.posts).toBeDefined();
    });

    it('creates models with factory defaults', () => {
      const user = appSchema.users.create();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');

      const post = appSchema.posts.create();
      expect(post.title).toBe('Hello World');
      expect(post.content).toBe('This is a test post');
    });

    it('creates models with custom attributes', () => {
      const user = appSchema.users.create({ name: 'Jane' });
      expect(user.name).toBe('Jane');
      expect(user.email).toBe('john@example.com');

      const post = appSchema.posts.create({ title: 'Custom Title' });
      expect(post.title).toBe('Custom Title');
      expect(post.content).toBe('This is a test post');
    });

    it('creates multiple models with createList', () => {
      const users = appSchema.users.createList(3, 'admin');
      expect(users.length).toBe(3);
      expect(users.models[0].email).toBe('admin@example.com');
      expect(users.models[1].email).toBe('admin@example.com');
      expect(users.models[2].email).toBe('admin@example.com');
    });
  });

  describe('database integration', () => {
    it('persists models to database', () => {
      const user = appSchema.users.create();
      expect(user.isSaved()).toBe(true);
      expect(user.id).toBeDefined();
      expect(appSchema.db.users.find(user.id)).toBeDefined();

      const post = appSchema.posts.create();
      expect(post.isSaved()).toBe(true);
      expect(post.id).toBeDefined();
      expect(appSchema.db.posts.find(post.id)).toBeDefined();
    });

    it('retrieves models from database', () => {
      const user = appSchema.users.create();
      const retrieved = appSchema.users.find(user.id)!;
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe(user.name);
    });

    it('updates models in database', () => {
      const user = appSchema.users.create();
      user.update({ name: 'Updated Name' });
      const retrieved = appSchema.users.find(user.id)!;
      expect(retrieved.name).toBe('Updated Name');
    });

    it('deletes models from database', () => {
      const user = appSchema.users.create();
      appSchema.users.delete(user.id);
      const retrieved = appSchema.users.find(user.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('querying', () => {
    beforeEach(() => {
      appSchema.users.create({ name: 'John', email: 'john@example.com' });
      appSchema.users.create({ name: 'Jane', email: 'jane@example.com' });
      appSchema.posts.create({ title: 'Post 1' });
      appSchema.posts.create({ title: 'Post 2' });
    });

    it('finds models by query', () => {
      const user = appSchema.users.findBy({ name: 'John' })!;
      expect(user).toBeDefined();
      expect(user.email).toBe('john@example.com');

      const post = appSchema.posts.findBy({ title: 'Post 1' })!;
      expect(post).toBeDefined();
    });

    it('finds or creates models by query', () => {
      const user = appSchema.users.findOrCreateBy({ name: 'New User' });
      expect(user).toBeDefined();
      expect(user.name).toBe('New User');
    });

    it('finds all models matching query', () => {
      const posts = appSchema.posts.where({ title: 'Post 1' });
      expect(posts.length).toBe(1);
      expect(posts.models[0].title).toBe('Post 1');
    });

    it('finds models using function query', () => {
      const users = appSchema.users.where((user: any) => user.name.startsWith('J'));
      expect(users.length).toBe(2);
      expect(users.models[0].name).toBe('John');
      expect(users.models[1].name).toBe('Jane');
    });
  });

  describe('identity manager configuration', () => {
    it('uses collection-specific identity managers', () => {
      const user = appSchema.users.create();
      const post = appSchema.posts.create();

      // Users use StringIdentityManager
      expect(typeof user.id).toBe('string');

      // Posts use NumberIdentityManager
      expect(typeof post.id).toBe('number');
    });

    it('allows global identity manager override', () => {
      const schemaWithNumberDefault = schema()
        .collections({
          users: {
            model: UserModel,
            factory: userFactory,
            identityManager: new StringIdentityManager(),
          },
          posts: {
            model: PostModel,
            factory: postFactory,
          },
        })
        .identityManager(new NumberIdentityManager())
        .build();

      const user = schemaWithNumberDefault.users.create();
      const post = schemaWithNumberDefault.posts.create();

      expect(typeof user.id).toBe('string');
      expect(typeof post.id).toBe('number');
    });
  });
});

describe('Schema with relationships', () => {
  // Setup test schema with relationships
  const appSchema = schema()
    .collections({
      users: {
        model: UserModel,
        factory: userFactory,
        relationships: {
          posts: hasMany(PostModel),
        },
      },
      posts: {
        model: PostModel,
        factory: postFactory,
        relationships: {
          author: belongsTo(UserModel, { foreignKey: 'authorId' }),
          comments: hasMany(CommentModel),
        },
      },
      comments: {
        model: CommentModel,
        factory: commentFactory,
        relationships: {
          user: belongsTo(UserModel),
          post: belongsTo(PostModel),
        },
      },
    })
    .build();

  beforeEach(() => {
    appSchema.db.emptyData();
  });

  describe('relationship initialization', () => {
    it('should initialize with relationships', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
      });

      // Link the post to the user
      user.link('posts', [post]);

      expect(user.posts).toBeDefined();
      expect(user.posts.at(0)?.content).toBe('Content here');
      expect(appSchema.users.first()?.posts.at(0)?.content).toBe('Content here');
    });

    it('should create relationship accessors', () => {
      // First create some related models
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });
      const comment = appSchema.comments.create({
        content: 'Great post!',
      });

      comment.link('user', user);
      comment.link('post', post);

      expect(comment.user?.posts).toBeDefined();
      expect(comment.userId).toBeDefined();
      expect(comment.post).toBeDefined();
      expect(comment.postId).toBeDefined();

      expect(post.author).toBeDefined();
      expect(post.authorId).toBeDefined();
      expect(post.comments).toBeDefined();
      expect(post.commentIds).toBeDefined();
    });
  });

  describe('link', () => {
    it('should link belongsTo relationship', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      post.link('author', user);
      expect(post.authorId).toBe(user.id);
      expect(appSchema.db.users.find(user.id)?.postIds).toEqual([post.id]);
    });

    it('should link hasMany relationship', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = appSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = appSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      user.link('posts', [post1, post2]);
      expect(user.postIds).toEqual([post1.id, post2.id]);
    });

    it('should handle null/empty links', () => {
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      post.link('author', null);
      expect(post.authorId).toBeNull();
    });
  });

  describe('unlink method', () => {
    it('should unlink belongsTo relationship', () => {
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      post.unlink('author');
      expect(post.authorId).toBeNull();
    });

    it('should unlink hasMany relationship', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });

      user.unlink('posts');
      expect(user.postIds).toEqual([]);
    });

    it('should unlink specific item from hasMany relationship', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = appSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = appSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      // First link both posts
      user.link('posts', [post1, post2]);
      expect(user.postIds).toEqual([post1.id, post2.id]);

      // Then unlink just post1
      user.unlink('posts', post1);
      expect(user.postIds).toEqual([post2.id]);
    });
  });

  describe('relationship accessors', () => {
    it('should get belongsTo relationship through accessor', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
      });

      // Link the relationship first
      post.link('author', user);

      const author = post.author;
      expect(author).toBeDefined();
      expect(author?.name).toBe('John');
    });

    it('should get hasMany relationship through accessor', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = appSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = appSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      // Link posts to user
      user.link('posts', [post1, post2]);

      const posts = user.posts;
      expect(posts).toBeInstanceOf(ModelCollection);
      expect(posts).toHaveLength(2);
    });

    it('should set relationship through accessor', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Set relationship through accessor
      post.author = user;
      expect(post.authorId).toBe(user.id);
    });
  });

  describe('foreign key handling', () => {
    it('should handle foreign key changes automatically', () => {
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Direct foreign key assignment should work
      post.authorId = 'user-123';
      expect(post.authorId).toBe('user-123');
    });

    it('should detect foreign key attributes correctly', () => {
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Access the private method for testing
      const isForeignKey = (post as any)._isForeignKey('authorId');
      expect(isForeignKey).toBe(true);

      const isNotForeignKey = (post as any)._isForeignKey('title');
      expect(isNotForeignKey).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle missing relationships gracefully', () => {
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      expect(() => post.link('author', null)).not.toThrow();
      expect(() => post.unlink('author')).not.toThrow();
    });

    it('should handle invalid relationship names gracefully', () => {
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // @ts-expect-error - Invalid relationship name
      expect(() => post.link('nonexistentRelationship', null)).not.toThrow();
      // @ts-expect-error - Invalid relationship name
      expect(() => post.unlink('nonexistentRelationship')).not.toThrow();
    });
  });

  describe('update with relationships', () => {
    it('should update belongsTo relationship via foreign key', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Update using foreign key
      post.update({ authorId: user.id });

      expect(post.authorId).toBe(user.id);
      expect(post.author?.name).toBe('John');
      // Verify bidirectional update
      expect(appSchema.db.users.find(user.id)?.postIds).toEqual([post.id]);
    });

    it('should update belongsTo relationship via model instance', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Update using model instance
      post.update({ author: user });

      expect(post.authorId).toBe(user.id);
      expect(post.author?.name).toBe('John');
      // Verify bidirectional update
      expect(appSchema.db.users.find(user.id)?.postIds).toEqual([post.id]);
    });

    it('should update hasMany relationship via foreign key array', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = appSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = appSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      // Update using foreign key array
      user.update({ postIds: [post1.id, post2.id] });

      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);
      // Verify bidirectional updates
      expect(appSchema.db.posts.find(post1.id)?.authorId).toBe(user.id);
      expect(appSchema.db.posts.find(post2.id)?.authorId).toBe(user.id);
    });

    it('should update hasMany relationship via model instances', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = appSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = appSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      // Update using model instances
      user.update({ posts: [post1, post2] });

      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);
      // Verify bidirectional updates
      expect(appSchema.db.posts.find(post1.id)?.authorId).toBe(user.id);
      expect(appSchema.db.posts.find(post2.id)?.authorId).toBe(user.id);
    });

    it('should handle mixed attribute and relationship updates', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({ title: 'Old Title', content: 'Content here' });

      // Update both regular attributes and relationships
      post.update({
        title: 'New Title',
        content: 'New content',
        author: user,
      });

      expect(post.title).toBe('New Title');
      expect(post.content).toBe('New content');
      expect(post.authorId).toBe(user.id);
      expect(post.author?.name).toBe('John');
      // Verify bidirectional update
      expect(appSchema.db.users.find(user.id)?.postIds).toEqual([post.id]);
    });

    it('should handle null/empty relationship updates', () => {
      const user = appSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = appSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
      });

      // First link the relationship
      post.link('author', user);

      // Update to unlink relationship
      post.update({ author: null });

      expect(post.authorId).toBeNull();
      expect(post.author).toBeNull();

      // Update hasMany to empty array
      user.update({ posts: [] });
      expect(user.postIds).toEqual([]);
      expect(user.posts).toBeInstanceOf(ModelCollection);
      expect(user.posts).toHaveLength(0);
    });
  });
});
