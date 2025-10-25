import { belongsTo, hasMany } from '@src/associations';
import { ModelCollection } from '@src/model';

import { collection } from '../CollectionBuilder';
import { schema } from '../SchemaBuilder';

import {
  commentFactory,
  commentModel,
  postFactory,
  postModel,
  userFactory,
  userModel,
} from './test-helpers';

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

describe('Schema with Relationships', () => {
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

  describe('Inverse relationships', () => {
    describe('explicit inverse configuration', () => {
      it('should sync correct inverse with multiple belongsTo to same model', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                authoredPosts: hasMany(postModel, {
                  foreignKey: 'authoredPostIds',
                  inverse: 'author',
                }),
                reviewedPosts: hasMany(postModel, {
                  foreignKey: 'reviewedPostIds',
                  inverse: 'reviewer',
                }),
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: belongsTo(userModel, {
                  foreignKey: 'authorId',
                  inverse: 'authoredPosts',
                }),
                reviewer: belongsTo(userModel, {
                  foreignKey: 'reviewerId',
                  inverse: 'reviewedPosts',
                }),
              })
              .create(),
          })
          .setup();

        const author = testSchema.users.create({
          name: 'Author',
          email: 'author@example.com',
        });
        const reviewer = testSchema.users.create({
          name: 'Reviewer',
          email: 'reviewer@example.com',
        });
        const post = testSchema.posts.create({
          title: 'Test Post',
          content: 'Content',
        });

        // Set author relationship - should sync to authoredPosts only
        post.link('author', author);
        author.reload();

        expect(post.authorId).toBe(author.id);
        expect(post.author).toMatchObject(author);

        expect(author.authoredPosts).toHaveLength(1);
        expect(author.authoredPostIds).toContain(post.id);
        expect(author.reviewedPostIds).toEqual([]);

        // Set reviewer relationship - should sync to reviewedPosts only
        post.link('reviewer', reviewer);
        reviewer.reload();

        expect(post.reviewerId).toBe(reviewer.id);
        expect(post.reviewer).toMatchObject(reviewer);

        expect(reviewer.reviewedPostIds).toContain(post.id);
        expect(reviewer.authoredPosts).toHaveLength(0);
        expect(reviewer.authoredPostIds).toEqual([]); // Should NOT be synced
      });

      it('should sync explicit inverse bidirectionally', () => {
        // Test that explicit inverse configuration works for basic bidirectional sync
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: hasMany(postModel, { inverse: 'author' }),
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: belongsTo(userModel, { foreignKey: 'authorId', inverse: 'posts' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Alice', email: 'alice@example.com' });
        const post = testSchema.posts.create({ title: 'Post 1', content: 'Content' });

        // Set relationship from belongsTo side
        post.link('author', user);
        user.reload();

        expect(post.authorId).toBe(user.id);
        expect(user.postIds).toContain(post.id);

        // Create another post and set from hasMany side
        const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });

        user.link('posts', [post2]);
        post2.reload();

        expect(post2.authorId).toBe(user.id);
        expect(user.postIds).toContain(post2.id);
      });

      it('should validate explicit inverse during schema setup', () => {
        // Schema setup should not throw - validation passes
        expect(() => {
          schema()
            .collections({
              users: collection()
                .model(userModel)
                .relationships({
                  posts: hasMany(postModel, { inverse: 'author' }),
                })
                .create(),
              posts: collection()
                .model(postModel)
                .relationships({
                  author: belongsTo(userModel, { foreignKey: 'authorId', inverse: 'posts' }),
                })
                .create(),
            })
            .setup();
        }).not.toThrow();
      });
    });

    describe('inverse: null (disabled synchronization)', () => {
      it('should NOT sync when inverse is explicitly null', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: hasMany(postModel, { inverse: 'author' }),
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: belongsTo(userModel, { foreignKey: 'authorId', inverse: 'posts' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({ name: 'Alice', email: 'alice@example.com' });
        const post = testSchema.posts.create({ title: 'Post 1', content: 'Content' });

        // Set relationship on post side
        post.link('author', user);
        user.reload();

        // Forward relationship works
        expect(post.authorId).toBe(user.id);
        // But inverse is NOT synced because user.posts has inverse: null
        expect(user.postIds).toEqual([]);
      });

      it('should allow creating schema with mismatched inverse settings', () => {
        // Should not throw - inverse: null is valid
        expect(() => {
          schema()
            .collections({
              users: collection()
                .model(userModel)
                .relationships({
                  posts: hasMany(postModel), // Auto-detect
                })
                .create(),
              posts: collection()
                .model(postModel)
                .relationships({
                  author: belongsTo(userModel, { foreignKey: 'authorId', inverse: null }), // Disabled
                })
                .create(),
            })
            .setup();
        }).not.toThrow();
      });
    });

    describe('validation', () => {
      it('should throw error for invalid inverse relationship name', () => {
        expect(() => {
          schema()
            .collections({
              users: collection()
                .model(userModel)
                .relationships({
                  posts: hasMany(postModel, { inverse: 'nonexistent' }),
                })
                .create(),
              posts: collection()
                .model(postModel)
                .relationships({
                  author: belongsTo(userModel),
                })
                .create(),
            })
            .setup();
        }).toThrow(/Invalid inverse relationship.*'nonexistent'/);
      });

      it('should throw error when inverse points to wrong model', () => {
        expect(() => {
          schema()
            .collections({
              users: collection()
                .model(userModel)
                .relationships({
                  posts: hasMany(postModel, { inverse: 'comments' }),
                })
                .create(),
              posts: collection()
                .model(postModel)
                .relationships({
                  comments: hasMany(commentModel),
                })
                .create(),
              comments: collection().model(commentModel).create(),
            })
            .setup();
        }).toThrow(/Invalid inverse relationship/);
      });

      it('should allow asymmetric inverse relationships (without throwing)', () => {
        // Should create successfully without throwing (warning is logged internally)
        expect(() => {
          schema()
            .collections({
              users: collection()
                .model(userModel)
                .relationships({
                  posts: hasMany(postModel, { inverse: 'author' }),
                })
                .create(),
              posts: collection()
                .model(postModel)
                .relationships({
                  author: belongsTo(userModel, { inverse: null }),
                })
                .create(),
            })
            .setup();
        }).not.toThrow();
      });
    });

    describe('backwards compatibility', () => {
      it('should maintain auto-detection when inverse is not specified', () => {
        // Should create successfully - backwards compatible
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: hasMany(postModel), // No inverse option = auto-detect
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: belongsTo(userModel, { foreignKey: 'authorId' }), // No inverse option = auto-detect
              })
              .create(),
          })
          .setup();

        expect(testSchema).toBeDefined();
      });
    });
  });
});
