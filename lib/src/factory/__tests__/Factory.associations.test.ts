import { associations, belongsTo, hasMany, type BelongsTo, type HasMany } from '@src/associations';
import { model } from '@src/model';
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
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();
const commentModel = model().name('comment').collection('comments').attrs<CommentAttrs>().create();
const tagModel = model().name('tag').collection('tags').attrs<TagAttrs>().create();

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
  .create();

const commentFactory = factory()
  .model(commentModel)
  .attrs({
    content: 'Great post!',
  })
  .traits({
    approved: { approved: true },
  })
  .create();

const tagFactory = factory()
  .model(tagModel)
  .attrs({
    name: () => `Tag ${Math.random()}`,
  })
  .traits({
    active: { active: true },
    featured: { featured: true },
  })
  .create();

// Define test schema type
type TestSchema = {
  users: CollectionConfig<UserModel, {}, Factory<UserModel, 'admin' | 'verified'>>;
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
  tags: CollectionConfig<TagModel, {}, Factory<TagModel, 'active' | 'featured'>>;
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
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: associations.belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .create(),
        })
        .setup();

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
          author: associations.create<TestSchema, UserModel>(userModel, 'admin'),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: associations.belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .create(),
        })
        .setup();

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
          author: associations.create<TestSchema, UserModel>(userModel, { name: 'Jane Doe' }),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: associations.belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .create(),
        })
        .setup();

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
          author: associations.create<TestSchema, UserModel>(userModel, 'admin', {
            name: 'Jane Admin',
          }),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: associations.belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .create(),
        })
        .setup();

      const post = testSchema.posts.create();

      expect(post.author?.name).toBe('Jane Admin');
      expect(post.author?.role).toBe('admin');
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
          comments: associations.createMany<TestSchema, CommentModel>(commentModel, 3),
        })
        .create();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              comments: hasMany(commentModel),
            })
            .create(),
          comments: collection().model(commentModel).factory(commentFactory).create(),
        })
        .setup();

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
          comments: associations.createMany<TestSchema, CommentModel>(commentModel, 2, 'approved', {
            content: 'Nice!',
          }),
        })
        .create();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              comments: hasMany(commentModel),
            })
            .create(),
          comments: collection().model(commentModel).factory(commentFactory).create(),
        })
        .setup();

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
          comments: associations.createMany<TestSchema, CommentModel>(commentModel, [
            [{ content: 'First comment' }],
            ['approved', { content: 'Second comment' }],
            [{ content: 'Third comment', approved: false }],
          ]),
        })
        .create();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              comments: hasMany(commentModel),
            })
            .create(),
          comments: collection().model(commentModel).factory(commentFactory).create(),
        })
        .setup();

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
          author: associations.link<TestSchema, UserModel>(userModel),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

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
          author: associations.link<TestSchema, UserModel>(userModel),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

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
          author: associations.link<TestSchema, UserModel>(userModel, { role: 'admin' }),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

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
          author: associations.link<TestSchema, UserModel>(
            userModel,
            (user) => user.role === 'admin',
          ),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

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
          author: associations.link<TestSchema, UserModel>(
            userModel,
            { role: 'admin' },
            'verified',
            { name: 'New Admin' },
          ),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

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
          tags: associations.linkMany<TestSchema, TagModel>(tagModel, 2),
        })
        .create();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              tags: hasMany(tagModel),
            })
            .create(),
          tags: collection().model(tagModel).factory(tagFactory).create(),
        })
        .setup();

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
          tags: associations.linkMany<TestSchema, TagModel>(tagModel, 3),
        })
        .create();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              tags: hasMany(tagModel),
            })
            .create(),
          tags: collection().model(tagModel).factory(tagFactory).create(),
        })
        .setup();

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
          tags: associations.linkMany<TestSchema, TagModel>(
            tagModel,
            2,
            { featured: true },
            'active',
          ),
        })
        .create();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              tags: hasMany(tagModel),
            })
            .create(),
          tags: collection().model(tagModel).factory(tagFactory).create(),
        })
        .setup();

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
          tags: associations.linkMany<TestSchema, TagModel>(tagModel, 2),
        })
        .create();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              tags: hasMany(tagModel),
            })
            .create(),
          tags: collection().model(tagModel).factory(tagFactory).create(),
        })
        .setup();

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
            author: associations.create<TestSchema, UserModel>(userModel),
          },
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

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
            author: associations.create<TestSchema, UserModel>(userModel),
            comments: associations.createMany<TestSchema, CommentModel>(commentModel, 3),
          },
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
              comments: hasMany(commentModel),
            })
            .create(),
          comments: collection().model(commentModel).factory(commentFactory).create(),
        })
        .setup();

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
            comments: associations.createMany<TestSchema, CommentModel>(commentModel, 2),
          },
        })
        .associations({
          author: associations.create<TestSchema, UserModel>(userModel),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
              comments: hasMany(commentModel),
            })
            .create(),
          comments: collection().model(commentModel).factory(commentFactory).create(),
        })
        .setup();

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
            comments: associations.createMany<TestSchema, CommentModel>(commentModel, 2),
          },
        })
        .associations({
          // Factory-level association should override trait association
          comments: associations.createMany<TestSchema, CommentModel>(commentModel, 5),
        })
        .create();

      const testSchema = schema()
        .collections({
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              comments: hasMany(commentModel),
            })
            .create(),
          comments: collection().model(commentModel).factory(commentFactory).create(),
        })
        .setup();

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
            author: associations.create<TestSchema, UserModel>(userModel),
          },
          withComments: {
            comments: associations.createMany<TestSchema, CommentModel>(commentModel, 2),
          },
          published: {
            published: true,
          },
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
              comments: hasMany(commentModel),
            })
            .create(),
          comments: collection().model(commentModel).factory(commentFactory).create(),
        })
        .setup();

      const post = testSchema.posts.create('withAuthor', 'withComments', 'published');

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
            author: associations.create<TestSchema, UserModel>(userModel),
          },
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

      const specificUser = testSchema.users.create({ name: 'Specific User' });
      const post = testSchema.posts.create('withAuthor', { author: specificUser });

      // User-provided author should override trait association
      expect(post.author?.id).toBe(specificUser.id);
      expect(post.author?.name).toBe('Specific User');
      expect(testSchema.users.all().length).toBe(1); // Only the one we explicitly created
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
        .create();

      const postFactory = factory<TestSchema>()
        .model(postModel)
        .attrs({
          title: 'My Post',
          content: 'Content',
        })
        .associations({
          author: associations.create(userModel),
        })
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(customUserFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

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
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(userFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
            })
            .create(),
        })
        .setup();

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
        .create();

      const customCommentFactory = factory<TestSchema>()
        .model(commentModel)
        .attrs({
          content: 'Great post!',
        })
        .associations({
          user: associations.create(userModel),
        })
        .create();

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
        .create();

      const testSchema = schema()
        .collections({
          users: collection().model(userModel).factory(customUserFactory).create(),
          posts: collection<TestSchema>()
            .model(postModel)
            .factory(postFactory)
            .relationships({
              author: belongsTo(userModel, { foreignKey: 'authorId' }),
              comments: hasMany(commentModel),
            })
            .create(),
          comments: collection<TestSchema>()
            .model(commentModel)
            .factory(customCommentFactory)
            .relationships({
              user: belongsTo(userModel),
            })
            .create(),
        })
        .setup();

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
