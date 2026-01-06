import { Factory } from '@src/factory';
import { model, ModelInstance } from '@src/model';
import {
  collection,
  CollectionConfig,
  schema,
  SchemaCollections,
} from '@src/schema';

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

// Define JSON types for serialized output
type UserJSON = {
  id: string;
  name: string;
  email: string;
};

type PostJSON = {
  id: string;
  title: string;
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
      const userCollection = collection()
        .model(customUserModel)
        .serializer(serializer)
        .create();
      const testSchema = schema()
        .collections({ users: userCollection })
        .setup();

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

      expect(userJson).toEqual({
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

      expect(postJson).toEqual({
        id: '2',
        title: 'My Post',
      });
    });
  });

  describe('Fallback behavior', () => {
    it('should return raw attributes when no serializer is configured', () => {
      const rawUserModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .create();
      const userCollection = collection().model(rawUserModel).create();
      const testSchema = schema()
        .collections({ users: userCollection })
        .setup();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'admin',
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

    it('should return array of raw attributes for collection when no serializer', () => {
      const rawPostModel = model()
        .name('post')
        .collection('posts')
        .attrs<PostAttrs>()
        .create();
      const postCollection = collection().model(rawPostModel).create();
      const testSchema = schema()
        .collections({ posts: postCollection })
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
      const json: PostAttrs[] = posts.toJSON();

      expect(json).toEqual([
        { id: '1', title: 'First Post', content: 'Content 1', authorId: '1' },
        { id: '2', title: 'Second Post', content: 'Content 2', authorId: '1' },
      ]);
    });
  });

  describe('Layered serialization methods', () => {
    describe('serializeAttrs (Layer 1)', () => {
      it('should return selected attributes plus all foreign keys', () => {
        type UserAttrsJSON = { id: string; name: string; postIds: string[] };

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserAttrsJSON>()
          .create();

        type TestUserModel = typeof testUserModel;

        type TestSchema = {
          users: CollectionConfig<
            TestUserModel,
            {},
            Factory<TestUserModel>,
            TestSchema,
            Serializer<TestUserModel, TestSchema>
          >;
        };

        const serializer = new Serializer<TestUserModel, TestSchema>(
          testUserModel,
          {
            select: ['id', 'name'],
          },
        );
        const userCollection = collection<TestSchema>()
          .model(testUserModel)
          .serializer(serializer)
          .create();
        const testSchema = schema()
          .collections({ users: userCollection })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
          role: 'admin',
        });

        const attrs = serializer.serializeAttrs(user);

        expect(attrs).toEqual({ id: '1', name: 'Alice' });
      });
    });

    describe('serializeCollectionAttrs (Layer 1)', () => {
      it('should return array of attributes for each model', () => {
        type UserAttrsJSON = { id: string; name: string };

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserAttrsJSON>()
          .create();

        type TestUserModel = typeof testUserModel;

        type TestSchema = {
          users: CollectionConfig<
            TestUserModel,
            {},
            Factory<TestUserModel>,
            TestSchema,
            Serializer<TestUserModel, TestSchema>
          >;
        };

        const serializer = new Serializer<TestUserModel, TestSchema>(
          testUserModel,
          {
            select: ['id', 'name'],
          },
        );
        const userCollection = collection<TestSchema>()
          .model(testUserModel)
          .serializer(serializer)
          .create();
        const testSchema = schema()
          .collections({ users: userCollection })
          .setup();

        testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
          role: 'admin',
        });
        testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
          role: 'user',
        });

        const users = testSchema.users.all();
        const attrs = serializer.serializeCollectionAttrs(users);

        expect(attrs).toEqual([
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ]);
      });
    });

    describe('serializeModel (Layer 2)', () => {
      it('should return model data without root wrapping', () => {
        type UserAttrsJSON = { id: string; name: string; email: string };

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserAttrsJSON>()
          .create();

        type TestUserModel = typeof testUserModel;

        type TestSchema = {
          users: CollectionConfig<
            TestUserModel,
            {},
            Factory<TestUserModel>,
            TestSchema,
            Serializer<TestUserModel, TestSchema>
          >;
        };

        const serializer = new Serializer<TestUserModel, TestSchema>(
          testUserModel,
          {
            select: ['id', 'name', 'email'],
          },
        );
        const userCollection = collection<TestSchema>()
          .model(testUserModel)
          .serializer(serializer)
          .create();
        const testSchema = schema()
          .collections({ users: userCollection })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
          role: 'admin',
        });

        const data = serializer.serializeModel(user);

        expect(data).toEqual({
          id: '1',
          name: 'Alice',
          email: 'alice@example.com',
        });
      });
    });

    describe('serializeCollectionModels (Layer 2)', () => {
      it('should return array of model data without root wrapping', () => {
        type UserAttrsJSON = { id: string; name: string };

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserAttrsJSON>()
          .create();

        type TestUserModel = typeof testUserModel;

        type TestSchema = {
          users: CollectionConfig<
            TestUserModel,
            {},
            Factory<TestUserModel>,
            TestSchema,
            Serializer<TestUserModel, TestSchema>
          >;
        };

        const serializer = new Serializer<TestUserModel, TestSchema>(
          testUserModel,
          {
            select: ['id', 'name'],
          },
        );
        const userCollection = collection<TestSchema>()
          .model(testUserModel)
          .serializer(serializer)
          .create();
        const testSchema = schema()
          .collections({ users: userCollection })
          .setup();

        testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
          role: 'admin',
        });
        testSchema.users.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret',
          role: 'user',
        });

        const users = testSchema.users.all();
        const data = serializer.serializeCollectionModels(users);

        expect(data).toEqual([
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ]);
      });
    });
  });
});
