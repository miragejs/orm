import { belongsTo, hasMany } from '@src/associations';
import { ModelCollection, ModelIdFor } from '@src/model';

import { collection } from '../CollectionBuilder';
import { schema } from '../SchemaBuilder';

import {
  commentFactory,
  commentModel,
  postFactory,
  PostModel,
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

  describe('Create with foreign keys', () => {
    it('should create belongsTo relationship with foreign key', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
        authorId: user.id,
      });

      expect(post.authorId).toBe(user.id);
      expect(post.author?.name).toBe('John');

      // Verify bidirectional sync
      user.reload();
      expect(user.postIds).toEqual([post.id]);
      expect(user.posts).toHaveLength(1);
    });

    it('should create belongsTo relationship with foreign key as relationship name', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post = testSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
        authorId: user.id,
      });

      expect(post.authorId).toBe(user.id);
      expect(post.author?.name).toBe('John');

      // Verify bidirectional sync
      user.reload();
      expect(user.postIds).toEqual([post.id]);
      expect(user.posts).toHaveLength(1);
    });

    it('should create hasMany relationship with foreign key array', () => {
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });
      const user = testSchema.users.create({
        name: 'John',
        email: 'john@example.com',
        postIds: [post1.id, post2.id],
      });

      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);

      // Verify bidirectional sync
      post1.reload();
      post2.reload();

      expect(post1.authorId).toBe(user.id);
      expect(post1.author?.name).toBe('John');
      expect(post2.authorId).toBe(user.id);
      expect(post2.author?.name).toBe('John');
    });

    it('should create hasMany relationship with foreign key array as relationship name', () => {
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const post2 = testSchema.posts.create({ title: 'Post 2', content: 'Content 2' });
      const user = testSchema.users.create({
        name: 'John',
        email: 'john@example.com',
        postIds: [post1.id, post2.id],
      });

      expect(user.postIds).toEqual([post1.id, post2.id]);
      expect(user.posts).toHaveLength(2);

      // Verify bidirectional sync
      post1.reload();
      post2.reload();

      expect(post1.authorId).toBe(user.id);
      expect(post1.author?.name).toBe('John');
      expect(post2.authorId).toBe(user.id);
      expect(post2.author?.name).toBe('John');
    });

    it('should create with null foreign key for optional belongsTo', () => {
      const post = testSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
        authorId: null,
      });

      expect(post.authorId).toBeNull();
      expect(post.author).toBeNull();
    });

    it('should create with null foreign key as relationship name', () => {
      const post = testSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
        author: null,
      });

      expect(post.authorId).toBeNull();
      expect(post.author).toBeNull();
    });

    it('should create with empty array for hasMany foreign keys', () => {
      const user = testSchema.users.create({
        name: 'John',
        email: 'john@example.com',
        postIds: [],
      });

      expect(user.postIds).toEqual([]);
      expect(user.posts).toHaveLength(0);
    });

    it('should create with empty array as relationship name', () => {
      const user = testSchema.users.create({
        name: 'John',
        email: 'john@example.com',
        posts: [],
      });

      expect(user.postIds).toEqual([]);
      expect(user.posts).toHaveLength(0);
    });

    it('should handle mixed foreign keys and model instances in creation', () => {
      const user = testSchema.users.create({ name: 'John', email: 'john@example.com' });
      const post1 = testSchema.posts.create({
        title: 'Post 1',
        content: 'Content 1',
        authorId: user.id, // Foreign key
      });
      const post2 = testSchema.posts.create({
        title: 'Post 2',
        content: 'Content 2',
        author: user, // Model instance
      });

      // Verify both posts are created correctly
      expect(post1.authorId).toBe(user.id);
      expect(post1.author?.name).toBe('John');
      expect(post2.authorId).toBe(user.id);
      expect(post2.author?.name).toBe('John');

      // Verify user has both posts after reload
      user.reload();
      expect(user.postIds).toEqual([post1.id, post2.id]);
    });

    it('should handle creating with non-existent foreign key', () => {
      const post = testSchema.posts.create({
        title: 'My Post',
        content: 'Content here',
        authorId: 'non-existent-id',
      });

      expect(post.authorId).toBe('non-existent-id');
      // Author should be null since the ID doesn't exist
      expect(post.author).toBeNull();
    });

    it("should handle creating with partial foreign key array (some exist, some don't)", () => {
      const post1 = testSchema.posts.create({ title: 'Post 1', content: 'Content 1' });
      const user = testSchema.users.create({
        name: 'John',
        email: 'john@example.com',
        postIds: [post1.id, 'non-existent-id' as unknown as ModelIdFor<PostModel>],
      });

      // Should only link the existing post
      expect(user.postIds).toEqual([post1.id, 'non-existent-id']);
      expect(user.posts).toHaveLength(1);
      expect(user.posts.at(0)?.id).toBe(post1.id);

      // Verify bidirectional sync for existing post
      post1.reload();
      expect(post1.authorId).toBe(user.id);
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

        // Test 1: Set author relationship via link - should sync to authoredPosts only
        post.link('author', author);
        author.reload();

        expect(post.authorId).toBe(author.id);
        expect(post.author).toMatchObject(author);
        expect(author.authoredPosts).toHaveLength(1);
        expect(author.authoredPostIds).toContain(post.id);
        expect(author.reviewedPostIds).toEqual([]);

        // Test 2: Set reviewer relationship via link - should sync to reviewedPosts only
        post.link('reviewer', reviewer);
        reviewer.reload();

        expect(post.reviewerId).toBe(reviewer.id);
        expect(post.reviewer).toMatchObject(reviewer);
        expect(reviewer.reviewedPostIds).toContain(post.id);
        expect(reviewer.authoredPosts).toHaveLength(0);
        expect(reviewer.authoredPostIds).toEqual([]);

        // Test 3: Create a second post with author via creation
        const post2 = testSchema.posts.create({
          title: 'Test Post 2',
          content: 'Content 2',
          author,
        });

        author.reload();
        expect(author.authoredPostIds).toEqual([post.id, post2.id]);
        expect(author.reviewedPostIds).toEqual([]); // Still empty

        // Test 4: Update post2's reviewer - should not affect author
        post2.update({ reviewer });
        author.reload();
        reviewer.reload();

        expect(author.authoredPostIds).toEqual([post.id, post2.id]); // Unchanged
        expect(author.reviewedPostIds).toEqual([]); // Still empty
        expect(reviewer.authoredPostIds).toEqual([]); // Still empty
        expect(reviewer.reviewedPostIds).toEqual([post.id, post2.id]); // Now has both posts

        // Test 5: Update post's author to different user - should remove from original author
        const newAuthor = testSchema.users.create({
          name: 'New Author',
          email: 'new@example.com',
        });
        post.update({ author: newAuthor });
        author.reload();
        newAuthor.reload();

        expect(author.authoredPostIds).toEqual([post2.id]); // post removed
        expect(newAuthor.authoredPostIds).toEqual([post.id]); // post added
        expect(author.reviewedPostIds).toEqual([]); // Unchanged
        expect(newAuthor.reviewedPostIds).toEqual([]); // Not affected
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
                authoredPosts: hasMany(postModel, {
                  foreignKey: 'authoredPostIds',
                  inverse: 'author',
                }),
                reviewedPosts: hasMany(postModel, {
                  foreignKey: 'reviewedPostIds',
                  inverse: null, // This one should NOT sync
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

        const user = testSchema.users.create({ name: 'Alice', email: 'alice@example.com' });
        const post = testSchema.posts.create({ title: 'Post 1', content: 'Content' });

        // Test 1: Set author relationship - should sync to authoredPosts
        post.link('author', user);
        user.reload();

        expect(post.authorId).toBe(user.id);
        expect(user.authoredPostIds).toEqual([post.id]); // Synced
        expect(user.reviewedPostIds).toEqual([]); // Still empty

        // Test 2: Set reviewer relationship - should NOT sync because inverse is null
        post.link('reviewer', user);
        user.reload();

        expect(post.reviewerId).toBe(user.id);
        expect(user.authoredPostIds).toEqual([post.id]); // Unchanged from before
        expect(user.reviewedPostIds).toEqual([]); // NOT synced due to inverse: null

        // Test 3: Create another post with reviewer - should also NOT sync
        const post2 = testSchema.posts.create({
          title: 'Post 2',
          content: 'Content 2',
          reviewer: user,
        });

        user.reload();
        expect(post2.reviewerId).toBe(user.id);
        expect(user.reviewedPostIds).toEqual([]); // Still NOT synced

        // Test 4: Update post's reviewer - should also NOT sync
        const newReviewer = testSchema.users.create({
          name: 'New Reviewer',
          email: 'new@example.com',
        });
        post.update({ reviewer: newReviewer });
        user.reload();
        newReviewer.reload();

        expect(post.reviewerId).toBe(newReviewer.id);
        expect(user.reviewedPostIds).toEqual([]); // Still NOT synced
        expect(newReviewer.reviewedPostIds).toEqual([]); // Also NOT synced
        expect(user.authoredPostIds).toEqual([post.id]); // But author inverse still works
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
});
