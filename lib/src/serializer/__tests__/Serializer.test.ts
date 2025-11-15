import { associations } from '@src/associations';
import { model } from '@src/model';
import { collection, schema } from '@src/schema';

import Serializer from '../Serializer';

// Define test attributes
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

// Create test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

// Create test model types
type UserModel = typeof userModel;
type PostModel = typeof postModel;

// Define JSON types
interface UserJSON {
  id: string;
  name: string;
  email: string;
}

interface UserRootJSON {
  user: UserJSON;
}

interface PostJSON {
  id: string;
  title: string;
}

interface PostsJSON {
  posts: PostJSON[];
}

describe('Serializer', () => {
  describe('Constructor', () => {
    it('should serialize a model with default settings (no filtering)', () => {
      const serializer = new Serializer<UserModel>(userModel);

      const userCollection = collection().model(userModel).serializer(serializer).create();
      const testSchema = schema().collections({ users: userCollection }).setup();

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

    it('should serialize a model with attribute filtering', () => {
      const serializer = new Serializer<UserModel, UserJSON>(userModel, {
        attrs: ['id', 'name', 'email'],
      });

      const userCollection = collection().model(userModel).serializer(serializer).create();
      const testSchema = schema().collections({ users: userCollection }).setup();

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
      const serializer = new Serializer<UserModel, UserRootJSON>(userModel, {
        attrs: ['id', 'name', 'email'],
        root: true,
      });

      const userCollection = collection().model(userModel).serializer(serializer).create();
      const testSchema = schema().collections({ users: userCollection }).setup();

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
      const serializer = new Serializer<UserModel, { person: UserJSON }>(userModel, {
        attrs: ['id', 'name', 'email'],
        root: 'person',
      });

      const userCollection = collection().model(userModel).serializer(serializer).create();
      const testSchema = schema().collections({ users: userCollection }).setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json: { person: UserJSON } = user.toJSON();

      expect(json).toEqual({
        person: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
    });
  });

  describe('Collection serialization', () => {
    it('should serialize a collection without root wrapping', () => {
      const serializer = new Serializer<PostModel, PostJSON, PostJSON[]>(postModel, {
        attrs: ['id', 'title'],
      });

      const postCollection = collection().model(postModel).serializer(serializer).create();
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
      const json: PostJSON[] = posts.toJSON();

      expect(json).toEqual([
        { id: '1', title: 'First Post' },
        { id: '2', title: 'Second Post' },
      ]);
    });

    it('should serialize a collection with root wrapping', () => {
      const serializer = new Serializer<PostModel, PostJSON, PostsJSON>(postModel, {
        attrs: ['id', 'title'],
        root: true,
      });

      const postCollection = collection().model(postModel).serializer(serializer).create();
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
      const json: PostsJSON = posts.toJSON();

      expect(json).toEqual({
        posts: [
          { id: '1', title: 'First Post' },
          { id: '2', title: 'Second Post' },
        ],
      });
    });

    it('should serialize an empty collection', () => {
      const serializer = new Serializer<PostModel, PostJSON, PostsJSON>(postModel, {
        attrs: ['id', 'title'],
        root: true,
      });

      const postCollection = collection().model(postModel).serializer(serializer).create();
      const testSchema = schema().collections({ posts: postCollection }).setup();

      const posts = testSchema.posts.all();
      const json: PostsJSON = posts.toJSON();

      expect(json).toEqual({ posts: [] });
    });
  });

  describe('Fallback behavior', () => {
    it('should return raw attributes when no serializer is configured', () => {
      const userCollection = collection().model(userModel).create();
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
      const postCollection = collection().model(postModel).create();
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
      class TimestampSerializer<T extends UserModel> extends Serializer<
        T,
        UserJSON & { timestamp: string }
      > {
        serialize(model: any): UserJSON & { timestamp: string } {
          const data = super.serialize(model);
          return {
            ...data,
            timestamp: new Date('2024-01-01').toISOString(),
          } as UserJSON & { timestamp: string };
        }
      }

      const serializer = new TimestampSerializer(userModel, {
        attrs: ['id', 'name', 'email'],
      });

      const userCollection = collection().model(userModel).serializer(serializer).create();
      const testSchema = schema().collections({ users: userCollection }).setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json: UserJSON & { timestamp: string } = user.toJSON();

      expect(json).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  describe('Multiple collections with different serializers', () => {
    it('should support different serializers for different collections', () => {
      const userSerializer = new Serializer<UserModel, { user: UserJSON }>(userModel, {
        attrs: ['id', 'name', 'email'],
        root: 'user',
      });
      const postSerializer = new Serializer<PostModel, PostJSON>(postModel, {
        attrs: ['id', 'title'],
      });

      const userCollection = collection().model(userModel).serializer(userSerializer).create();
      const postCollection = collection().model(postModel).serializer(postSerializer).create();

      const testSchema = schema()
        .collections({
          users: userCollection,
          posts: postCollection,
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

      const userJson: { user: UserJSON } = user.toJSON();
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
      it('should side-load belongsTo with embed:false (default)', () => {
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
              .serializer({ include: ['author'] }) // embed defaults to false, root auto-enabled
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
          authorId: user.id,
        });

        post.link('author', user);
        const json = post.toJSON();

        // Side-loading: auto-enables root, keeps foreign key, adds relationship as array with custom collectionName
        expect(json).toEqual({
          post: {
            id: post.id,
            title: 'Hello World',
            content: 'My first post',
            authorId: user.id,
            authors: [
              {
                id: user.id,
                name: 'Alice',
                email: 'alice@example.com',
                password: 'secret',
              },
            ],
          },
        });
      });

      it('should embed belongsTo with embed:true', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .serializer({ include: ['author'], embed: true })
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
          authorId: user.id,
        });

        post.link('author', user);
        const json = post.toJSON();

        // Embedding: remove foreign key, replace with full author model
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
              .serializer({ include: ['author'], embed: true })
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
      it('should side-load hasMany with embed:false (default)', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel), // Uses default: postIds
              })
              .serializer({ include: ['posts'] }) // embed defaults to false, root auto-enabled
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

        user.link('posts', [post1, post2]);
        const json = user.toJSON();

        // Side-loading: auto-enables root, keeps foreign key, adds full posts array
        expect(json).toEqual({
          user: {
            id: user.id,
            name: 'Charlie',
            email: 'charlie@example.com',
            password: 'secret',
            postIds: [post1.id, post2.id],
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
          },
        });
      });

      it('should embed hasMany with embed:true', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ include: ['posts'], embed: true })
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

        user.link('posts', [post1, post2]);
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
              .serializer({ include: ['posts'], embed: true })
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
      it('should work with attrs filtering and relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ attrs: ['id', 'name'], include: ['posts'], embed: true })
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

        user.link('posts', [post]);
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
              .serializer({ root: true, include: ['author'], embed: true })
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

        post.link('author', user);
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

      it('should work with global embed setting', () => {
        const testSchema = schema()
          .serializer({ embed: true }) // Global embed
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ include: ['posts'] }) // Uses global embed
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
          title: 'Global Embed Test',
          content: 'Content',
          authorId: user.id,
        });

        user.link('posts', [post]);
        const json = user.toJSON();

        // Should embed because of global setting (remove foreign key)
        expect(json).toEqual({
          id: user.id,
          name: 'Henry',
          email: 'henry@example.com',
          password: 'secret',
          posts: [
            {
              id: post.id,
              title: 'Global Embed Test',
              content: 'Content',
              authorId: user.id,
            },
          ],
        });
        expect(json).not.toHaveProperty('postIds');
      });

      it('should override global embed with collection-level setting', () => {
        const testSchema = schema()
          .serializer({ embed: true }) // Global embed
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ include: ['posts'], embed: false }) // Override to side-load (root auto-enabled)
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
          name: 'Ivy',
          email: 'ivy@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Override Test',
          content: 'Content',
          authorId: user.id,
        });

        user.link('posts', [post]);
        const json = user.toJSON();

        // Should side-load with root because collection-level overrides global and embed=false auto-enables root
        expect(json).toEqual({
          user: {
            id: user.id,
            name: 'Ivy',
            email: 'ivy@example.com',
            password: 'secret',
            postIds: [post.id],
            posts: [
              {
                id: post.id,
                title: 'Override Test',
                content: 'Content',
                authorId: user.id,
              },
            ],
          },
        });
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
              .serializer({ attrs: ['id', 'name'], include: ['posts'], embed: true })
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

        user1.link('posts', [post1]);
        user2.link('posts', [post2]);

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
          .serializer({ root: true })
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ attrs: ['id', 'name'], include: ['posts'] }) // embed defaults to false
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

        user.link('posts', [post]);

        const allUsers = testSchema.users.all();
        const json = allUsers.toJSON();

        // Side-loading with root: relationships are included within each model
        // Foreign keys are preserved when embed=false
        // Note: postIds is excluded because attrs only includes ['id', 'name']
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
    it('should auto-enable root when embed=false is explicitly set', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ include: ['posts'], embed: false }) // root auto-enabled
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

    it('should auto-enable root when include is specified without embed (defaults to false)', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ include: ['posts'] }) // embed defaults to false, root auto-enabled
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

    it('should warn and ignore root=false when embed=false', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ include: ['posts'], embed: false, root: false }) // root=false should be ignored
            .create(),
          posts: collection().model(postModel).create(),
        })
        .setup();

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('root'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('embed'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('ignored'));

      const user = testSchema.users.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret',
      });

      const json = user.toJSON();

      // Should have root wrapping despite root=false setting
      expect(json).toHaveProperty('user');
      expect((json as any).user).toHaveProperty('id', user.id);

      consoleWarnSpy.mockRestore();
    });

    it('should respect custom root key with embed=false', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ include: ['posts'], embed: false, root: 'customUser' })
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

    it('should not auto-enable root when embed=true', () => {
      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .relationships({
              posts: associations.hasMany(postModel),
            })
            .serializer({ include: ['posts'], embed: true }) // root should NOT auto-enable
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
    describe('Default behavior (no include)', () => {
      it('should exclude foreign keys when include is not specified', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({}) // No include specified - defaults to []
              .create(),
            posts: collection().model(postModel).create(),
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

        user.link('posts', [post]);
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

      it('should exclude relationships when include is empty array', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ include: [] }) // Explicitly empty
              .create(),
            posts: collection().model(postModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          authorId: user.id,
        });

        user.link('posts', [post]);
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

    describe('Side-load mode (embed=false)', () => {
      it('should include both foreign keys and side-loaded relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ include: ['posts'], embed: false }) // root auto-enabled
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

        user.link('posts', [post1, post2]);
        const json = user.toJSON();

        // Should include attrs with foreign keys AND side-loaded relationships (with root)
        expect(json).toMatchObject({
          user: {
            id: user.id,
            name: 'Charlie',
            email: 'charlie@example.com',
            password: 'secret',
            postIds: [post1.id, post2.id], // Foreign keys preserved
            posts: [
              // Relationships side-loaded
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
          },
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
              .serializer({ include: ['author'], embed: false }) // root auto-enabled
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

        post.link('author', user);
        const json = post.toJSON();

        // Should include attrs with foreign key AND side-loaded relationship as array with custom collectionName (with root)
        expect(json).toEqual({
          post: {
            id: post.id,
            title: 'My Post',
            content: 'Content',
            authorId: user.id, // Foreign key preserved
            authors: [
              {
                // Relationship side-loaded as array using custom collectionName
                id: user.id,
                name: 'Diana',
                email: 'diana@example.com',
                password: 'secret',
              },
            ],
          },
        });
      });
    });

    describe('Embed mode (embed=true)', () => {
      it('should include embedded relationships without foreign keys', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ include: ['posts'], embed: true })
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

        user.link('posts', [post1, post2]);
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
              .serializer({ include: ['author'], embed: true })
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

        post.link('author', user);
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
              .serializer({ include: ['author', 'comments'], embed: false }) // root auto-enabled
              .create(),
            comments: collection().model(commentModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Grace',
          email: 'grace@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          authorId: user.id,
        });
        const comment = testSchema.comments.create({
          content: 'Nice post!',
          postId: post.id,
          userId: user.id,
        });

        post.link('author', user);
        post.link('comments', [comment]);

        const json = post.toJSON();

        // Should include all foreign keys and all side-loaded relationships as arrays (with root)
        expect(json).toMatchObject({
          post: {
            id: post.id,
            title: 'Post',
            content: 'Content',
            authorId: user.id, // FK preserved
            authors: [expect.objectContaining({ id: user.id })], // Side-loaded as array with custom collectionName
            comments: [expect.objectContaining({ id: comment.id })], // Side-loaded as array with default collectionName
          },
        });
        expect((json as any).post).toHaveProperty('commentIds'); // FK array preserved
      });
    });
  });
});
