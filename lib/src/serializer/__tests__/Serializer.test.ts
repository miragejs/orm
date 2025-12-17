import { associations } from '@src/associations';
import { model, ModelInstance } from '@src/model';
import { collection, schema, SchemaCollections } from '@src/schema';

import Serializer from '../Serializer';

// Define test attribute types
type UserAttrs = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
};

type PostAttrs = {
  id: string;
  title: string;
  content: string;
  authorId: string;
};

type CommentAttrs = {
  id: string;
  content: string;
  postId: string;
  userId: string;
};

// Define JSON types for serialized output
type UserJSON = {
  id: string;
  name: string;
  email: string;
};

type UserRootJSON = {
  user: UserJSON;
};

type PostJSON = {
  id: string;
  title: string;
};

type PostsJSON = {
  posts: PostJSON[];
};

// Create base model templates with default JSON types
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .json<UserJSON>()
  .create();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .json<PostJSON, PostJSON[]>()
  .create();

describe('Serializer', () => {
  describe('Serializer options via collection builder', () => {
    it('should serialize a model with default settings (no filtering)', () => {
      // Using model without .json() to test raw attributes serialization
      const rawUserModel = model().name('user').collection('users').attrs<UserAttrs>().create();

      const testSchema = schema()
        .collections({
          users: collection().model(rawUserModel).create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        password: 'secret123',
      });
      const json: UserAttrs = user.toJSON();

      expect(json).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
    });

    it('should serialize a model with attribute filtering using select (array)', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .serializer({ select: ['id', 'name', 'email'] })
            .create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json: UserJSON = user.toJSON();

      expect(json).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(json).not.toHaveProperty('password');
      expect(json).not.toHaveProperty('role');
    });

    it('should serialize a model with root wrapping (boolean)', () => {
      const rootUserModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .json<UserRootJSON>()
        .create();

      const testSchema = schema()
        .collections({
          users: collection()
            .model(rootUserModel)
            .serializer({ select: ['id', 'name', 'email'], root: true })
            .create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json: UserRootJSON = user.toJSON();

      expect(json).toEqual({
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
    });

    it('should serialize a model with custom root key', () => {
      type PersonJSON = { person: UserJSON };

      const personModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .json<PersonJSON>()
        .create();

      const testSchema = schema()
        .collections({
          users: collection()
            .model(personModel)
            .serializer({ select: ['id', 'name', 'email'], root: 'person' })
            .create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json: PersonJSON = user.toJSON();

      expect(json).toEqual({
        person: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
    });
  });

  describe('Select option formats', () => {
    describe('Array format', () => {
      it('should include only specified attributes', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
          role: 'admin',
        });

        const json = user.toJSON();
        expect(json).toEqual({ id: '1', name: 'Alice' });
      });
    });

    describe('Object format - exclusion mode', () => {
      it('should exclude false attributes when all values are false', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: { password: false, role: false } })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
          role: 'admin',
        });

        const json = user.toJSON();
        expect(json).toEqual({ id: '1', name: 'Bob', email: 'bob@example.com' });
        expect(json).not.toHaveProperty('password');
        expect(json).not.toHaveProperty('role');
      });
    });

    describe('Object format - inclusion mode', () => {
      it('should include only true attributes when all values are true', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: { id: true, name: true } })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
          role: 'user',
        });

        const json = user.toJSON();
        expect(json).toEqual({ id: '1', name: 'Charlie' });
      });

      it('should include only true attributes when mixed values', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: { id: true, name: true, email: false, password: false } })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Diana',
          email: 'diana@example.com',
          password: 'secret',
          role: 'admin',
        });

        const json = user.toJSON();
        expect(json).toEqual({ id: '1', name: 'Diana' });
      });
    });
  });

  describe('Collection serialization', () => {
    it('should serialize a collection without root wrapping', () => {
      const testSchema = schema()
        .collections({
          posts: collection()
            .model(postModel)
            .serializer({ select: ['id', 'title'] })
            .create(),
        })
        .setup();

      testSchema.posts.create({
        title: 'First Post',
        content: 'Content 1',
        authorId: '1',
      });
      testSchema.posts.create({
        title: 'Second Post',
        content: 'Content 2',
        authorId: '1',
      });

      const posts = testSchema.posts.all();
      const json: PostJSON[] = posts.toJSON();

      expect(json).toEqual([
        { id: '1', title: 'First Post' },
        { id: '2', title: 'Second Post' },
      ]);
    });

    it('should serialize a collection with root wrapping', () => {
      const rootPostModel = model()
        .name('post')
        .collection('posts')
        .attrs<PostAttrs>()
        .json<PostJSON, PostsJSON>()
        .create();

      const testSchema = schema()
        .collections({
          posts: collection()
            .model(rootPostModel)
            .serializer({ select: ['id', 'title'], root: true })
            .create(),
        })
        .setup();

      testSchema.posts.create({
        title: 'First Post',
        content: 'Content 1',
        authorId: '1',
      });
      testSchema.posts.create({
        title: 'Second Post',
        content: 'Content 2',
        authorId: '1',
      });

      const posts = testSchema.posts.all();
      const json: PostsJSON = posts.toJSON();

      expect(json).toEqual({
        posts: [
          { id: '1', title: 'First Post' },
          { id: '2', title: 'Second Post' },
        ],
      });
    });

    it('should serialize an empty collection', () => {
      const rootPostModel = model()
        .name('post')
        .collection('posts')
        .attrs<PostAttrs>()
        .json<PostJSON, PostsJSON>()
        .create();

      const testSchema = schema()
        .collections({
          posts: collection()
            .model(rootPostModel)
            .serializer({ select: ['id', 'title'], root: true })
            .create(),
        })
        .setup();

      const posts = testSchema.posts.all();
      const json: PostsJSON = posts.toJSON();

      expect(json).toEqual({ posts: [] });
    });
  });

  describe('Fallback behavior', () => {
    it('should return raw attributes when no serializer is configured', () => {
      // Using model without .json() to test raw attributes serialization
      const rawUserModel = model().name('user').collection('users').attrs<UserAttrs>().create();
      const userCollection = collection().model(rawUserModel).create();
      const testSchema = schema().collections({ users: userCollection }).setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json: UserAttrs = user.toJSON();

      // Should return all attributes when no serializer
      expect(json).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
    });

    it('should return array of raw attributes for collection when no serializer', () => {
      // Using model without .json() to test raw attributes serialization
      const rawPostModel = model().name('post').collection('posts').attrs<PostAttrs>().create();
      const postCollection = collection().model(rawPostModel).create();
      const testSchema = schema().collections({ posts: postCollection }).setup();

      testSchema.posts.create({
        title: 'First Post',
        content: 'Content 1',
        authorId: '1',
      });
      testSchema.posts.create({
        title: 'Second Post',
        content: 'Content 2',
        authorId: '1',
      });

      const posts = testSchema.posts.all();
      const json: PostAttrs[] = posts.toJSON();

      expect(json).toEqual([
        { id: '1', title: 'First Post', content: 'Content 1', authorId: '1' },
        { id: '2', title: 'Second Post', content: 'Content 2', authorId: '1' },
      ]);
    });
  });

  describe('Serializer getters', () => {
    it('should expose modelName getter', () => {
      const serializer = new Serializer(userModel);
      expect(serializer.modelName).toBe('user');
    });

    it('should expose collectionName getter', () => {
      const serializer = new Serializer(userModel);
      expect(serializer.collectionName).toBe('users');
    });
  });

  describe('Custom serializer extension', () => {
    it('should allow extending Serializer for custom logic', () => {
      type UserWithTimestampJSON = UserJSON & { timestamp: string };

      const customUserModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .json<UserWithTimestampJSON>()
        .create();

      // Custom serializer with schema-aware type
      class TimestampSerializer<
        TSchema extends SchemaCollections = SchemaCollections,
      > extends Serializer<typeof customUserModel, TSchema> {
        serialize(model: ModelInstance<typeof customUserModel, TSchema>) {
          const data = super.serialize(model);
          return {
            ...data,
            timestamp: new Date('2024-01-01').toISOString(),
          };
        }
      }

      const serializer = new TimestampSerializer(customUserModel, {
        select: ['id', 'name', 'email'],
      });
      const userCollection = collection().model(customUserModel).serializer(serializer).create();
      const testSchema = schema().collections({ users: userCollection }).setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json: UserWithTimestampJSON = user.toJSON();

      expect(json).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  describe('Multiple collections with different serializers', () => {
    it('should support different serializer options for different collections', () => {
      type UserRootJSON = { user: UserJSON };

      const rootUserModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .json<UserRootJSON>()
        .create();

      const testSchema = schema()
        .collections({
          users: collection()
            .model(rootUserModel)
            .serializer({ select: ['id', 'name', 'email'], root: 'user' })
            .create(),
          posts: collection()
            .model(postModel)
            .serializer({ select: ['id', 'title'] })
            .create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
        role: 'admin',
      });
      const post = testSchema.posts.create({
        title: 'My Post',
        content: 'Content',
        authorId: user.id,
      });

      const userJson: UserRootJSON = user.toJSON();
      const postJson: PostJSON = post.toJSON();

      // User should have root wrapping
      expect(userJson).toEqual({
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      // Post should not have root wrapping
      expect(postJson).toEqual({
        id: '2',
        title: 'My Post',
      });
    });
  });

  describe('Relationships serialization', () => {
    describe('belongsTo relationships', () => {
      it('should include foreign key only with with (default relationsMode=undefined)', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                  collectionName: 'authors',
                }),
              })
              .serializer({ with: ['author'] }) // relationsMode defaults to undefined
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Hello World',
          content: 'My first post',
          author: user,
        });

        // Default behavior: only include foreign key, no relationship data
        const json = post.toJSON();
        expect(json).toEqual({
          id: post.id,
          title: 'Hello World',
          content: 'My first post',
          authorId: user.id,
        });
      });

      it('should side-load belongsTo with relationsMode: sideLoaded', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                  collectionName: 'authors',
                }),
              })
              .serializer({ with: ['author'], relationsMode: 'sideLoaded' })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Hello World',
          content: 'My first post',
          author: user,
        });

        // Side-loading: auto-enables root, keeps foreign key, side-loads relationship at top level
        const json = post.toJSON();
        expect(json).toEqual({
          post: {
            id: post.id,
            title: 'Hello World',
            content: 'My first post',
            authorId: user.id,
          },
          authors: [
            {
              id: user.id,
              name: 'Alice',
              email: 'alice@example.com',
              password: 'secret',
            },
          ],
        });
      });

      it('should embed belongsTo with relationsMode: embedded', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .serializer({ with: ['author'], relationsMode: 'embedded' })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
          role: 'admin',
        });
        const post = testSchema.posts.create({
          title: 'Test Post',
          content: 'Content here',
          author: user,
        });

        // Embedding: remove foreign key, replace with full author model
        const json = post.toJSON();
        expect(json).toEqual({
          id: post.id,
          title: 'Test Post',
          content: 'Content here',
          author: {
            id: user.id,
            name: 'Bob',
            email: 'bob@example.com',
            password: 'secret',
            role: 'admin',
          },
        });
        expect(json).not.toHaveProperty('authorId');
      });

      it('should handle null belongsTo relationship', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .serializer({ with: ['author'], relationsMode: 'embedded' })
              .create(),
          })
          .setup();

        const post = testSchema.posts.create({
          title: 'Orphan Post',
          content: 'No author',
        });

        const json = post.toJSON();

        // Embedding: remove foreign key even when null
        expect(json).toEqual({
          id: post.id,
          title: 'Orphan Post',
          content: 'No author',
          author: null,
        });
        expect(json).not.toHaveProperty('authorId');
      });
    });

    describe('hasMany relationships', () => {
      it('should include foreign keys only with with (default relationsMode=undefined)', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel), // Uses default: postIds
              })
              .serializer({ with: ['posts'] }) // relationsMode defaults to undefined
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
        });
        const post1 = testSchema.posts.create({
          title: 'Post 1',
          content: 'Content 1',
          authorId: user.id,
        });
        const post2 = testSchema.posts.create({
          title: 'Post 2',
          content: 'Content 2',
          authorId: user.id,
        });

        user.reload(); // Reload to get updated postIds
        const json = user.toJSON();

        // Default behavior: only include foreign keys, no relationship data
        expect(json).toEqual({
          id: user.id,
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
          postIds: [post1.id, post2.id],
        });
      });

      it('should side-load hasMany with relationsMode: sideLoaded', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel), // Uses default: postIds
              })
              .serializer({ with: ['posts'], relationsMode: 'sideLoaded' })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
        });
        const post1 = testSchema.posts.create({
          title: 'Post 1',
          content: 'Content 1',
          authorId: user.id,
        });
        const post2 = testSchema.posts.create({
          title: 'Post 2',
          content: 'Content 2',
          authorId: user.id,
        });

        user.reload(); // Reload to get updated postIds
        const json = user.toJSON();

        // Side-loading: auto-enables root, keeps foreign key, side-loads posts at top level
        expect(json).toEqual({
          user: {
            id: user.id,
            name: 'Charlie',
            email: 'charlie@example.com',
            password: 'secret',
            postIds: [post1.id, post2.id],
          },
          posts: [
            {
              id: post1.id,
              title: 'Post 1',
              content: 'Content 1',
              authorId: user.id,
            },
            {
              id: post2.id,
              title: 'Post 2',
              content: 'Content 2',
              authorId: user.id,
            },
          ],
        });
      });

      it('should embed hasMany with relationsMode: embedded', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: ['posts'], relationsMode: 'embedded' })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Diana',
          email: 'diana@example.com',
          password: 'secret',
        });
        const post1 = testSchema.posts.create({
          title: 'First Post',
          content: 'First content',
          authorId: user.id,
        });
        const post2 = testSchema.posts.create({
          title: 'Second Post',
          content: 'Second content',
          authorId: user.id,
        });

        user.reload(); // Reload to get updated postIds
        const json = user.toJSON();

        // Embedding: remove foreign key, replace with full posts array
        expect(json).toEqual({
          id: user.id,
          name: 'Diana',
          email: 'diana@example.com',
          password: 'secret',
          posts: [
            {
              id: post1.id,
              title: 'First Post',
              content: 'First content',
              authorId: user.id,
            },
            {
              id: post2.id,
              title: 'Second Post',
              content: 'Second content',
              authorId: user.id,
            },
          ],
        });
        expect(json).not.toHaveProperty('postIds');
      });

      it('should handle empty hasMany relationship', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: ['posts'], relationsMode: 'embedded' })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
        });

        const json = user.toJSON();

        // Embedding: remove foreign key even when empty
        expect(json).toEqual({
          id: user.id,
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
          posts: [], // Empty array
        });
        expect(json).not.toHaveProperty('postIds');
      });
    });

    describe('Combined with other serializer options', () => {
      it('should work with select filtering and relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ select: ['id', 'name'], with: ['posts'], relationsMode: 'embedded' })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Frank',
          email: 'frank@example.com',
          password: 'secret',
          role: 'admin',
        });
        const post = testSchema.posts.create({
          title: 'My Post',
          content: 'Content',
          authorId: user.id,
        });

        user.reload(); // Reload to get updated postIds
        const json = user.toJSON();

        // Only id and name attributes, but posts relationship is included
        expect(json).toEqual({
          id: user.id,
          name: 'Frank',
          posts: [
            {
              id: post.id,
              title: 'My Post',
              content: 'Content',
              authorId: user.id,
            },
          ],
        });
      });

      it('should work with root wrapping and embedded relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .serializer({ root: true, with: ['author'], relationsMode: 'embedded' })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Grace',
          email: 'grace@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Test',
          content: 'Content',
          authorId: user.id,
        });

        const json = post.toJSON();

        // Root wrapping with embedding: remove foreign key, embed author
        expect(json).toEqual({
          post: {
            id: post.id,
            title: 'Test',
            content: 'Content',
            author: {
              id: user.id,
              name: 'Grace',
              email: 'grace@example.com',
              password: 'secret',
            },
          },
        });
      });

      it('should work with collection-level relationsMode setting', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: ['posts'], relationsMode: 'embedded' }) // Collection-level relationsMode
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Henry',
          email: 'henry@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Embed Test',
          content: 'Content',
          authorId: user.id,
        });

        user.reload(); // Reload to get updated postIds
        const json = user.toJSON();

        // Should embed because of collection-level setting (remove foreign key)
        expect(json).toEqual({
          id: user.id,
          name: 'Henry',
          email: 'henry@example.com',
          password: 'secret',
          posts: [
            {
              id: post.id,
              title: 'Embed Test',
              content: 'Content',
              authorId: user.id,
            },
          ],
        });
        expect(json).not.toHaveProperty('postIds');
      });
    });

    describe('Collection serialization with relationships', () => {
      it('should serialize collection with embedded relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ select: ['id', 'name'], with: ['posts'], relationsMode: 'embedded' })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user1 = testSchema.users.create({
          name: 'Jack',
          email: 'jack@example.com',
          password: 'secret',
        });
        const user2 = testSchema.users.create({
          name: 'Jill',
          email: 'jill@example.com',
          password: 'secret',
        });
        const post1 = testSchema.posts.create({
          title: 'Jack Post',
          content: 'Content',
          authorId: user1.id,
        });
        const post2 = testSchema.posts.create({
          title: 'Jill Post',
          content: 'Content',
          authorId: user2.id,
        });

        const allUsers = testSchema.users.all();
        const json = allUsers.toJSON();

        expect(json).toEqual([
          {
            id: user1.id,
            name: 'Jack',
            posts: [
              {
                id: post1.id,
                title: 'Jack Post',
                content: 'Content',
                authorId: user1.id,
              },
            ],
          },
          {
            id: user2.id,
            name: 'Jill',
            posts: [
              {
                id: post2.id,
                title: 'Jill Post',
                content: 'Content',
                authorId: user2.id,
              },
            ],
          },
        ]);
      });

      it('should serialize collection with root and side-loaded relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                select: ['id', 'name'],
                with: ['posts'],
                relationsMode: 'sideLoaded',
                root: true,
              }) // collection-level config with root
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Kate',
          email: 'kate@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Kate Post',
          content: 'Content',
          authorId: user.id,
        });

        const allUsers = testSchema.users.all();
        const json = allUsers.toJSON();

        // Side-loading with root: relationships are side-loaded within each model
        // Foreign keys are preserved when relationsMode='sideLoaded'
        // Note: postIds is excluded because select only includes ['id', 'name']
        expect(json).toEqual({
          users: [
            {
              id: user.id,
              name: 'Kate',
              posts: [
                {
                  id: post.id,
                  title: 'Kate Post',
                  content: 'Content',
                  authorId: user.id,
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe('Auto-enable root for side-load mode', () => {
    it('should auto-enable root when relationsMode=sideLoaded', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ with: ['posts'], relationsMode: 'sideLoaded' }) // root auto-enabled
            .create(),
          posts: collection().model(postModel).create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret',
      });

      const json = user.toJSON();

      // Should have root wrapping enabled automatically
      expect(json).toHaveProperty('user');
      expect((json as any).user).toHaveProperty('id', user.id);
    });

    it('should NOT auto-enable root when with is specified without relationsMode (defaults to undefined)', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ with: ['posts'] }) // relationsMode defaults to undefined, root NOT auto-enabled
            .create(),
          posts: collection().model(postModel).create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret',
      });

      const json = user.toJSON();

      // Should NOT have root wrapping (only includes foreign keys)
      expect(json).not.toHaveProperty('user');
      expect(json).toHaveProperty('id', user.id);
      expect(json).toHaveProperty('postIds');
    });

    it('should warn and ignore root=false when relationsMode=sideLoaded', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ with: ['posts'], relationsMode: 'sideLoaded', root: false }) // root=false should be ignored
            .create(),
          posts: collection().model(postModel).create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret',
      });

      const json = user.toJSON();

      // Verify warning was logged (happens at serialize time when options are resolved)
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('root'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('sideLoaded'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('ignored'));

      // Should have root wrapping despite root=false setting
      expect(json).toHaveProperty('user');
      expect((json as any).user).toHaveProperty('id', user.id);

      consoleWarnSpy.mockRestore();
    });

    it('should respect custom root key with relationsMode=sideLoaded', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ with: ['posts'], relationsMode: 'sideLoaded', root: 'customUser' })
            .create(),
          posts: collection().model(postModel).create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret',
      });

      const json = user.toJSON();

      // Should use custom root key
      expect(json).toHaveProperty('customUser');
      expect((json as any).customUser).toHaveProperty('id', user.id);
    });

    it('should not auto-enable root when relationsMode=embedded', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ with: ['posts'], relationsMode: 'embedded' }) // root should NOT auto-enable
            .create(),
          posts: collection().model(postModel).create(),
        })
        .setup();

      const user = testSchema.users.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret',
      });

      const json = user.toJSON();

      // Should NOT have root wrapping
      expect(json).not.toHaveProperty('user');
      expect(json).toHaveProperty('id', user.id);
    });
  });

  describe('Refined serialization logic', () => {
    describe('Default behavior (no with)', () => {
      it('should exclude foreign keys when with is not specified', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: [] })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
        });
        const _post = testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          authorId: user.id,
        });

        const json = user.toJSON();

        // Should only include attrs, no foreign keys, no relationships
        expect(json).toEqual({
          id: user.id,
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
        });
        expect(json).not.toHaveProperty('postIds');
        expect(json).not.toHaveProperty('posts');
      });

      it('should exclude relationships when with is empty array', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: [] }) // Explicitly empty
              .create(),
            posts: collection().model(postModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
        });
        const _post = testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          authorId: user.id,
        });

        const json = user.toJSON();

        // Should only include attrs, no foreign keys, no relationships
        expect(json).toEqual({
          id: user.id,
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
        });
        expect(json).not.toHaveProperty('postIds');
        expect(json).not.toHaveProperty('posts');
      });
    });

    describe('Side-load mode (relationsMode=sideLoaded)', () => {
      it('should include both foreign keys and side-loaded relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: ['posts'], relationsMode: 'sideLoaded' }) // root auto-enabled
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
        });
        const post1 = testSchema.posts.create({
          title: 'Post 1',
          content: 'Content 1',
          authorId: user.id,
        });
        const post2 = testSchema.posts.create({
          title: 'Post 2',
          content: 'Content 2',
          authorId: user.id,
        });

        user.reload(); // Reload to get updated postIds
        const json = user.toJSON();

        // Should include attrs with foreign keys AND side-loaded relationships at top level (with root)
        expect(json).toMatchObject({
          user: {
            id: user.id,
            name: 'Charlie',
            email: 'charlie@example.com',
            password: 'secret',
            postIds: [post1.id, post2.id], // Foreign keys preserved
          },
          posts: [
            // Relationships side-loaded at top level
            {
              id: post1.id,
              title: 'Post 1',
              content: 'Content 1',
              authorId: user.id,
            },
            {
              id: post2.id,
              title: 'Post 2',
              content: 'Content 2',
              authorId: user.id,
            },
          ],
        });
      });

      it('should side-load belongsTo relationships with foreign keys', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                  collectionName: 'authors',
                }),
              })
              .serializer({ with: ['author'], relationsMode: 'sideLoaded' }) // root auto-enabled
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Diana',
          email: 'diana@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'My Post',
          content: 'Content',
          authorId: user.id,
        });

        const json = post.toJSON();

        // Should include attrs with foreign key AND side-loaded relationship as array at top level with custom collectionName (with root)
        expect(json).toEqual({
          post: {
            id: post.id,
            title: 'My Post',
            content: 'Content',
            authorId: user.id, // Foreign key preserved
          },
          authors: [
            {
              // Relationship side-loaded at top level using custom collectionName
              id: user.id,
              name: 'Diana',
              email: 'diana@example.com',
              password: 'secret',
            },
          ],
        });
      });
    });

    describe('Embed mode (relationsMode=embedded)', () => {
      it('should include embedded relationships without foreign keys', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: ['posts'], relationsMode: 'embedded' })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
        });
        const post1 = testSchema.posts.create({
          title: 'Post 1',
          content: 'Content 1',
          authorId: user.id,
        });
        const post2 = testSchema.posts.create({
          title: 'Post 2',
          content: 'Content 2',
          authorId: user.id,
        });

        user.reload(); // Reload to get updated postIds
        const json = user.toJSON();

        // Should include attrs with embedded relationships but NO foreign keys
        expect(json).toEqual({
          id: user.id,
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
          posts: [
            // Relationships embedded
            {
              id: post1.id,
              title: 'Post 1',
              content: 'Content 1',
              authorId: user.id,
            },
            {
              id: post2.id,
              title: 'Post 2',
              content: 'Content 2',
              authorId: user.id,
            },
          ],
        });
        expect(json).not.toHaveProperty('postIds'); // Foreign keys removed
      });

      it('should embed belongsTo relationships without foreign keys', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .serializer({ with: ['author'], relationsMode: 'embedded' })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Frank',
          email: 'frank@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'My Post',
          content: 'Content',
          authorId: user.id,
        });

        const json = post.toJSON();

        // Should include attrs with embedded relationship but NO foreign key
        expect(json).toEqual({
          id: post.id,
          title: 'My Post',
          content: 'Content',
          author: {
            // Relationship embedded
            id: user.id,
            name: 'Frank',
            email: 'frank@example.com',
            password: 'secret',
          },
        });
        expect(json).not.toHaveProperty('authorId'); // Foreign key removed
      });
    });

    describe('With option filtering', () => {
      it('should only include specified relationships with relationsMode=undefined (default)', () => {
        const commentModel = model()
          .name('comment')
          .collection('comments')
          .attrs<CommentAttrs>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({ with: ['author'] }) // Only include author, not comments
              .create(),
            comments: collection().model(commentModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Emily',
          email: 'emily@example.com',
          password: 'secret',
        });
        const comment = testSchema.comments.create({
          content: 'Comment',
          userId: user.id,
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          author: user,
          comments: [comment],
        });

        const json = post.toJSON();

        // Default mode (relationsMode=undefined): Only foreign keys for included relationships
        // Should include ONLY authorId (not commentIds, since comments is not in with array)
        expect(json).toEqual({
          id: post.id,
          title: 'Post',
          content: 'Content',
          authorId: user.id,
          // commentIds is NOT included because 'comments' is not in the with array
        });
        expect(json).not.toHaveProperty('commentIds'); // Foreign key excluded
        expect(json).not.toHaveProperty('author'); // No relationship data
        expect(json).not.toHaveProperty('authors'); // No relationship data
        expect(json).not.toHaveProperty('comments'); // No relationship data
      });

      it('should only side-load specified relationships with relationsMode=sideLoaded', () => {
        const commentModel = model()
          .name('comment')
          .collection('comments')
          .attrs<CommentAttrs>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                  collectionName: 'authors',
                }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({ with: ['author'], relationsMode: 'sideLoaded' }) // Only side-load author
              .create(),
            comments: collection().model(commentModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Frank',
          email: 'frank@example.com',
          password: 'secret',
        });
        const comment = testSchema.comments.create({
          content: 'Comment',
          userId: user.id,
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          author: user,
          comments: [comment],
        });

        const json = post.toJSON();

        // Should side-load ONLY author at top level, not comments
        expect(json).toMatchObject({
          post: {
            id: post.id,
            title: 'Post',
            content: 'Content',
            authorId: user.id,
            commentIds: [comment.id], // Foreign key preserved for non-included relationship
          },
          authors: [expect.objectContaining({ id: user.id })], // Side-loaded
        });
        expect(json).not.toHaveProperty('comments'); // NOT side-loaded (not in with)
      });

      it('should only embed specified relationships with relationsMode=embedded', () => {
        const commentModel = model()
          .name('comment')
          .collection('comments')
          .attrs<CommentAttrs>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({ with: ['comments'], relationsMode: 'embedded' }) // Only embed comments
              .create(),
            comments: collection().model(commentModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Grace',
          email: 'grace@example.com',
          password: 'secret',
        });
        const comment = testSchema.comments.create({
          content: 'Nice!',
          userId: user.id,
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          author: user,
          comments: [comment],
        });

        const json = post.toJSON();

        // Should embed ONLY comments, not author
        expect(json).toMatchObject({
          id: post.id,
          title: 'Post',
          content: 'Content',
          comments: [
            // Embedded (in with)
            {
              id: comment.id,
              content: 'Nice!',
              userId: user.id,
            },
          ],
        });
        expect(json).not.toHaveProperty('authorId'); // FK removed (author not in with)
        expect(json).not.toHaveProperty('commentIds'); // FK removed for embedded relationship
        expect(json).not.toHaveProperty('author'); // NOT embedded (not in with)
      });
    });

    describe('Multiple relationships with mixed modes', () => {
      it('should handle multiple includes correctly in side-load mode', () => {
        interface CommentAttrs {
          id: string;
          content: string;
          postId: string;
          userId: string;
        }

        const commentModel = model()
          .name('comment')
          .collection('comments')
          .attrs<CommentAttrs>()
          .create();

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
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                  collectionName: 'authors',
                }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({ with: ['author', 'comments'], relationsMode: 'sideLoaded' }) // root auto-enabled
              .create(),
            comments: collection().model(commentModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Grace',
          email: 'grace@example.com',
          password: 'secret',
        });
        const comment = testSchema.comments.create({
          content: 'Nice post!',
          userId: user.id,
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          author: user,
          comments: [comment],
        });

        const json = post.toJSON();

        // Should include all foreign keys and all side-loaded relationships at top level (with root)
        expect(json).toMatchObject({
          post: {
            id: post.id,
            title: 'Post',
            content: 'Content',
            authorId: user.id, // FK preserved
          },
          authors: [expect.objectContaining({ id: user.id })], // Side-loaded at top level with custom collectionName
          comments: [expect.objectContaining({ id: comment.id })], // Side-loaded at top level with default collectionName
        });
        expect((json as any).post).toHaveProperty('commentIds'); // FK array preserved
      });
    });
  });

  describe('Serialization through relationship accessors', () => {
    describe('belongsTo relationships', () => {
      it('should serialize related model using its collection serializer', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name', 'email'] }) // User serializer filters attributes
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
          role: 'admin',
        });
        const post = testSchema.posts.create({
          title: 'My Post',
          content: 'Content',
          author: user,
        });

        // Serialize the author through the post relationship accessor
        const json = post.author?.toJSON();

        // Should use the user collection's serializer (filtered attributes)
        expect(json).toEqual({
          id: user.id,
          name: 'Alice',
          email: 'alice@example.com',
        });
        expect(json).not.toHaveProperty('password');
        expect(json).not.toHaveProperty('role');
      });

      it('should serialize related model with root wrapping', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name'], root: true }) // User serializer with root
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          author: user,
        });

        const json = post.author?.toJSON();

        // Should use the user collection's serializer with root wrapping
        expect(json).toEqual({
          user: {
            id: user.id,
            name: 'Bob',
          },
        });
      });

      it('should return null when belongsTo relationship is null', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name'] })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const post = testSchema.posts.create({
          title: 'Orphan Post',
          content: 'No author',
        });

        expect(post.author).toBeNull();
      });
    });

    describe('hasMany relationships', () => {
      it('should serialize related collection using its collection serializer', () => {
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
              .serializer({ select: ['id', 'title'] }) // Post serializer filters attributes
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
        });
        const post1 = testSchema.posts.create({
          title: 'First Post',
          content: 'Content 1',
          author: user,
        });
        const post2 = testSchema.posts.create({
          title: 'Second Post',
          content: 'Content 2',
          author: user,
        });

        user.reload(); // Reload to get updated postIds

        // Serialize the posts through the user relationship accessor
        const json = user.posts.toJSON();

        // Should use the post collection's serializer (filtered attributes)
        expect(json).toEqual([
          { id: post1.id, title: 'First Post' },
          { id: post2.id, title: 'Second Post' },
        ]);
        expect(json[0]).not.toHaveProperty('content');
        expect(json[0]).not.toHaveProperty('authorId');
      });

      it('should serialize related collection with root wrapping', () => {
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
              .serializer({ select: ['id', 'title'], root: true }) // Post serializer with root
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Diana',
          email: 'diana@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'My Post',
          content: 'Content',
          author: user,
        });

        user.reload(); // Reload to get updated postIds

        const json = user.posts.toJSON();

        // Should use the post collection's serializer with root wrapping
        expect(json).toEqual({
          posts: [{ id: post.id, title: 'My Post' }],
        });
      });

      it('should serialize empty hasMany collection', () => {
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
              .serializer({ select: ['id', 'title'], root: true })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
        });

        const json = user.posts.toJSON();

        // Should return empty array with root wrapping
        expect(json).toEqual({ posts: [] });
      });

      it('should serialize related collection with relationships', () => {
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
              .serializer({ with: ['author'], relationsMode: 'embedded' }) // Post serializer embeds author
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Frank',
          email: 'frank@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'My Post',
          content: 'Content',
          author: user,
        });

        user.reload(); // Reload to get updated postIds

        const json = user.posts.toJSON();

        // Should use the post collection's serializer with embedded relationships
        expect(json).toEqual([
          {
            id: post.id,
            title: 'My Post',
            content: 'Content',
            author: {
              id: user.id,
              name: 'Frank',
              email: 'frank@example.com',
              password: 'secret',
              postIds: [post.id], // User has hasMany posts relationship
            },
          },
        ]);
      });
    });

    describe('Nested relationship accessors', () => {
      it('should allow chaining relationship accessors', () => {
        const commentModel = model()
          .name('comment')
          .collection('comments')
          .attrs<CommentAttrs>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ select: ['id', 'name'] })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({ select: ['id', 'title'] })
              .create(),
            comments: collection()
              .model(commentModel)
              .relationships({
                user: associations.belongsTo(userModel, { foreignKey: 'userId' }),
              })
              .serializer({ select: ['id', 'content'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Grace',
          email: 'grace@example.com',
          password: 'secret',
        });
        const comment = testSchema.comments.create({
          content: 'Nice post!',
          userId: user.id,
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          author: user,
          comments: [comment],
        });

        user.reload();

        // Access user -> posts -> first post -> author
        const authorJson = user.posts.models[0].author?.toJSON();
        expect(authorJson).toEqual({
          id: user.id,
          name: 'Grace',
        });

        // Access post -> comments collection
        const commentsJson = post.comments.toJSON();
        expect(commentsJson).toEqual([
          {
            id: comment.id,
            content: 'Nice post!',
          },
        ]);
      });
    });
  });

  describe('Model-level serialize() method', () => {
    describe('Basic usage', () => {
      it('should serialize using class-level options when no method options provided', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name', 'email'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret123',
          role: 'admin',
        });

        // serialize() without options should use class-level settings
        const json = user.serialize();

        expect(json).toEqual({
          id: '1',
          name: 'Alice',
          email: 'alice@example.com',
        });
        expect(json).not.toHaveProperty('password');
        expect(json).not.toHaveProperty('role');
      });

      it('should behave the same as toJSON() when no options provided', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name', 'email'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
          role: 'user',
        });

        // serialize() and toJSON() should produce identical results
        expect(user.serialize()).toEqual(user.toJSON());
      });
    });

    describe('Method-level option overrides', () => {
      it('should override select at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name', 'email'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
          role: 'admin',
        });

        // Override select to only include id and name
        const json = user.serialize({ select: ['id', 'name'] });

        expect(json).toEqual({
          id: '1',
          name: 'Charlie',
        });
        expect(json).not.toHaveProperty('email');
        expect(json).not.toHaveProperty('password');
        expect(json).not.toHaveProperty('role');
      });

      it('should override root at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name', 'email'], root: false })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Diana',
          email: 'diana@example.com',
          password: 'secret',
          role: 'user',
        });

        // Override to enable root wrapping at method level
        const json = user.serialize({ root: true });

        expect(json).toEqual({
          user: {
            id: '1',
            name: 'Diana',
            email: 'diana@example.com',
          },
        });
      });

      it('should override custom root key at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name'], root: 'user' })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
          role: 'admin',
        });

        // Override root key at method level
        const json = user.serialize({ root: 'person' });

        expect(json).toEqual({
          person: {
            id: '1',
            name: 'Eve',
          },
        });
      });

      it('should override relationsMode at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .serializer({ with: ['author'], relationsMode: 'sideLoaded' }) // Class-level: side-load
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Frank',
          email: 'frank@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Test Post',
          content: 'Content',
          author: user,
        });

        // Override to embed at method level
        const json = post.serialize({ relationsMode: 'embedded' });

        // Should embed relationship, remove foreign key
        expect(json).toHaveProperty('author');
        expect((json as any).author).toEqual({
          id: user.id,
          name: 'Frank',
          email: 'frank@example.com',
          password: 'secret',
        });
        expect(json).not.toHaveProperty('authorId');
        expect(json).not.toHaveProperty('users'); // No side-loading
      });

      it('should merge multiple option overrides at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).serializer({ root: false }).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Grace',
          email: 'grace@example.com',
          password: 'secret',
          role: 'admin',
        });

        // Override both select and root at method level
        const json = user.serialize({
          select: ['id', 'name'],
          root: 'person',
        });

        expect(json).toEqual({
          person: {
            id: '1',
            name: 'Grace',
          },
        });
      });
    });

    describe('Fallback behavior', () => {
      it('should return raw attributes when no serializer is configured', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Henry',
          email: 'henry@example.com',
          password: 'secret',
          role: 'user',
        });

        // serialize() without serializer should return raw attributes
        const json = user.serialize();

        expect(json).toEqual({
          id: '1',
          name: 'Henry',
          email: 'henry@example.com',
          password: 'secret',
          role: 'user',
        });
      });

      it('should ignore options when no serializer is configured', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Ivy',
          email: 'ivy@example.com',
          password: 'secret',
          role: 'admin',
        });

        // Options are ignored without a serializer
        const json = user.serialize({ select: ['id', 'name'], root: true });

        // Should still return raw attributes (options ignored)
        expect(json).toEqual({
          id: '1',
          name: 'Ivy',
          email: 'ivy@example.com',
          password: 'secret',
          role: 'admin',
        });
      });
    });
  });

  describe('Collection-level serialize() method', () => {
    describe('Basic usage', () => {
      it('should serialize using class-level options when no method options provided', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name', 'email'] })
              .create(),
          })
          .setup();

        testSchema.users.create({ name: 'Alice', email: 'alice@example.com', password: 'secret' });
        testSchema.users.create({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

        const users = testSchema.users.all();
        const json = users.serialize();

        expect(json).toEqual([
          { id: '1', name: 'Alice', email: 'alice@example.com' },
          { id: '2', name: 'Bob', email: 'bob@example.com' },
        ]);
      });

      it('should behave the same as toJSON() when no options provided', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name'] })
              .create(),
          })
          .setup();

        testSchema.users.create({ name: 'Alice', email: 'alice@example.com', password: 'secret' });
        testSchema.users.create({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

        const users = testSchema.users.all();

        expect(users.serialize()).toEqual(users.toJSON());
      });
    });

    describe('Method-level option overrides', () => {
      it('should override select at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name', 'email'] })
              .create(),
          })
          .setup();

        testSchema.users.create({ name: 'Alice', email: 'alice@example.com', password: 'secret' });
        testSchema.users.create({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

        const users = testSchema.users.all();
        const json = users.serialize({ select: ['id', 'name'] });

        expect(json).toEqual([
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ]);
      });

      it('should override root at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name'], root: false })
              .create(),
          })
          .setup();

        testSchema.users.create({ name: 'Alice', email: 'alice@example.com', password: 'secret' });
        testSchema.users.create({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

        const users = testSchema.users.all();
        const json = users.serialize({ root: true });

        expect(json).toEqual({
          users: [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
          ],
        });
      });

      it('should override custom root key at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name'], root: 'users' })
              .create(),
          })
          .setup();

        testSchema.users.create({ name: 'Alice', email: 'alice@example.com', password: 'secret' });

        const users = testSchema.users.all();
        const json = users.serialize({ root: 'people' });

        expect(json).toEqual({
          people: [{ id: '1', name: 'Alice' }],
        });
      });

      it('should merge multiple option overrides at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).serializer({ root: false }).create(),
          })
          .setup();

        testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
          role: 'admin',
        });

        const users = testSchema.users.all();
        const json = users.serialize({ select: ['id', 'name'], root: 'people' });

        expect(json).toEqual({
          people: [{ id: '1', name: 'Alice' }],
        });
      });
    });

    describe('Fallback behavior', () => {
      it('should return raw attributes when no serializer is configured', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
          })
          .setup();

        testSchema.users.create({ name: 'Alice', email: 'alice@example.com', password: 'secret' });
        testSchema.users.create({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

        const users = testSchema.users.all();
        const json = users.serialize();

        expect(json).toEqual([
          { id: '1', name: 'Alice', email: 'alice@example.com', password: 'secret' },
          { id: '2', name: 'Bob', email: 'bob@example.com', password: 'secret' },
        ]);
      });

      it('should ignore options when no serializer is configured', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
          })
          .setup();

        testSchema.users.create({ name: 'Alice', email: 'alice@example.com', password: 'secret' });

        const users = testSchema.users.all();
        const json = users.serialize({ select: ['id', 'name'], root: true });

        // Should still return raw attributes (options ignored)
        expect(json).toEqual([
          { id: '1', name: 'Alice', email: 'alice@example.com', password: 'secret' },
        ]);
      });

      it('should serialize empty collection', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name'], root: true })
              .create(),
          })
          .setup();

        const users = testSchema.users.all();
        const json = users.serialize();

        expect(json).toEqual({ users: [] });
      });
    });
  });

  describe('With option object format', () => {
    describe('Boolean values', () => {
      it('should include relationships with true values', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: { posts: true }, relationsMode: 'embedded' })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          authorId: user.id,
        });

        user.reload();
        const json = user.toJSON();

        expect(json).toHaveProperty('posts');
        expect((json as any).posts).toHaveLength(1);
        expect((json as any).posts[0]).toHaveProperty('id', post.id);
      });

      it('should exclude relationships with false values', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: { posts: false } })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
        });
        testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          authorId: user.id,
        });

        user.reload();
        const json = user.toJSON();

        expect(json).not.toHaveProperty('posts');
        expect(json).not.toHaveProperty('postIds');
      });
    });

    describe('Nested options', () => {
      it('should apply select option to nested relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: { posts: { select: ['id', 'title'] } },
                relationsMode: 'embedded',
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

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
        });
        testSchema.posts.create({
          title: 'Post 1',
          content: 'Secret content',
          authorId: user.id,
        });

        user.reload();
        const json = user.toJSON();

        expect(json).toHaveProperty('posts');
        expect((json as any).posts[0]).toEqual({ id: '2', title: 'Post 1' });
        expect((json as any).posts[0]).not.toHaveProperty('content');
        expect((json as any).posts[0]).not.toHaveProperty('authorId');
      });

      it('should apply select object format to nested relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: { posts: { select: { authorId: false } } },
                relationsMode: 'embedded',
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

        const user = testSchema.users.create({
          name: 'Diana',
          email: 'diana@example.com',
          password: 'secret',
        });
        testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          authorId: user.id,
        });

        user.reload();
        const json = user.toJSON();

        expect(json).toHaveProperty('posts');
        expect((json as any).posts[0]).toHaveProperty('id');
        expect((json as any).posts[0]).toHaveProperty('title');
        expect((json as any).posts[0]).toHaveProperty('content');
        expect((json as any).posts[0]).not.toHaveProperty('authorId');
      });

      it('should apply mode override to specific relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: { posts: { mode: 'sideLoaded' } },
                relationsMode: 'embedded', // default is embedded, but posts overrides to sideLoaded
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

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
        });
        testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          authorId: user.id,
        });

        user.reload();
        const json = user.toJSON();

        // posts should be side-loaded, not embedded
        expect(json).toHaveProperty('posts'); // side-loaded uses collectionName
        expect(json).not.toHaveProperty('postIds'); // side-load keeps FK for embedded mode default, but this relationship is sideLoaded
      });

      it('should support nested with option (boolean only)', () => {
        const commentModel = model()
          .name('comment')
          .collection('comments')
          .attrs<CommentAttrs>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: {
                  posts: {
                    select: ['id', 'title'],
                    with: { author: true }, // nested with only supports boolean
                  },
                },
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
                comments: associations.hasMany(commentModel),
              })
              .create(),
            comments: collection().model(commentModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Frank',
          email: 'frank@example.com',
          password: 'secret',
        });
        testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          author: user,
        });

        user.reload();
        const json = user.toJSON();

        expect(json).toHaveProperty('posts');
        const posts = (json as any).posts;
        expect(posts[0]).toHaveProperty('id');
        expect(posts[0]).toHaveProperty('title');
        expect(posts[0]).toHaveProperty('author'); // nested relationship included
        expect(posts[0].author).toHaveProperty('name', 'Frank');
      });
    });
  });
});
