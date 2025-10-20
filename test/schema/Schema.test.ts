import { hasMany, belongsTo } from '@src/associations';
import { factory } from '@src/factory';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';
import { model } from '@src/model';
import { ModelCollection } from '@src/model';
import { collection, schema } from '@src/schema';

// Define test model attributes
interface UserAttrs {
  id: string;
  email: string;
  name: string;
  role?: string;
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

// Create test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();
const commentModel = model().name('comment').collection('comments').attrs<CommentAttrs>().create();

// Create test factories
const userFactory = factory()
  .model(userModel)
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

const postFactory = factory()
  .model(postModel)
  .attrs({
    content: () => 'This is a test post',
    title: () => 'Hello World',
  })
  .create();

const commentFactory = factory()
  .model(commentModel)
  .attrs({
    content: () => 'Great post!',
  })
  .create();

// Create test collections
const userCollection = collection().model(userModel).factory(userFactory).create();

const postCollection = collection()
  .model(postModel)
  .factory(postFactory)
  .identityManager(new NumberIdentityManager())
  .create();

// Create test schema
const testSchema = schema()
  .collections({
    users: userCollection,
    posts: postCollection,
  })
  .identityManager(new StringIdentityManager())
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

    it('provides access to identity manager', () => {
      expect(testSchema.identityManager).toBeDefined();
      expect(typeof testSchema.identityManager.get).toBe('function');
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

    it('creates multiple models with createList', () => {
      const users = testSchema.users.createList(3, 'admin');
      expect(users.length).toBe(3);
      expect(users.models[0].email).toBe('admin@example.com');
      expect(users.models[1].email).toBe('admin@example.com');
      expect(users.models[2].email).toBe('admin@example.com');
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
      const posts = testSchema.posts.findManyOrCreateBy(2, {}, { title: 'Custom Post' });
      expect(posts.length).toBe(2);
      // First 2 posts exist already
      expect(posts.models[0].title).toBe('Post 1');
      expect(posts.models[1].title).toBe('Post 2');

      // Request 4 posts total with custom title
      const morePosts = testSchema.posts.findManyOrCreateBy(4, {}, { title: 'New Post' });
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

      // Users use StringIdentityManager
      expect(typeof user.id).toBe('string');

      // Posts use NumberIdentityManager
      expect(typeof post.id).toBe('number');
    });

    it('allows global identity manager override', () => {
      const schemaWithNumberDefault = schema()
        .collections({
          users: {
            model: userModel,
            factory: userFactory,
            identityManager: new StringIdentityManager(),
          },
          posts: {
            model: postModel,
            factory: postFactory,
          },
        })
        .identityManager(new NumberIdentityManager())
        .setup();

      const user = schemaWithNumberDefault.users.create();
      const post = schemaWithNumberDefault.posts.create();

      expect(typeof user.id).toBe('string');
      expect(typeof post.id).toBe('number');
    });
  });
});

describe('Schema with Relationships', () => {
  // Create test collections with relationships
  const userCollection = collection()
    .model(userModel)
    .factory(userFactory)
    .relationships({
      posts: hasMany(postModel),
    })
    .create();

  const postCollection = collection()
    .model(postModel)
    .factory(postFactory)
    .relationships({
      author: belongsTo(userModel, { foreignKey: 'authorId' }),
      comments: hasMany(commentModel),
    })
    .create();

  const commentCollection = collection()
    .model(commentModel)
    .factory(commentFactory)
    .relationships({
      user: belongsTo(userModel),
      post: belongsTo(postModel),
    })
    .create();

  // Create test schema with collections
  const testSchema = schema()
    .collections({
      users: userCollection,
      posts: postCollection,
      comments: commentCollection,
    })
    .setup();

  beforeEach(() => {
    testSchema.db.emptyData();
  });

  describe('Relationships initialization', () => {
    it('should initialize with relationships', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
      });

      // Link the post to the user
      user.link('posts', [post]);

      expect(user.posts).toBeDefined();
      expect(user.posts.at(0)?.content).toBe('Content here');
      expect(testSchema.users.first()?.posts.at(0)?.content).toBe('Content here');
    });

    it('should create relationship accessors', () => {
      // First create some related models
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });
      const comment = testSchema.comments.create({
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

  describe('link()', () => {
    it('should link belongsTo relationship', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      post.link('author', user);
      expect(post.authorId).toBe(user.id);
      expect(testSchema.db.users.find(user.id)?.postIds).toEqual([post.id]);
    });

    it('should link hasMany relationship', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      user.link('posts', [post1, post2]);
      expect(user.postIds).toEqual([post1.id, post2.id]);
    });

    it('should handle null/empty links', () => {
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      post.link('author', null);
      expect(post.authorId).toBeNull();
    });
  });

  describe('unlink()', () => {
    it('should unlink belongsTo relationship', () => {
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      post.unlink('author');
      expect(post.authorId).toBeNull();
    });

    it('should unlink hasMany relationship', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });

      user.unlink('posts');
      expect(user.postIds).toEqual([]);
    });

    it('should unlink specific item from hasMany relationship', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      // First link both posts
      user.link('posts', [post1, post2]);
      expect(user.postIds).toEqual([post1.id, post2.id]);

      // Then unlink just post1
      user.unlink('posts', [post1]);
      expect(user.postIds).toEqual([post2.id]);
    });
  });

  describe('Relationship accessors', () => {
    it('should get belongsTo relationship through accessor', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({
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
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      // Link posts to user
      user.link('posts', [post1, post2]);

      const posts = user.posts;
      expect(posts).toBeInstanceOf(ModelCollection);
      expect(posts).toHaveLength(2);
    });

    it('should set relationship through accessor', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Set relationship through accessor
      post.author = user;
      expect(post.authorId).toBe(user.id);
    });
  });

  describe('Foreign key handling', () => {
    it('should handle foreign key changes automatically', () => {
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Direct foreign key assignment should work
      post.authorId = 'user-123';
      expect(post.authorId).toBe('user-123');
    });
  });

  describe('Error handling', () => {
    it('should handle missing relationships gracefully', () => {
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      expect(() => post.link('author', null)).not.toThrow();
      expect(() => post.unlink('author')).not.toThrow();
    });

    it('should handle invalid relationship names gracefully', () => {
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // @ts-expect-error - Invalid relationship name
      expect(() => post.link('nonexistentRelationship', null)).not.toThrow();
      // @ts-expect-error - Invalid relationship name
      expect(() => post.unlink('nonexistentRelationship')).not.toThrow();
    });
  });

  describe('Create with relationships', () => {
    it('should create belongsTo relationship', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
        author: user,
      });

      expect(post.authorId).toBe(user.id);
      expect(post.author?.name).toBe('John');

      user.reload();

      expect(user.postIds).toEqual([post.id]);
      expect(user.posts).toHaveLength(1);
    });

    it('should create hasMany relationship', () => {
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });
      const user = testSchema.users.create({
        name: 'John',
        email: 'john@example.com',
        posts: [post1, post2],
      });

      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);

      post1.reload();
      post2.reload();

      expect(post1.authorId).toBe(user.id);
      expect(post1.author?.name).toBe('John');
      expect(post2.authorId).toBe(user.id);
      expect(post2.author?.name).toBe('John');
    });
  });

  describe('Update with relationships', () => {
    it('should update belongsTo relationship via foreign key', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Update using foreign key
      post.update({ authorId: user.id });

      expect(post.authorId).toBe(user.id);
      expect(post.author?.name).toBe('John');

      // Verify bidirectional update
      user.reload();
      expect(user.postIds).toEqual([post.id]);

      // Verify database update
      expect(testSchema.db.users.find(user.id)?.postIds).toEqual([post.id]);
    });

    it('should update belongsTo relationship via model instance', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({ title: 'My Post', content: 'Content here' });

      // Update using model instance
      post.update({ author: user });

      expect(post.authorId).toBe(user.id);
      expect(post.author?.name).toBe('John');

      // Verify bidirectional update
      user.reload();
      expect(user.postIds).toEqual([post.id]);

      // Verify database update
      expect(testSchema.db.users.find(user.id)?.postIds).toEqual([post.id]);
    });

    it('should update hasMany relationship via foreign key array', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      // Update using foreign key array
      user.update({ postIds: [post1.id, post2.id] });

      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);

      // Verify bidirectional updates
      user.reload();
      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);

      // Verify database updates
      expect(testSchema.db.posts.find(post1.id)?.authorId).toBe(user.id);
      expect(testSchema.db.posts.find(post2.id)?.authorId).toBe(user.id);
    });

    it('should update hasMany relationship via model instances', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

      // Update using model instances
      user.update({ posts: [post1, post2] });

      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);

      // Verify bidirectional updates
      user.reload();
      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);

      // Verify database updates
      expect(testSchema.db.posts.find(post1.id)?.authorId).toBe(user.id);
      expect(testSchema.db.posts.find(post2.id)?.authorId).toBe(user.id);
    });

    it('should handle mixed attribute and relationship updates', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({ title: 'Old Title', content: 'Content here' });

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
      user.reload();
      expect(user.postIds).toEqual([post.id]);
      expect(user.posts).toHaveLength(1);

      // Verify database updates
      expect(testSchema.db.users.find(user.id)?.postIds).toEqual([post.id]);
    });

    it('should handle null/empty relationship updates', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({
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

  describe('Global serializer configuration', () => {
    describe('Schema-level global config', () => {
      it('should apply global root config to all collections', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection().model(postModel).create(),
          })
          .serializer({ root: true })
          .setup();

        const user = testSchema.users.create({ name: 'Alice', email: 'alice@example.com' });
        const post = testSchema.posts.create({ title: 'Hello', content: 'World' });

        expect(user.toJSON()).toEqual({
          user: { id: user.id, name: 'Alice', email: 'alice@example.com' },
        });
        expect(post.toJSON()).toEqual({
          post: { id: post.id, title: 'Hello', content: 'World' },
        });
      });

      it('should apply global custom root key to all collections', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
          })
          .serializer({ root: 'data' })
          .setup();

        const user = testSchema.users.create({ name: 'Bob', email: 'bob@example.com' });

        expect(user.toJSON()).toEqual({
          data: { id: user.id, name: 'Bob', email: 'bob@example.com' },
        });
      });

      it('should not wrap when no global config is set', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Charlie', email: 'charlie@example.com' });

        expect(user.toJSON()).toEqual({
          id: user.id,
          name: 'Charlie',
          email: 'charlie@example.com',
        });
      });
    });

    describe('Collection-level config override', () => {
      it('should override global root config at collection level', () => {
        const testSchema = schema()
          .serializer({ root: true })
          .collections({
            users: collection().model(userModel).serializer({ root: false }).create(),
            posts: collection().model(postModel).create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Eve', email: 'eve@example.com' });
        const post = testSchema.posts.create({ title: 'Test', content: 'Content' });

        // User has root: false (collection override)
        expect(user.toJSON()).toEqual({
          id: user.id,
          name: 'Eve',
          email: 'eve@example.com',
        });

        // Post has root: true (global config)
        expect(post.toJSON()).toEqual({
          post: { id: post.id, title: 'Test', content: 'Content' },
        });
      });

      it('should allow collection-specific attrs filtering with global root', () => {
        const testSchema = schema()
          .serializer({ root: true })
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ attrs: ['id', 'name'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Frank', email: 'frank@example.com' });

        expect(user.toJSON()).toEqual({
          user: { id: user.id, name: 'Frank' },
        });
      });

      it('should merge global and collection config correctly', () => {
        const testSchema = schema()
          .serializer({ root: true, embed: false })
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ attrs: ['id', 'name', 'email'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Grace', email: 'grace@example.com' });

        // Should have root from global, attrs from collection
        expect(user.toJSON()).toEqual({
          user: { id: user.id, name: 'Grace', email: 'grace@example.com' },
        });
      });

      it('should allow overriding global root key with collection custom key', () => {
        const testSchema = schema()
          .serializer({ root: true })
          .collections({
            users: collection().model(userModel).serializer({ root: 'userData' }).create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Henry', email: 'henry@example.com' });

        expect(user.toJSON()).toEqual({
          userData: { id: user.id, name: 'Henry', email: 'henry@example.com' },
        });
      });
    });

    describe('Collection serialization', () => {
      it('should apply global root config to collection serialization', () => {
        const testSchema = schema()
          .serializer({ root: true })
          .collections({
            users: collection().model(userModel).create(),
          })
          .setup();

        const user1 = testSchema.users.create({ name: 'Jack', email: 'jack@example.com' });
        const user2 = testSchema.users.create({ name: 'Jill', email: 'jill@example.com' });

        const allUsers = testSchema.users.all();

        expect(allUsers.toJSON()).toEqual({
          users: [
            { id: user1.id, name: 'Jack', email: 'jack@example.com' },
            { id: user2.id, name: 'Jill', email: 'jill@example.com' },
          ],
        });
      });

      it('should apply collection attrs filter to collection serialization', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ attrs: ['id', 'name'] })
              .create(),
          })
          .setup();

        const user1 = testSchema.users.create({ name: 'Kate', email: 'kate@example.com' });
        const user2 = testSchema.users.create({ name: 'Leo', email: 'leo@example.com' });

        const allUsers = testSchema.users.all();

        expect(allUsers.toJSON()).toEqual([
          { id: user1.id, name: 'Kate' },
          { id: user2.id, name: 'Leo' },
        ]);
      });

      it('should apply merged config to collection serialization', () => {
        const testSchema = schema()
          .serializer({ root: true })
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ attrs: ['id', 'name'] })
              .create(),
          })
          .setup();

        const user1 = testSchema.users.create({ name: 'Mike', email: 'mike@example.com' });
        const user2 = testSchema.users.create({ name: 'Nina', email: 'nina@example.com' });

        const allUsers = testSchema.users.all();

        expect(allUsers.toJSON()).toEqual({
          users: [
            { id: user1.id, name: 'Mike' },
            { id: user2.id, name: 'Nina' },
          ],
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle empty attrs array', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).serializer({ attrs: [] }).create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Paul', email: 'paul@example.com' });

        // Empty attrs should return all attributes (fallback behavior)
        expect(user.toJSON()).toEqual({
          id: user.id,
          name: 'Paul',
          email: 'paul@example.com',
        });
      });

      it('should handle undefined root value correctly', () => {
        const testSchema = schema()
          .serializer({ root: undefined })
          .collections({
            users: collection().model(userModel).create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Quinn', email: 'quinn@example.com' });

        // undefined root should not wrap
        expect(user.toJSON()).toEqual({
          id: user.id,
          name: 'Quinn',
          email: 'quinn@example.com',
        });
      });

      it('should handle both root and attrs at collection level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ root: 'userRecord', attrs: ['id', 'name'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Rachel', email: 'rachel@example.com' });

        expect(user.toJSON()).toEqual({
          userRecord: { id: user.id, name: 'Rachel' },
        });
      });
    });
  });
});
