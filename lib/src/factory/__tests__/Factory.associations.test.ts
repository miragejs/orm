import { associations } from '@src/associations';
import { model } from '@src/model';
import {
  belongsTo,
  hasMany,
  type BelongsTo,
  type HasMany,
} from '@src/relations';
import { collection, schema, type CollectionConfig } from '@src/schema';

import type Factory from '../Factory';
import { factory } from '../FactoryBuilder';

// Define test model attributes
type UserAttrs = {
  id: string;
  name: string;
  email: string;
  role?: string;
  verified?: boolean;
};

type PostAttrs = {
  id: string;
  title: string;
  content: string;
  published?: boolean;
};

type CommentAttrs = {
  id: string;
  content: string;
  approved?: boolean;
};

type TagAttrs = {
  id: string;
  name: string;
  featured?: boolean;
  active?: boolean;
};

// Create test models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .build();
const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .build();
const commentModel = model()
  .name('comment')
  .collection('comments')
  .attrs<CommentAttrs>()
  .build();
const tagModel = model()
  .name('tag')
  .collection('tags')
  .attrs<TagAttrs>()
  .build();

// Create test model types
type UserModel = typeof userModel;
type PostModel = typeof postModel;
type CommentModel = typeof commentModel;
type TagModel = typeof tagModel;

// Create test factories
const userFactory = factory()
  .model(userModel)
  .attrs({
    name: 'John Doe',
    email: 'john@example.com',
  })
  .traits({
    admin: { role: 'admin' },
    verified: { verified: true },
  })
  .build();

const commentFactory = factory()
  .model(commentModel)
  .attrs({
    content: 'Great post!',
  })
  .traits({
    approved: { approved: true },
  })
  .build();

const tagFactory = factory()
  .model(tagModel)
  .attrs({
    name: () => `Tag ${Math.random()}`,
  })
  .traits({
    active: { active: true },
    featured: { featured: true },
  })
  .build();

// Define test schema type
type TestSchema = {
  users: CollectionConfig<
    UserModel,
    {},
    Factory<UserModel, 'admin' | 'verified'>
  >;
  posts: CollectionConfig<
    PostModel,
    {
      author: BelongsTo<UserModel, 'authorId'>;
      comments: HasMany<CommentModel>;
      tags: HasMany<TagModel>;
    },
    Factory<PostModel, 'published'>
  >;
  comments: CollectionConfig<
    CommentModel,
    {
      post: BelongsTo<PostModel, 'postId'>;
      user: BelongsTo<UserModel, 'userId'>;
    },
    Factory<CommentModel, 'approved'>
  >;
  tags: CollectionConfig<
    TagModel,
    {},
    Factory<TagModel, 'active' | 'featured'>
  >;
};

describe('Factory associations', () => {
  describe('create()', () => {
    it('should create one new related model', () => {
      const postFactory = factory()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.create(userModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .build(),
        })
        .build();

      const post = testSchema.posts.create();

      expect(post.author).toBeDefined();
      expect(post.author?.name).toBe('John Doe');
      expect(testSchema.users.all().length).toBe(1);
    });

    it('should create related model with traits', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.create<UserModel, TestSchema>(
            userModel,
            'admin',
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .build(),
        })
        .build();

      const post = testSchema.posts.create();
      expect(post.author?.role).toBe('admin');
    });

    it('should create related model with defaults', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.create<UserModel, TestSchema>(userModel, {
            name: 'Jane Doe',
          }),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .build(),
        })
        .build();

      const post = testSchema.posts.create();
      expect(post.author?.name).toBe('Jane Doe');
    });

    it('should create related model with traits and defaults', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.create<UserModel, TestSchema>(
            userModel,
            'admin',
            {
              name: 'Jane Admin',
            },
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .build(),
        })
        .build();

      const post = testSchema.posts.create();

      expect(post.author?.name).toBe('Jane Admin');
      expect(post.author?.role).toBe('admin');
    });

    it('should inject inverse FK when creating single related model via hasMany with inverse belongsTo', () => {
      // Define a schema where User hasMany Posts with inverse 'author' belongsTo
      type InverseTestSchema = {
        users: CollectionConfig<
          UserModel,
          {
            posts: HasMany<PostModel>;
          },
          Factory<UserModel, 'admin' | 'verified'>
        >;
        posts: CollectionConfig<
          PostModel,
          {
            author: BelongsTo<UserModel, 'authorId'>;
          },
          Factory<PostModel, 'published'>
        >;
      };

      // Post factory with a default 'author' association that would create a NEW user
      // This association should be overridden by the inverse FK injection
      const postFactoryWithDefault = factory<InverseTestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.create(userModel),
        })
        .build();

      // User factory that creates a single post via hasMany association using create()
      const userFactoryWithPost = factory<InverseTestSchema>()
        .model(userModel)
        .attrs({
          name: 'John Doe',
          email: 'john@example.com',
        })
        .traits({
          withPost: {
            posts: associations.createMany(postModel, 1),
          },
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection<InverseTestSchema>()
            .model(userModel)
            .factory(userFactoryWithPost)
            .relationships({
              posts: hasMany(postModel, {
                inverse: 'author', // Specifies the inverse relationship on Post
              }),
            })
            .build(),
          posts: collection<InverseTestSchema>()
            .model(postModel)
            .factory(postFactoryWithDefault)
            .relationships({
              author: belongsTo(userModel, {
                foreignKey: 'authorId',
                inverse: 'posts',
              }),
            })
            .build(),
        })
        .build();

      // Create a user with a single post using the trait
      const user = testSchema.users.create('withPost');

      // User should have exactly 1 post
      expect(user.posts.length).toBe(1);

      const post = user.posts.at(0)!;

      // The post should have authorId set to the parent user's ID
      // (inverse FK injection should have worked)
      expect(post.authorId).toBe(user.id);
      expect(post.author?.id).toBe(user.id);

      // The post factory's default 'author' association should NOT have created
      // additional users because the inverse FK was injected
      expect(testSchema.users.all().length).toBe(1);
      expect(testSchema.posts.all().length).toBe(1);
    });

    it('should synchronize inverse hasMany when creating related model via belongsTo', () => {
      // Define a schema where Comment belongsTo Post with inverse 'comments' hasMany
      type InverseTestSchema = {
        posts: CollectionConfig<
          PostModel,
          {
            comments: HasMany<CommentModel>;
          },
          Factory<PostModel, 'published'>
        >;
        comments: CollectionConfig<
          CommentModel,
          {
            post: BelongsTo<PostModel, 'postId'>;
          },
          Factory<CommentModel, 'approved'>
        >;
      };

      const simplePostFactory = factory<InverseTestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .build();

      // Comment factory that creates a post via belongsTo association
      const commentFactoryWithPost = factory<InverseTestSchema>()
        .model(commentModel)
        .attrs({
          content: 'Great post!',
        })
        .associations({
          post: associations.create<PostModel, InverseTestSchema>(postModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<InverseTestSchema>()
            .model(postModel)
            .factory(simplePostFactory)
            .relationships({
              comments: hasMany(commentModel, {
                inverse: 'post',
              }),
            })
            .build(),
          comments: collection<InverseTestSchema>()
            .model(commentModel)
            .factory(commentFactoryWithPost)
            .relationships({
              post: belongsTo(postModel, {
                foreignKey: 'postId',
                inverse: 'comments',
              }),
            })
            .build(),
        })
        .build();

      // Create a comment which creates a post via belongsTo association
      const comment = testSchema.comments.create();

      // Comment should have a post
      expect(comment.post).toBeDefined();
      expect(comment.postId).toBe(comment.post?.id);

      // The created post should have this comment in its inverse hasMany collection
      // (relationship synchronization should work)
      const post = comment.post!;
      expect(post.comments.length).toBe(1);
      expect(post.comments.at(0)?.id).toBe(comment.id);
    });
  });

  describe('createMany()', () => {
    it('should create N new related models', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          comments: associations.createMany<CommentModel, TestSchema>(
            commentModel,
            3,
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              comments: hasMany(commentModel),
            })
            .build(),
          comments: collection()
            .model(commentModel)
            .factory(commentFactory)
            .build(),
        })
        .build();

      const post = testSchema.posts.create();

      expect(post.comments.length).toBe(3);
      expect(testSchema.comments.all().length).toBe(3);
    });

    it('should create N related models with traits and defaults', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          comments: associations.createMany<CommentModel, TestSchema>(
            commentModel,
            2,
            'approved',
            {
              content: 'Nice!',
            },
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              comments: hasMany(commentModel),
            })
            .build(),
          comments: collection()
            .model(commentModel)
            .factory(commentFactory)
            .build(),
        })
        .build();

      const post = testSchema.posts.create();
      const comments = post.comments.models;

      expect(comments.length).toBe(2);
      expect(comments[0].content).toBe('Nice!');
      expect(comments[0].approved).toBe(true);
    });

    it('should create multiple different related models using array syntax', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          comments: associations.createMany<CommentModel, TestSchema>(
            commentModel,
            [
              [{ content: 'First comment' }],
              ['approved', { content: 'Second comment' }],
              [{ content: 'Third comment', approved: false }],
            ],
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              comments: hasMany(commentModel),
            })
            .build(),
          comments: collection()
            .model(commentModel)
            .factory(commentFactory)
            .build(),
        })
        .build();

      const post = testSchema.posts.create();
      const comments = post.comments.models;

      expect(comments.length).toBe(3);
      expect(comments[0].content).toBe('First comment');
      expect(comments[0].approved).toBeUndefined(); // Factory has no default
      expect(comments[1].content).toBe('Second comment');
      expect(comments[1].approved).toBe(true); // From trait
      expect(comments[2].content).toBe('Third comment');
      expect(comments[2].approved).toBe(false); // Explicitly set
    });

    it('should inject inverse FK when creating related models via hasMany with inverse belongsTo', () => {
      // Define a schema where Post hasMany Comments with inverse 'post' belongsTo
      type InverseTestSchema = {
        posts: CollectionConfig<
          PostModel,
          {
            comments: HasMany<CommentModel>;
          },
          Factory<PostModel, 'published'>
        >;
        comments: CollectionConfig<
          CommentModel,
          {
            post: BelongsTo<PostModel, 'postId'>;
          },
          Factory<CommentModel, 'approved'>
        >;
      };

      // Comment factory with a default 'post' association that would create a NEW post
      // This association should be overridden by the inverse FK injection
      const commentFactoryWithDefault = factory<InverseTestSchema>()
        .model(commentModel)
        .attrs({
          content: 'Great post!',
        })
        .associations({
          post: associations.create(postModel),
        })
        .build();

      // Post factory that creates comments via hasMany association
      const postFactoryWithComments = factory<InverseTestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          comments: associations.createMany<CommentModel, InverseTestSchema>(
            commentModel,
            3,
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<InverseTestSchema>()
            .model(postModel)
            .factory(postFactoryWithComments)
            .relationships({
              comments: hasMany(commentModel, {
                inverse: 'post', // Specifies the inverse relationship on Comment
              }),
            })
            .build(),
          comments: collection<InverseTestSchema>()
            .model(commentModel)
            .factory(commentFactoryWithDefault)
            .relationships({
              post: belongsTo(postModel, {
                foreignKey: 'postId',
                inverse: 'comments',
              }),
            })
            .build(),
        })
        .build();

      // Create a post with 3 comments
      const post = testSchema.posts.create();
      const comments = post.comments.models;

      // All 3 comments should be created
      expect(comments.length).toBe(3);

      // All comments should have postId set to the parent post's ID
      // (inverse FK injection should have worked)
      expect(comments[0].postId).toBe(post.id);
      expect(comments[1].postId).toBe(post.id);
      expect(comments[2].postId).toBe(post.id);

      // The comment factory's default 'post' association should NOT have created
      // additional posts because the inverse FK was injected
      expect(testSchema.posts.all().length).toBe(1);

      // All 3 comments should be linked to the same post
      expect(testSchema.comments.all().length).toBe(3);
      testSchema.comments.all().forEach((comment) => {
        expect(comment.postId).toBe(post.id);
      });
    });
  });

  describe('link()', () => {
    it('should link existing model if found', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.link<UserModel, TestSchema>(userModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      const existingUser = testSchema.users.create({ name: 'Existing User' });
      const post = testSchema.posts.create();

      expect(post.author?.id).toBe(existingUser.id);
      expect(testSchema.users.all().length).toBe(1);
    });

    it('should create new model if none found', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.link<UserModel, TestSchema>(userModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      const post = testSchema.posts.create();

      expect(post.author).toBeDefined();
      expect(testSchema.users.all().length).toBe(1);
    });

    it('should link with query object', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.link<UserModel, TestSchema>(userModel, {
            role: 'admin',
          }),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Regular User' });

      const admin = testSchema.users.create('admin');
      const post = testSchema.posts.create();

      expect(post.author?.id).toBe(admin.id);
    });

    it('should link with predicate function', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.link<UserModel, TestSchema>(
            userModel,
            (user) => user.role === 'admin',
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      testSchema.users.create({ name: 'Regular User' });

      const admin = testSchema.users.create('admin');
      const post = testSchema.posts.create();

      expect(post.author?.id).toBe(admin.id);
    });

    it('should create with traits if no match found', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.link<UserModel, TestSchema>(
            userModel,
            { role: 'admin' },
            'verified',
            { name: 'New Admin' },
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      const post = testSchema.posts.create();

      expect(post.author?.name).toBe('New Admin');
      expect(post.author?.verified).toBe(true);
    });
  });

  describe('linkMany()', () => {
    it('should link N existing models if found', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          tags: associations.linkMany<TagModel, TestSchema>(tagModel, 2),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              tags: hasMany(tagModel),
            })
            .build(),
          tags: collection().model(tagModel).factory(tagFactory).build(),
        })
        .build();

      testSchema.tags.create({ name: 'Tag 1' });
      testSchema.tags.create({ name: 'Tag 2' });
      testSchema.tags.create({ name: 'Tag 3' });

      const post = testSchema.posts.create();

      expect(post.tags.length).toBe(2);
      expect(testSchema.tags.all().length).toBe(3);
    });

    it('should create more if not enough exist', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          tags: associations.linkMany<TagModel, TestSchema>(tagModel, 3),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              tags: hasMany(tagModel),
            })
            .build(),
          tags: collection().model(tagModel).factory(tagFactory).build(),
        })
        .build();

      testSchema.tags.create({ name: 'Tag 1' });

      const post = testSchema.posts.create();

      expect(post.tags.length).toBe(3);
      expect(testSchema.tags.all().length).toBe(3);
    });

    it('should link with query and create if needed', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          tags: associations.linkMany<TagModel, TestSchema>(
            tagModel,
            2,
            { featured: true },
            'active',
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              tags: hasMany(tagModel),
            })
            .build(),
          tags: collection().model(tagModel).factory(tagFactory).build(),
        })
        .build();

      testSchema.tags.create('featured');

      const post = testSchema.posts.create();
      const tags = post.tags.models;

      expect(tags.length).toBe(2);
      // One existing featured tag found by query (doesn't have active trait)
      const existingTag = tags.find((t) => t.featured === true);
      expect(existingTag).toBeDefined();
      // One newly created tag with active trait
      const newTag = tags.find((t) => t.active === true);
      expect(newTag).toBeDefined();
    });

    it('should shuffle results before selecting', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          tags: associations.linkMany<TagModel, TestSchema>(tagModel, 2),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              tags: hasMany(tagModel),
            })
            .build(),
          tags: collection().model(tagModel).factory(tagFactory).build(),
        })
        .build();

      // Create 10 tags
      for (let i = 0; i < 10; i++) {
        testSchema.tags.create({ name: `Tag ${i}` });
      }

      // Create multiple posts and collect selected tag IDs
      const selectedTagIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const post = testSchema.posts.create();
        post.tags.forEach((tag) => selectedTagIds.add(tag.id));
      }

      // If shuffling works, we should have selected more than just the first 2 tags
      expect(selectedTagIds.size).toBeGreaterThan(2);
    });
  });

  describe('traits', () => {
    it('should support defining associations in traits', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .traits({
          withAuthor: {
            published: true,
            author: associations.create<UserModel, TestSchema>(userModel),
          },
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      const post = testSchema.posts.create('withAuthor');

      expect(post.published).toBe(true);
      expect(post.author).toBeDefined();
      expect(post.author?.name).toBe('John Doe');
      expect(testSchema.users.all().length).toBe(1);
    });

    it('should support multiple associations in a trait', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .traits({
          withAuthorAndComments: {
            published: true,
            author: associations.create<UserModel, TestSchema>(userModel),
            comments: associations.createMany<CommentModel, TestSchema>(
              commentModel,
              3,
            ),
          },
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
              comments: hasMany(commentModel),
            })
            .build(),
          comments: collection()
            .model(commentModel)
            .factory(commentFactory)
            .build(),
        })
        .build();

      const post = testSchema.posts.create('withAuthorAndComments');

      expect(post.published).toBe(true);
      expect(post.author).toBeDefined();
      expect(post.comments.length).toBe(3);
      expect(testSchema.users.all().length).toBe(1);
      expect(testSchema.comments.all().length).toBe(3);
    });

    it('should merge trait associations with factory associations', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .traits({
          withComments: {
            comments: associations.createMany<CommentModel, TestSchema>(
              commentModel,
              2,
            ),
          },
        })
        .associations({
          author: associations.create<UserModel, TestSchema>(userModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
              comments: hasMany(commentModel),
            })
            .build(),
          comments: collection()
            .model(commentModel)
            .factory(commentFactory)
            .build(),
        })
        .build();

      const post = testSchema.posts.create('withComments');

      expect(post.author).toBeDefined(); // From factory associations
      expect(post.comments.length).toBe(2); // From trait associations
      expect(testSchema.users.all().length).toBe(1);
      expect(testSchema.comments.all().length).toBe(2);
    });

    it('should prioritize factory associations over trait associations', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .traits({
          withComments: {
            comments: associations.createMany<CommentModel, TestSchema>(
              commentModel,
              2,
            ),
          },
        })
        .associations({
          // Factory-level association should override trait association
          comments: associations.createMany<CommentModel, TestSchema>(
            commentModel,
            5,
          ),
        })
        .build();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              comments: hasMany(commentModel),
            })
            .build(),
          comments: collection()
            .model(commentModel)
            .factory(commentFactory)
            .build(),
        })
        .build();

      const post = testSchema.posts.create('withComments');

      // Factory-level association (5 comments) should win over trait (2 comments)
      expect(post.comments.length).toBe(5);
      expect(testSchema.comments.all().length).toBe(5);
    });

    it('should allow combining multiple traits with associations', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .traits({
          withAuthor: {
            author: associations.create<UserModel, TestSchema>(userModel),
          },
          withComments: {
            comments: associations.createMany<CommentModel, TestSchema>(
              commentModel,
              2,
            ),
          },
          published: {
            published: true,
          },
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
              comments: hasMany(commentModel),
            })
            .build(),
          comments: collection()
            .model(commentModel)
            .factory(commentFactory)
            .build(),
        })
        .build();

      const post = testSchema.posts.create(
        'withAuthor',
        'withComments',
        'published',
      );

      expect(post.published).toBe(true);
      expect(post.author).toBeDefined();
      expect(post.comments.length).toBe(2);
      expect(testSchema.users.all().length).toBe(1);
      expect(testSchema.comments.all().length).toBe(2);
    });

    it('should allow user-provided relationships to override trait associations', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .traits({
          withAuthor: {
            author: associations.create<UserModel, TestSchema>(userModel),
          },
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      const specificUser = testSchema.users.create({ name: 'Specific User' });
      const post = testSchema.posts.create('withAuthor', {
        author: specificUser,
      });

      // User-provided author should override trait association
      expect(post.author?.id).toBe(specificUser.id);
      expect(post.author?.name).toBe('Specific User');
      expect(testSchema.users.all().length).toBe(1); // Only the one we explicitly created
    });

    it('should process factory associations before trait associations', () => {
      // Scenario: Task has a creator (factory default link) and assignee (trait create)
      // Factory's creator link should run first (creating a user if none exist),
      // then trait's assignee create should run second (creating a new user)
      type TaskAttrs = {
        id: string;
        title: string;
      };

      const taskModel = model()
        .name('task')
        .collection('tasks')
        .attrs<TaskAttrs>()
        .build();

      type TaskModel = typeof taskModel;

      type TaskTestSchema = {
        users: CollectionConfig<
          UserModel,
          {},
          Factory<UserModel, 'admin' | 'verified'>
        >;
        tasks: CollectionConfig<
          TaskModel,
          {
            creator: BelongsTo<UserModel, 'creatorId'>;
            assignee: BelongsTo<UserModel, 'assigneeId'>;
          },
          Factory<TaskModel, 'withAssignee'>
        >;
      };

      const taskFactory = factory<TaskTestSchema>()
        .model(taskModel)
        .attrs({
          title: 'My Task',
        })
        .traits({
          withAssignee: {
            // Trait: always creates a NEW user for assignee
            assignee: associations.create<UserModel, TaskTestSchema>(userModel),
          },
        })
        .associations({
          // Factory default: link to existing user OR create if none found
          creator: associations.link<UserModel, TaskTestSchema>(userModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          tasks: collection<TaskTestSchema>()
            .model(taskModel)
            .factory(taskFactory)
            .relationships({
              creator: belongsTo(userModel, { foreignKey: 'creatorId' }),
              assignee: belongsTo(userModel, { foreignKey: 'assigneeId' }),
            })
            .build(),
        })
        .build();

      // Collection is empty - no users exist yet
      expect(testSchema.users.all().length).toBe(0);

      // Create a task with the withAssignee trait
      const task = testSchema.tasks.create('withAssignee');

      // Factory association (creator link) should be processed FIRST:
      // - No users exist, so it creates a new user
      // Trait association (assignee create) should be processed SECOND:
      // - Always creates a new user, regardless of existing users
      // Result: 2 different users should exist
      expect(testSchema.users.all().length).toBe(2);

      // Creator and assignee should be different users
      expect(task.creator).toBeDefined();
      expect(task.assignee).toBeDefined();
      expect(task.creator?.id).not.toBe(task.assignee?.id);
    });
  });

  describe('edge cases', () => {
    it('should override association with user-provided relationship', () => {
      const customUserFactory = factory()
        .model(userModel)
        .attrs({
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
        })
        .build();

      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.create(userModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .factory(customUserFactory)
            .build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      const specificUser = testSchema.users.create({ name: 'Specific User' });
      const post = testSchema.posts.create({ author: specificUser });

      expect(post.author?.id).toBe(specificUser.id);
      expect(testSchema.users.all().length).toBe(1);
    });

    it('should not execute factory association when user provides foreign key or model instance', () => {
      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.create(userModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .build(),
        })
        .build();

      // Case 1: User provides foreign key directly
      const existingUser = testSchema.users.create({ name: 'Existing User' });
      const post1 = testSchema.posts.create({ authorId: existingUser.id });

      expect(post1.authorId).toBe(existingUser.id);
      expect(post1.author?.id).toBe(existingUser.id);
      expect(post1.author?.name).toBe('Existing User');

      // Only 1 user should exist (the one we created explicitly)
      // Factory association should NOT have created a second user
      expect(testSchema.users.all().length).toBe(1);

      // Case 2: User provides model instance directly
      const anotherUser = testSchema.users.create({ name: 'Another User' });
      const post2 = testSchema.posts.create({ author: anotherUser });

      expect(post2.authorId).toBe(anotherUser.id);
      expect(post2.author?.id).toBe(anotherUser.id);
      expect(post2.author?.name).toBe('Another User');

      // Only 2 users should exist (the two we created explicitly)
      // Factory association should NOT have created any additional users
      expect(testSchema.users.all().length).toBe(2);

      // Case 3: User provides null for optional relationship
      const post3 = testSchema.posts.create({ author: null });

      expect(post3.authorId).toBeNull();
      expect(post3.author).toBeNull();

      // Still only 2 users - factory association should NOT have run
      expect(testSchema.users.all().length).toBe(2);

      // Case 4: User provides nothing - factory association should execute
      const post4 = testSchema.posts.create();

      expect(post4.authorId).toBeDefined();
      expect(post4.author).toBeDefined();
      expect(post4.author?.name).toBe('John Doe'); // Default from userFactory

      // Now we should have 3 users (factory association created one)
      expect(testSchema.users.all().length).toBe(3);
    });

    it('should handle nested associations', () => {
      const customUserFactory = factory()
        .model(userModel)
        .attrs({
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
        })
        .build();

      const customCommentFactory = factory<TestSchema>()
        .model(commentModel)
        .attrs({
          content: 'Great post!',
        })
        .associations({
          user: associations.create(userModel),
        })
        .build();

      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          comments: associations.createMany(commentModel, 2),
          author: associations.create(userModel),
        })
        .build();

      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .factory(customUserFactory)
            .build(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
              comments: hasMany(commentModel),
            })
            .build(),
          comments: collection<TestSchema>()
            .model(commentModel)
            .factory(customCommentFactory)
            .relationships({
              user: belongsTo(userModel),
            })
            .build(),
        })
        .build();

      const post = testSchema.posts.create();
      const comments = post.comments.models;

      expect(comments.length).toBe(2);
      expect(post.author).toBeDefined();
      // Each comment should have its own user created by the comment factory
      expect(comments[0].user).toBeDefined();
      expect(comments[1].user).toBeDefined();
    });
  });
});
