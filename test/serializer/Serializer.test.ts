import { associations } from '@src/associations';
import { model } from '@src/model';
import { collection, schema } from '@src/schema';
import { Serializer } from '@src/serializer';

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

// Define test models
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();
const postModel = model().name('post').collection('posts').attrs<PostAttrs>().create();

// Define model types
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
  describe('basic serialization', () => {
    it('should serialize a model with default settings (no filtering)', () => {
      const serializer = new Serializer<UserModel>(userModel);

      const userCollection = collection().model(userModel).serializer(serializer).create();
      const testSchema = schema().collections({ users: userCollection }).build();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        password: 'secret123',
      });
      const json = user.toJSON();

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
      const testSchema = schema().collections({ users: userCollection }).build();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json = user.toJSON();

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
      const testSchema = schema().collections({ users: userCollection }).build();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json = user.toJSON();

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
      const testSchema = schema().collections({ users: userCollection }).build();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json = user.toJSON();

      expect(json).toEqual({
        person: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
    });
  });

  describe('collection serialization', () => {
    it('should serialize a collection without root wrapping', () => {
      const serializer = new Serializer<PostModel, PostJSON, PostJSON[]>(postModel, {
        attrs: ['id', 'title'],
      });

      const postCollection = collection().model(postModel).serializer(serializer).create();
      const testSchema = schema().collections({ posts: postCollection }).build();

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
      const json = posts.toJSON();

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
      const testSchema = schema().collections({ posts: postCollection }).build();

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
      const json = posts.toJSON();

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
      const testSchema = schema().collections({ posts: postCollection }).build();

      const posts = testSchema.posts.all();
      const json = posts.toJSON();

      expect(json).toEqual({ posts: [] });
    });
  });

  describe('fallback behavior', () => {
    it('should return raw attributes when no serializer is configured', () => {
      const userCollection = collection().model(userModel).create();
      const testSchema = schema().collections({ users: userCollection }).build();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json = user.toJSON();

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
      const testSchema = schema().collections({ posts: postCollection }).build();

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
      const json = posts.toJSON();

      expect(json).toEqual([
        { id: '1', title: 'First Post', content: 'Content 1', authorId: '1' },
        { id: '2', title: 'Second Post', content: 'Content 2', authorId: '1' },
      ]);
    });
  });

  describe('serializer getters', () => {
    it('should expose modelName getter', () => {
      const serializer = new Serializer(userModel);
      expect(serializer.modelName).toBe('user');
    });

    it('should expose collectionName getter', () => {
      const serializer = new Serializer(userModel);
      expect(serializer.collectionName).toBe('users');
    });
  });

  describe('custom serializer extension', () => {
    it('should allow extending Serializer for custom logic', () => {
      class TimestampSerializer<T extends UserModel> extends Serializer<
        T,
        UserJSON & { timestamp: string }
      > {
        protected _getAttributes(model: any): Record<string, any> {
          const attrs = super._getAttributes(model);
          return {
            ...attrs,
            timestamp: new Date('2024-01-01').toISOString(),
          };
        }
      }

      const serializer = new TimestampSerializer(userModel, {
        attrs: ['id', 'name', 'email'],
      });

      const userCollection = collection().model(userModel).serializer(serializer).create();
      const testSchema = schema().collections({ users: userCollection }).build();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
      });
      const json = user.toJSON();

      expect(json).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  describe('multiple collections with different serializers', () => {
    it('should support different serializers for different collections', () => {
      const userSerializer = new Serializer<UserModel, UserJSON>(userModel, {
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
        .build();

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

      const userJson = user.toJSON();
      const postJson = post.toJSON();

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

  describe('relationships serialization', () => {
    describe('belongsTo relationships', () => {
      it('should side-load belongsTo with embed:false (default)', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .serializer({ include: ['author'] }) // embed defaults to false
              .create(),
          })
          .build();

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

        // Side-loading: keep foreign key, add full author model
        expect(json).toEqual({
          id: post.id,
          title: 'Hello World',
          content: 'My first post',
          authorId: user.id,
          author: {
            id: user.id,
            name: 'Alice',
            email: 'alice@example.com',
            password: 'secret',
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
          .build();

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
          .build();

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
              .serializer({ include: ['posts'] }) // embed defaults to false
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .build();

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

        // Side-loading: keep foreign key, add full posts array
        expect(json).toEqual({
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
          .build();

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
          .build();

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

    describe('combined with other serializer options', () => {
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
          .build();

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
          .build();

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
          .build();

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
              .serializer({ include: ['posts'], embed: false }) // Override to IDs only
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
              })
              .create(),
          })
          .build();

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

        // Should side-load because collection-level overrides global
        expect(json).toEqual({
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
        });
      });
    });

    describe('collection serialization with relationships', () => {
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
          .build();

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

      it('should serialize collection with root and relationships', () => {
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
          .build();

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

        // Side-loading with root: posts are side-loaded at root level
        // Note: postIds is excluded because attrs only includes ['id', 'name']
        expect(json).toEqual({
          users: [
            {
              id: user.id,
              name: 'Kate',
            },
          ],
          posts: [
            {
              id: post.id,
              title: 'Kate Post',
              content: 'Content',
              authorId: user.id,
            },
          ],
        });
      });
    });
  });
});
