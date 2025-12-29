import { associations } from '@src/associations';
import { model } from '@src/model';
import { collection, schema } from '@src/schema';

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

// Define JSON types for serialized output
type PostJSON = {
  id: string;
  title: string;
};

type PostsJSON = {
  posts: PostJSON[];
};

// Create base model templates with default JSON types
const userModel = model().name('user').collection('users').attrs<UserAttrs>().create();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<PostAttrs>()
  .json<PostJSON, PostJSON[]>()
  .create();

describe('Serializer - Collection serialization', () => {
  describe('Basic collection serialization', () => {
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

        expect(json).toEqual([
          {
            id: '1',
            name: 'Alice',
            email: 'alice@example.com',
            password: 'secret',
          },
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
});
