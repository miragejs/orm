import { associations } from '@src/associations';
import { model } from '@src/model';
import { collection, schema } from '@src/schema';
import { Serializer } from '@src/serializer';

// Define test models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<{
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
  }>()
  .create();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<{
    id: string;
    title: string;
    content: string;
    authorId: string;
  }>()
  .create();

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

  describe('serializer with relationships', () => {
    it('should serialize models with relationships (foreign keys included by default)', () => {
      const serializer = new Serializer<PostModel, PostJSON>(postModel, {
        attrs: ['id', 'title'],
      });

      const postCollection = collection()
        .model(postModel)
        .relationships({
          author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
        })
        .serializer(serializer)
        .create();
      const userCollection = collection()
        .model(userModel)
        .relationships({
          posts: associations.hasMany(postModel, { foreignKey: 'authorId' }),
        })
        .create();
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
      const json = post.toJSON();

      // Should only include specified attributes (id, title)
      expect(json).toEqual({
        id: '2',
        title: 'My Post',
      });
      expect(json).not.toHaveProperty('content');
      expect(json).not.toHaveProperty('authorId');
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
});
