import { model } from '@src/model';
import { relations } from '@src/relations';
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

// Create base model templates with default JSON types
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
  .json<PostJSON, PostJSON[]>()
  .build();

describe('Serializer - Model serialization', () => {
  describe('Basic model serialization', () => {
    it('should serialize a model with default settings (no filtering)', () => {
      const rawUserModel = model()
        .name('user')
        .collection('users')
        .attrs<UserAttrs>()
        .json<UserJSON>()
        .build();

      const testSchema = schema()
        .collections({
          users: collection().model(rawUserModel).build(),
        })
        .build();

      const user = testSchema.users.create({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        password: 'secret123',
      });
      const json: UserJSON = user.toJSON();

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
            .build(),
        })
        .build();

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
        .build();

      const testSchema = schema()
        .collections({
          users: collection()
            .model(rootUserModel)
            .serializer({ select: ['id', 'name', 'email'], root: true })
            .build(),
        })
        .build();

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
        .build();

      const testSchema = schema()
        .collections({
          users: collection()
            .model(personModel)
            .serializer({ select: ['id', 'name', 'email'], root: 'person' })
            .build(),
        })
        .build();

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

  describe('Relationships - edge cases', () => {
    describe('belongsTo relationships', () => {
      it('should handle null belongsTo relationship', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({ with: ['author'], relationsMode: 'embedded' })
              .build(),
          })
          .build();

        const post = testSchema.posts.create({
          title: 'Orphan Post',
          content: 'No author',
        });

        const json = post.toJSON();

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
      it('should handle empty hasMany relationship', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: relations.hasMany(postModel),
              })
              .serializer({ with: ['posts'], relationsMode: 'embedded' })
              .build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
        });

        const json = user.toJSON();

        expect(json).toEqual({
          id: user.id,
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
          posts: [],
        });
        expect(json).not.toHaveProperty('postIds');
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
              .serializer({ select: ['id', 'name', 'email'] })
              .build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .build(),
          })
          .build();

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

        const json = post.author?.toJSON();

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
              .serializer({ select: ['id', 'name'], root: true })
              .build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .build(),
          })
          .build();

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
              .build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .build(),
          })
          .build();

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
                posts: relations.hasMany(postModel),
              })
              .build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({ select: ['id', 'title'] })
              .build(),
          })
          .build();

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

        user.reload();

        const json = user.posts.toJSON();

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
                posts: relations.hasMany(postModel),
              })
              .build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({ select: ['id', 'title'], root: true })
              .build(),
          })
          .build();

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

        user.reload();

        const json = user.posts.toJSON();

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
                posts: relations.hasMany(postModel),
              })
              .build(),
            posts: collection()
              .model(postModel)
              .serializer({ select: ['id', 'title'], root: true })
              .build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
        });

        const json = user.posts.toJSON();

        expect(json).toEqual({ posts: [] });
      });

      it('should serialize related collection with relationships', () => {
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
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({ with: ['author'], relationsMode: 'embedded' })
              .build(),
          })
          .build();

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

        user.reload();

        const json = user.posts.toJSON();

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
              postIds: [post.id],
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
          .build();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: relations.hasMany(postModel),
              })
              .serializer({ select: ['id', 'name'] })
              .build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
                comments: relations.hasMany(commentModel),
              })
              .serializer({ select: ['id', 'title'] })
              .build(),
            comments: collection()
              .model(commentModel)
              .relationships({
                user: relations.belongsTo(userModel, {
                  foreignKey: 'userId',
                }),
              })
              .serializer({ select: ['id', 'content'] })
              .build(),
          })
          .build();

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

        const authorJson = user.posts.models[0].author?.toJSON();
        expect(authorJson).toEqual({
          id: user.id,
          name: 'Grace',
        });

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
              .build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret123',
          role: 'admin',
        });

        const json = user.serialize();

        expect(json).toEqual({
          id: '1',
          name: 'Alice',
          email: 'alice@example.com',
        });
        expect(json).not.toHaveProperty('password');
        expect(json).not.toHaveProperty('role');
      });
    });

    describe('Method-level option overrides', () => {
      it('should override select at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ select: ['id', 'name', 'email'] })
              .build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
          role: 'admin',
        });

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
              .build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Diana',
          email: 'diana@example.com',
          password: 'secret',
          role: 'user',
        });

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
              .build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
          role: 'admin',
        });

        const json = user.serialize({ root: 'person' });

        expect(json).toEqual({
          person: {
            id: '1',
            name: 'Eve',
          },
        });
      });

      it('should override relationsMode at method level (sideLoaded -> embedded)', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).build(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: relations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({ with: ['author'], relationsMode: 'sideLoaded' })
              .build(),
          })
          .build();

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

        const json = post.serialize<{ author: UserAttrs }>({
          relationsMode: 'embedded',
        });

        expect(json).toHaveProperty('author');
        expect(json.author).toEqual({
          id: user.id,
          name: 'Frank',
          email: 'frank@example.com',
          password: 'secret',
        });
        expect(json).not.toHaveProperty('authorId');
        expect(json).not.toHaveProperty('users');
      });

      it('should override relationsMode at method level (embedded -> foreignKey)', () => {
        const testPostModel = model()
          .name('post')
          .collection('posts')
          .attrs<{ id: string; title: string; userId: string }>()
          .build();

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<{ id: string; name: string; postIds: string[] }>()
          .json<{ id: string; name: string; postIds: string[] }>()
          .build();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(testUserModel)
              .relationships({
                posts: relations.hasMany(testPostModel),
              })
              .serializer({
                with: ['posts'],
                relationsMode: 'embedded',
              })
              .build(),
            posts: collection()
              .model(testPostModel)
              .relationships({
                user: relations.belongsTo(testUserModel, {
                  foreignKey: 'userId',
                }),
              })
              .build(),
          })
          .build();

        const user = testSchema.users.create({ id: '1', name: 'John' });
        testSchema.posts.create({ id: '1', title: 'Post 1', userId: user.id });

        user.reload();

        const json = user.serialize({
          with: {
            posts: { mode: 'foreignKey' },
          },
        });

        expect(json).not.toHaveProperty('posts');
        expect(json).toEqual({
          id: '1',
          name: 'John',
          postIds: ['1'],
        });
      });

      it('should merge multiple option overrides at method level', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .serializer({ root: false })
              .build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Grace',
          email: 'grace@example.com',
          password: 'secret',
          role: 'admin',
        });

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
            users: collection().model(userModel).build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Henry',
          email: 'henry@example.com',
          password: 'secret',
          role: 'user',
        });

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
            users: collection().model(userModel).build(),
          })
          .build();

        const user = testSchema.users.create({
          name: 'Ivy',
          email: 'ivy@example.com',
          password: 'secret',
          role: 'admin',
        });

        const json = user.serialize({ select: ['id', 'name'], root: true });

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
});
