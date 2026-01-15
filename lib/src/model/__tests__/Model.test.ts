import { relations, BelongsTo, HasMany } from '@src/relations';
import { collection, schema, type CollectionConfig } from '@src/schema';
import { Serializer } from '@src/serializer';

import Model from '../Model';
import { model } from '../ModelBuilder';

// Define test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
}

interface PostAttrs {
  id: string;
  title: string;
  content: string;
}

// Define model JSON types
interface UserJSON {
  id: string;
  name: string;
}

interface PostJSON {
  post: {
    id: string;
    title: string;
  };
}

// Create test models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .json<UserJSON>()
  .build();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .json<PostJSON>()
  .build();

// Create test model types
type UserModel = typeof userModel;
type PostModel = typeof postModel;

// Define test schema type
type TestSchema = {
  users: CollectionConfig<
    UserModel,
    {
      posts: HasMany<PostModel>;
    }
  >;
  posts: CollectionConfig<
    PostModel,
    {
      author: BelongsTo<UserModel, 'authorId'>;
    }
  >;
};

// Create test model classes
const UserModelClass = Model.define<UserModel, TestSchema>(userModel);
const PostModelClass = Model.define<PostModel, TestSchema>(postModel);

// Create test schema instance
const testSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .relationships({
        posts: relations.hasMany(postModel),
      })
      .build(),
    posts: collection()
      .model(postModel)
      .relationships({
        author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
      })
      .build(),
  })
  .build();

describe('Model', () => {
  beforeEach(() => {
    // Clear test database
    testSchema.db.emptyData();
  });

  describe('Constructor', () => {
    it('should create a new model with basic attributes', () => {
      const user = new UserModelClass({
        attrs: { name: 'John Doe', email: 'john@example.com' },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      });

      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.isNew()).toBe(true);
    });

    it('should initialize with null id for new models', () => {
      const user = new UserModelClass({
        attrs: { name: 'John Doe', email: 'john@example.com' },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      });

      expect(user.id).toBeNull();
    });

    it('should expose relationships configuration', () => {
      const user = new UserModelClass({
        attrs: { name: 'John Doe', email: 'john@example.com' },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      });

      expect(user.relationships).toBeDefined();
      expect(user.relationships?.posts).toBeDefined();
      expect(user.relationships?.posts.type).toBe('hasMany');
      expect(user.relationships?.posts.targetModel).toBe(postModel);
    });

    it('should extract foreign keys from belongsTo model instances', () => {
      const author = new UserModelClass({
        attrs: { name: 'Author', email: 'author@example.com' },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      }).save();

      const post = new PostModelClass({
        attrs: {
          title: 'Test Post',
          content: 'Test content',
          author,
        },
        relationships: {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      });

      expect(post.authorId).toBe(author.id);
    });

    it('should extract foreign keys from hasMany model instances', () => {
      const post1 = new PostModelClass({
        attrs: { title: 'Post 1', content: 'Content 1' },
        relationships: {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      }).save();

      const post2 = new PostModelClass({
        attrs: { title: 'Post 2', content: 'Content 2' },
        relationships: {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      }).save();

      const user = new UserModelClass({
        attrs: {
          name: 'John Doe',
          email: 'john@example.com',
          posts: [post1, post2],
        },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      });

      expect(user.postIds).toEqual([post1.id, post2.id]);
    });

    it('should store relationship model instances as pending updates', () => {
      const author = new UserModelClass({
        attrs: { name: 'Author', email: 'author@example.com' },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      }).save();

      const post = new PostModelClass({
        attrs: {
          title: 'Test Post',
          content: 'Test content',
          author,
        },
        relationships: {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      });

      // Before save, inverse relationship should not be updated
      expect(author.posts.length).toBe(0);

      // Foreign key should be extracted
      expect(post.authorId).toBe(author.id);
    });

    it('should initialize default foreign key values', () => {
      const post = new PostModelClass({
        attrs: {
          title: 'Test Post',
          content: 'Test content',
        },
        relationships: {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      });

      expect(post.authorId).toBeNull();
    });

    it('should include foreign key in attrs when creating with belongsTo foreign key', () => {
      const post = new PostModelClass({
        attrs: {
          title: 'Test Post',
          content: 'Test content',
          authorId: 'user-123',
        },
        relationships: {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      });

      expect(post.authorId).toBe('user-123');
      expect(post.attrs.authorId).toBe('user-123');
    });

    it('should include foreign keys in attrs when creating with hasMany foreign key array', () => {
      const user = new UserModelClass({
        attrs: {
          name: 'John Doe',
          email: 'john@example.com',
          postIds: ['post-1', 'post-2', 'post-3'],
        },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      });

      expect(user.postIds).toEqual(['post-1', 'post-2', 'post-3']);
      expect(user.attrs.postIds).toEqual(['post-1', 'post-2', 'post-3']);
    });
  });

  describe('CRUD operations', () => {
    describe('save()', () => {
      it('should save a new model to the database', () => {
        const user = new UserModelClass({
          attrs: { name: 'John Doe', email: 'john@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        });

        expect(user.isNew()).toBe(true);

        const savedUser = user.save();

        expect(savedUser.isSaved()).toBe(true);
        expect(savedUser.id).toBeDefined();
        expect(typeof savedUser.id).toBe('string');
        expect(savedUser.name).toBe('John Doe');
      });

      it('should apply pending relationship updates', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: {
            title: 'Test Post',
            content: 'Test content',
            author,
          },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        // After save, pending relationship updates should be applied
        author.reload();

        expect(post.authorId).toBe(author.id);
        expect(post.author).toMatchObject(author);
        expect(author.posts.length).toBe(1);
        expect(author.posts.at(0)).toMatchObject(post);
      });

      it('should update inverse relationships', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        // Link the post to the author
        post.link('author', author);

        author.reload();

        expect(author.posts.length).toBe(1);
        expect(author.posts.at(0)).toMatchObject(post);
      });
    });

    describe('update()', () => {
      it('should update model attributes', () => {
        const user = new UserModelClass({
          attrs: { name: 'John Doe', email: 'john@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const updatedUser = user.update({
          name: 'Jane Doe',
          email: 'jane@example.com',
        });

        expect(updatedUser.name).toBe('Jane Doe');
        expect(updatedUser.email).toBe('jane@example.com');
        expect(updatedUser.isSaved()).toBe(true);
      });

      it('should update with relationship model instances', () => {
        const author1 = new UserModelClass({
          attrs: { name: 'Author 1', email: 'author1@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const author2 = new UserModelClass({
          attrs: { name: 'Author 2', email: 'author2@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: {
            title: 'Test Post',
            content: 'Test content',
            author: author1,
          },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        author1.reload();

        expect(post.authorId).toBe(author1.id);
        expect(author1.posts.at(0)).toMatchObject(post);

        // Update the author
        post.update({ author: author2 });

        author1.reload();
        author2.reload();

        expect(post.authorId).toBe(author2.id);
        expect(post.author).toMatchObject(author2);
        expect(author1.posts.length).toBe(0);
        expect(author2.posts.length).toBe(1);
      });

      it('should apply pending relationship updates', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        post.update({ author });
        author.reload();

        expect(post.authorId).toBe(author.id);
        expect(author.posts.length).toBe(1);
        expect(author.posts.at(0)).toMatchObject(post);
      });
    });

    describe('destroy()', () => {
      it('should remove model from database', () => {
        const user = new UserModelClass({
          attrs: { name: 'John Doe', email: 'john@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const userId = user.id;
        expect(user.isSaved()).toBe(true);

        const destroyedUser = user.destroy();

        expect(destroyedUser.isNew()).toBe(true);
        expect(destroyedUser.isSaved()).toBe(false);
        expect(destroyedUser.id).toBeNull();

        // Verify it's removed from the database
        const foundUser = testSchema.db.getCollection('users').find(userId);
        expect(foundUser).toBeNull();
      });

      it('should reset id to null after destruction', () => {
        const user = new UserModelClass({
          attrs: { name: 'John Doe', email: 'john@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        expect(user.id).not.toBeNull();

        const destroyedUser = user.destroy();

        expect(destroyedUser.id).toBeNull();
        expect(destroyedUser.attrs.id).toBeNull();
      });
    });

    describe('reload()', () => {
      it('should reload model data from database', () => {
        const user = new UserModelClass({
          attrs: { name: 'John Doe', email: 'john@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        // Manually update in database
        testSchema.db
          .getCollection('users')
          .update(user.id!, { name: 'Updated Name' });

        const reloadedUser = user.reload();

        expect(reloadedUser.name).toBe('Updated Name');
        expect(reloadedUser.email).toBe('john@example.com');
        expect(reloadedUser.isSaved()).toBe(true);
      });

      it('should reload relationship data', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        // Manually update relationship in database
        testSchema.db
          .getCollection('users')
          .update(author.id!, { postIds: [post.id!] });

        const reloadedAuthor = author.reload();
        expect(reloadedAuthor.postIds).toEqual([post.id]);
        expect(reloadedAuthor.posts.length).toBe(1);
      });
    });
  });

  describe('Relationship methods', () => {
    describe('link()', () => {
      it('should link a belongsTo relationship', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        post.link('author', author);
        author.reload();

        expect(post.authorId).toBe(author.id);
        expect(post.author).toMatchObject(author);
      });

      it('should link a hasMany relationship', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post1 = new PostModelClass({
          attrs: { title: 'Post 1', content: 'Content 1' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const post2 = new PostModelClass({
          attrs: { title: 'Post 2', content: 'Content 2' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        author.link('posts', [post1, post2]);

        expect(author.postIds).toEqual([post1.id, post2.id]);
        expect(author.posts.length).toBe(2);
      });

      it('should update inverse relationships', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        post.link('author', author);
        author.reload();

        expect(author.postIds).toContain(post.id);
        expect(author.posts.at(0)).toMatchObject(post);
      });
    });

    describe('unlink()', () => {
      it('should unlink a belongsTo relationship', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content', author },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        expect(post.authorId).toBe(author.id);

        post.unlink('author');

        expect(post.authorId).toBeNull();
        expect(post.author).toBeNull();
      });

      it('should unlink a hasMany relationship', () => {
        const post1 = new PostModelClass({
          attrs: { title: 'Post 1', content: 'Content 1' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const post2 = new PostModelClass({
          attrs: { title: 'Post 2', content: 'Content 2' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const author = new UserModelClass({
          attrs: {
            name: 'Author',
            email: 'author@example.com',
            posts: [post1, post2],
          },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        expect(author.postIds).toEqual([post1.id, post2.id]);

        author.unlink('posts');

        expect(author.postIds).toEqual([]);
        expect(author.posts.length).toBe(0);
      });

      it('should update inverse relationships', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content', author },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        author.reload();
        expect(author.posts.length).toBe(1);

        post.unlink('author');
        author.reload();

        expect(author.posts.length).toBe(0);
      });
    });

    describe('related()', () => {
      it('should return related belongsTo model', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content', author },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const relatedAuthor = post.related('author');
        author.reload();

        expect(relatedAuthor).toMatchObject(author);
      });

      it('should return related hasMany models', () => {
        const post1 = new PostModelClass({
          attrs: { title: 'Post 1', content: 'Content 1' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const post2 = new PostModelClass({
          attrs: { title: 'Post 2', content: 'Content 2' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const author = new UserModelClass({
          attrs: {
            name: 'Author',
            email: 'author@example.com',
            posts: [post1, post2],
          },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const relatedPosts = author.related('posts');
        expect(relatedPosts).toBeDefined();
        expect(relatedPosts?.length).toBe(2);
      });

      it('should return null for unset belongsTo relationship', () => {
        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const relatedAuthor = post.related('author');
        expect(relatedAuthor).toBeNull();
      });

      it('should return empty collection for unset hasMany relationship', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const relatedPosts = author.related('posts');
        expect(relatedPosts).toBeDefined();
        expect(relatedPosts?.length).toBe(0);
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const user = new UserModelClass({
        attrs: { name: 'John Doe', email: 'john@example.com' },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      }).save();

      const json: UserJSON = user.toJSON();
      expect(json).toEqual({
        id: user.id,
        name: 'John Doe',
        email: 'john@example.com',
        postIds: [],
      });
    });

    it('should include foreign keys in JSON', () => {
      const author = new UserModelClass({
        attrs: { name: 'Author', email: 'author@example.com' },
        relationships: {
          posts: relations.hasMany(postModel),
        },
        schema: testSchema,
      }).save();

      const post = new PostModelClass({
        attrs: { title: 'Test Post', content: 'Test content', author },
        relationships: {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      }).save();

      const json: PostJSON = post.toJSON();
      expect(json).toEqual({
        id: post.id,
        title: 'Test Post',
        content: 'Test content',
        authorId: author.id,
      });
    });

    describe('with custom Serializer', () => {
      it('should use provided serializer when serializing model', () => {
        const userSerializer = new Serializer<UserModel, TestSchema, UserJSON>(
          userModel,
          {
            select: ['id', 'name'],
          },
        );

        const user = new UserModelClass({
          attrs: { name: 'John Doe', email: 'secret@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
          serializer: userSerializer,
        }).save();

        const json: UserJSON = user.toJSON();
        expect(json).toEqual({
          id: user.id,
          name: 'John Doe',
        });
        expect(json).not.toHaveProperty('email');
      });

      it('should use provided serializer with root wrapping for post model', () => {
        const postSerializer = new Serializer<PostModel, TestSchema, PostJSON>(
          postModel,
          {
            select: ['id', 'title'],
            root: true,
          },
        );

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Secret content' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
          serializer: postSerializer,
        }).save();

        const json: PostJSON = post.toJSON();
        expect(json).toEqual({
          post: {
            id: post.id,
            title: 'Test Post',
          },
        });
        expect(json).not.toHaveProperty('content');
        expect(json).not.toHaveProperty('authorId');
      });
    });
  });

  describe('processAttrs (static method)', () => {
    describe('without relationships', () => {
      it('should return attrs as modelAttrs when no relationships are defined', () => {
        const attrs = { name: 'John Doe', email: 'john@example.com' };
        const result = Model.processAttrs<UserModel, TestSchema>(attrs);

        expect(result.modelAttrs).toEqual(attrs);
        expect(result.relationshipUpdates).toEqual({});
      });

      it('should pass through id attribute', () => {
        const attrs = {
          id: 'custom-id',
          name: 'John Doe',
          email: 'john@example.com',
        };
        const result = Model.processAttrs<UserModel, TestSchema>(attrs);

        expect(result.modelAttrs).toEqual(attrs);
        expect(result.relationshipUpdates).toEqual({});
      });
    });

    describe('with model instances', () => {
      it('should extract foreign key from belongsTo model instance', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: relations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const attrs = {
          title: 'Test Post',
          content: 'Content here',
          author,
        };

        const relationships = {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        };

        const result = Model.processAttrs<PostModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          authorId: author.id,
          title: 'Test Post',
          content: 'Content here',
        });
        expect(result.relationshipUpdates).toEqual({ author: author.id });
      });

      it('should extract foreign keys from hasMany model instances array', () => {
        const post1 = new PostModelClass({
          attrs: { title: 'Post 1', content: 'Content 1' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const post2 = new PostModelClass({
          attrs: { title: 'Post 2', content: 'Content 2' },
          relationships: {
            author: relations.belongsTo(userModel, {
              foreignKey: 'authorId',
            }),
          },
          schema: testSchema,
        }).save();

        const attrs = {
          name: 'John Doe',
          email: 'john@example.com',
          posts: [post1, post2],
        };

        const relationships = {
          posts: relations.hasMany(postModel),
        };

        const result = Model.processAttrs<UserModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          postIds: [post1.id, post2.id],
          name: 'John Doe',
          email: 'john@example.com',
        });
        expect(result.relationshipUpdates).toEqual({
          posts: [post1.id, post2.id],
        });
      });

      it('should handle null belongsTo model instance', () => {
        const attrs = {
          title: 'Test Post',
          content: 'Content here',
          author: null,
        };
        const relationships = {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        };

        const result = Model.processAttrs<PostModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          authorId: null,
          title: 'Test Post',
          content: 'Content here',
        });
        // null is treated as a raw FK value
        expect(result.relationshipUpdates).toEqual({ author: null });
      });

      it('should handle empty hasMany model instances array', () => {
        const attrs = {
          name: 'John Doe',
          email: 'john@example.com',
          posts: [],
        };
        const relationships = {
          posts: relations.hasMany(postModel),
        };

        const result = Model.processAttrs<UserModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          postIds: [],
          name: 'John Doe',
          email: 'john@example.com',
        });
        // Empty array is treated as a raw FK value
        expect(result.relationshipUpdates).toEqual({ posts: [] });
      });
    });

    describe('with raw foreign key values', () => {
      it('should handle belongsTo foreign key', () => {
        const attrs = {
          title: 'Test Post',
          content: 'Content here',
          authorId: 'user-123',
        };
        const relationships = {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        };

        const result = Model.processAttrs<PostModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          authorId: 'user-123',
          title: 'Test Post',
          content: 'Content here',
        });
        expect(result.relationshipUpdates).toEqual({ author: 'user-123' });
      });

      it('should handle hasMany foreign key array', () => {
        const attrs = {
          name: 'John Doe',
          email: 'john@example.com',
          postIds: ['post-1', 'post-2'],
        };
        const relationships = {
          posts: relations.hasMany(postModel),
        };

        const result = Model.processAttrs<UserModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          postIds: ['post-1', 'post-2'],
          name: 'John Doe',
          email: 'john@example.com',
        });
        expect(result.relationshipUpdates).toEqual({
          posts: ['post-1', 'post-2'],
        });
      });

      it('should handle empty hasMany foreign key array', () => {
        const attrs = {
          name: 'John Doe',
          email: 'john@example.com',
          postIds: [],
        };
        const relationships = {
          posts: relations.hasMany(postModel),
        };

        const result = Model.processAttrs<UserModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          postIds: [],
          name: 'John Doe',
          email: 'john@example.com',
        });
        expect(result.relationshipUpdates).toEqual({ posts: [] });
      });

      it('should handle null belongsTo foreign key', () => {
        const attrs = {
          title: 'Test Post',
          content: 'Content here',
          authorId: null,
        };
        const relationships = {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        };

        const result = Model.processAttrs<PostModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          authorId: null,
          title: 'Test Post',
          content: 'Content here',
        });
        expect(result.relationshipUpdates).toEqual({ author: null });
      });
    });

    describe('with default foreign key values', () => {
      it('should initialize belongsTo foreign key with null', () => {
        const attrs = {
          title: 'Test Post',
          content: 'Content here',
        };
        const relationships = {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        };

        const result = Model.processAttrs<PostModel, TestSchema>(
          attrs,
          relationships,
          true,
        );

        expect(result.modelAttrs).toEqual({
          authorId: null,
          title: 'Test Post',
          content: 'Content here',
        });
        expect(result.relationshipUpdates).toEqual({});
      });

      it('should initialize hasMany foreign key with empty array', () => {
        const attrs = {
          name: 'John Doe',
          email: 'john@example.com',
        };
        const relationships = {
          posts: relations.hasMany(postModel),
        };

        const result = Model.processAttrs<UserModel, TestSchema>(
          attrs,
          relationships,
          true,
        );

        expect(result.modelAttrs).toEqual({
          postIds: [],
          name: 'John Doe',
          email: 'john@example.com',
        });
        expect(result.relationshipUpdates).toEqual({});
      });
    });

    describe('mixed scenarios', () => {
      it('should handle mix of regular attributes and relationships', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: { posts: relations.hasMany(postModel) },
          schema: testSchema,
        }).save();

        const attrs = {
          id: 'custom-post-id',
          title: 'Test Post',
          content: 'Content here',
          author,
        };
        const relationships = {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        };

        const result = Model.processAttrs<PostModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          id: 'custom-post-id',
          authorId: author.id,
          title: 'Test Post',
          content: 'Content here',
        });
        expect(result.relationshipUpdates).toEqual({ author: author.id });
      });

      it('should handle partial attributes with relationships', () => {
        const attrs = {
          title: 'Updated Title',
          authorId: 'new-author-id',
        };
        const relationships = {
          author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
        };

        const result = Model.processAttrs<PostModel, TestSchema>(
          attrs,
          relationships,
        );

        expect(result.modelAttrs).toEqual({
          authorId: 'new-author-id',
          title: 'Updated Title',
        });
        expect(result.relationshipUpdates).toEqual({ author: 'new-author-id' });
      });
    });
  });
});
