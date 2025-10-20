import { associations, BelongsTo, HasMany } from '@src/associations';
import { model, Model } from '@src/model';
import { collection, schema, type CollectionConfig } from '@src/schema';

// Setup test models
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

const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

type UserModel = typeof userModel;
type PostModel = typeof postModel;

// Test shareable schema type
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

// Test model classes
const UserModelClass = Model.define<UserModel, TestSchema>(userModel);
const PostModelClass = Model.define<PostModel, TestSchema>(postModel);

// Test schema instance
const testSchema = schema()
  .collections({
    users: collection()
      .model(userModel)
      .relationships({
        posts: associations.hasMany(postModel),
      })
      .create(),
    posts: collection()
      .model(postModel)
      .relationships({
        author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
      })
      .create(),
  })
  .setup();

describe('Model', () => {
  beforeEach(() => {
    testSchema.db.emptyData();
  });

  describe('constructor', () => {
    it('should create a new model with basic attributes', () => {
      const user = new UserModelClass({
        attrs: { name: 'John Doe', email: 'john@example.com' },
        relationships: {
          posts: associations.hasMany(postModel),
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
          posts: associations.hasMany(postModel),
        },
        schema: testSchema,
      });

      expect(user.id).toBeNull();
    });

    it('should expose relationships configuration', () => {
      const user = new UserModelClass({
        attrs: { name: 'John Doe', email: 'john@example.com' },
        relationships: {
          posts: associations.hasMany(postModel),
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
          posts: associations.hasMany(postModel),
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
          author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      });

      expect(post.authorId).toBe(author.id);
    });

    it('should extract foreign keys from hasMany model instances', () => {
      const post1 = new PostModelClass({
        attrs: { title: 'Post 1', content: 'Content 1' },
        relationships: {
          author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      }).save();

      const post2 = new PostModelClass({
        attrs: { title: 'Post 2', content: 'Content 2' },
        relationships: {
          author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
          posts: associations.hasMany(postModel),
        },
        schema: testSchema,
      });

      expect(user.postIds).toEqual([post1.id, post2.id]);
    });

    it('should store relationship model instances as pending updates', () => {
      const author = new UserModelClass({
        attrs: { name: 'Author', email: 'author@example.com' },
        relationships: {
          posts: associations.hasMany(postModel),
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
          author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
          author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      });

      expect(post.authorId).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    describe('save()', () => {
      it('should save a new model to the database', () => {
        const user = new UserModelClass({
          attrs: { name: 'John Doe', email: 'john@example.com' },
          relationships: {
            posts: associations.hasMany(postModel),
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
            posts: associations.hasMany(postModel),
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
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const updatedUser = user.update({ name: 'Jane Doe', email: 'jane@example.com' });

        expect(updatedUser.name).toBe('Jane Doe');
        expect(updatedUser.email).toBe('jane@example.com');
        expect(updatedUser.isSaved()).toBe(true);
      });

      it('should update with relationship model instances', () => {
        const author1 = new UserModelClass({
          attrs: { name: 'Author 1', email: 'author1@example.com' },
          relationships: {
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const author2 = new UserModelClass({
          attrs: { name: 'Author 2', email: 'author2@example.com' },
          relationships: {
            posts: associations.hasMany(postModel),
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
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
          },
          schema: testSchema,
        }).save();

        // Update with a relationship
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
            posts: associations.hasMany(postModel),
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
            posts: associations.hasMany(postModel),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        // Manually update in database
        testSchema.db.getCollection('users').update(user.id!, { name: 'Updated Name' });

        const reloadedUser = user.reload();

        expect(reloadedUser.name).toBe('Updated Name');
        expect(reloadedUser.email).toBe('john@example.com');
        expect(reloadedUser.isSaved()).toBe(true);
      });

      it('should reload relationship data', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
          },
          schema: testSchema,
        }).save();

        // Manually update relationship in database
        testSchema.db.getCollection('users').update(author.id!, { postIds: [post.id!] });

        const reloadedAuthor = author.reload();

        expect(reloadedAuthor.postIds).toEqual([post.id]);
        expect(reloadedAuthor.posts.length).toBe(1);
      });
    });
  });

  describe('relationship methods', () => {
    describe('link()', () => {
      it('should link a belongsTo relationship', () => {
        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com' },
          relationships: {
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post1 = new PostModelClass({
          attrs: { title: 'Post 1', content: 'Content 1' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
          },
          schema: testSchema,
        }).save();

        const post2 = new PostModelClass({
          attrs: { title: 'Post 2', content: 'Content 2' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content', author },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
          },
          schema: testSchema,
        }).save();

        const post2 = new PostModelClass({
          attrs: { title: 'Post 2', content: 'Content 2' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
          },
          schema: testSchema,
        }).save();

        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com', posts: [post1, post2] },
          relationships: {
            posts: associations.hasMany(postModel),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content', author },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const post = new PostModelClass({
          attrs: { title: 'Test Post', content: 'Test content', author },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
          },
          schema: testSchema,
        }).save();

        const post2 = new PostModelClass({
          attrs: { title: 'Post 2', content: 'Content 2' },
          relationships: {
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
          },
          schema: testSchema,
        }).save();

        const author = new UserModelClass({
          attrs: { name: 'Author', email: 'author@example.com', posts: [post1, post2] },
          relationships: {
            posts: associations.hasMany(postModel),
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
            author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
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
            posts: associations.hasMany(postModel),
          },
          schema: testSchema,
        }).save();

        const relatedPosts = author.related('posts');

        expect(relatedPosts).toBeDefined();
        expect(relatedPosts?.length).toBe(0);
      });
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const user = new UserModelClass({
        attrs: { name: 'John Doe', email: 'john@example.com' },
        relationships: {
          posts: associations.hasMany(postModel),
        },
        schema: testSchema,
      }).save();

      const json = user.toJSON();

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
          posts: associations.hasMany(postModel),
        },
        schema: testSchema,
      }).save();

      const post = new PostModelClass({
        attrs: { title: 'Test Post', content: 'Test content', author },
        relationships: {
          author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
        },
        schema: testSchema,
      }).save();

      const json = post.toJSON();

      expect(json).toEqual({
        id: post.id,
        title: 'Test Post',
        content: 'Test content',
        authorId: author.id,
      });
    });
  });
});
