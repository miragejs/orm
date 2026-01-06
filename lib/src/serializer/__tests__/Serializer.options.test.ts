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

describe('Serializer options', () => {
  describe('select option', () => {
    describe('array format', () => {
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

    describe('object format - exclusion mode', () => {
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
        expect(json).toEqual({
          id: '1',
          name: 'Bob',
          email: 'bob@example.com',
        });
        expect(json).not.toHaveProperty('password');
        expect(json).not.toHaveProperty('role');
      });
    });

    describe('object format - inclusion mode', () => {
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
              .serializer({
                select: { id: true, name: true, email: false, password: false },
              })
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

  describe('root option', () => {
    describe('auto-enable for sideLoaded mode', () => {
      it('should auto-enable root when relationsMode=sideLoaded', () => {
        interface UserJSON {
          id: string;
          name: string;
          email: string;
          password: string;
          posts: PostJSON[];
        }

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<{ user: UserJSON }>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(testUserModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: ['posts'],
                relationsMode: 'sideLoaded',
              })
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

        expect(json).toHaveProperty('user');
        expect(json.user).toHaveProperty('id', user.id);
      });

      it('should NOT auto-enable root when with is specified without relationsMode (defaults to foreignKey)', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: ['posts'] })
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

        expect(json).not.toHaveProperty('user');
        expect(json).toHaveProperty('id', user.id);
        expect(json).toHaveProperty('postIds');
      });

      it('should warn and ignore root=false when relationsMode=sideLoaded', () => {
        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: ['posts'],
                relationsMode: 'sideLoaded',
                root: false,
              })
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

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('root'),
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('sideLoaded'),
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('ignored'),
        );

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
              .serializer({
                with: ['posts'],
                relationsMode: 'sideLoaded',
                root: 'customUser',
              })
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
              .serializer({ with: ['posts'], relationsMode: 'embedded' })
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

        expect(json).not.toHaveProperty('user');
        expect(json).toHaveProperty('id', user.id);
      });
    });
  });

  describe('with option', () => {
    describe('default behavior (no with)', () => {
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
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
        });
        testSchema.posts.create({
          title: 'Post 1',
          content: 'Content',
          authorId: user.id,
        });

        const json = user.toJSON();

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
              .serializer({ with: [] })
              .create(),
            posts: collection().model(postModel).create(),
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

        const json = user.toJSON();

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

    describe('object format with boolean values', () => {
      it('should include relationships with true values', () => {
        interface UserJSON {
          id: string;
          name: string;
          email: string;
          posts: PostJSON[];
        }

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserJSON>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(testUserModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: { posts: true },
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(testUserModel, {
                  foreignKey: 'authorId',
                }),
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
        expect(json.posts).toHaveLength(1);
        expect(json.posts[0]).toHaveProperty('id', post.id);
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
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
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

    describe('nested options', () => {
      it('should apply select option to nested relationships', () => {
        interface UserJSON {
          id: string;
          name: string;
          email: string;
          posts: PostJSON[];
        }

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserJSON>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(testUserModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: {
                  posts: { select: ['id', 'title'] },
                },
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(testUserModel, {
                  foreignKey: 'authorId',
                }),
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
        expect(json.posts[0]).toEqual({ id: '2', title: 'Post 1' });
        expect(json.posts[0]).not.toHaveProperty('content');
        expect(json.posts[0]).not.toHaveProperty('authorId');
      });

      it('should apply select object format to nested relationships', () => {
        interface UserJSON {
          id: string;
          name: string;
          email: string;
          posts: PostJSON[];
        }

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserJSON>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(testUserModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: {
                  posts: { select: { authorId: false } },
                },
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(testUserModel, {
                  foreignKey: 'authorId',
                }),
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
        expect(json.posts[0]).toHaveProperty('id');
        expect(json.posts[0]).toHaveProperty('title');
        expect(json.posts[0]).toHaveProperty('content');
        expect(json.posts[0]).not.toHaveProperty('authorId');
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
                with: {
                  posts: { mode: 'sideLoaded' },
                },
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
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

        expect(json).toHaveProperty('posts');
        expect(json).not.toHaveProperty('postIds');
      });

      it('should support nested with option (boolean only)', () => {
        interface UserJSON {
          id: string;
          name: string;
          email: string;
          posts: PostJSON[];
        }

        interface PostJSON {
          id: string;
          title: string;
          author: UserJSON;
        }

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserJSON>()
          .create();

        const testPostModel = model()
          .name('post')
          .collection('posts')
          .attrs<PostAttrs>()
          .json<PostJSON>()
          .create();

        const commentModel = model()
          .name('comment')
          .collection('comments')
          .attrs<CommentAttrs>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(testUserModel)
              .relationships({
                posts: associations.hasMany(testPostModel),
              })
              .serializer({
                with: {
                  posts: {
                    select: ['id', 'title'],
                    with: { author: true },
                  },
                },
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(testPostModel)
              .relationships({
                author: associations.belongsTo(testUserModel, {
                  foreignKey: 'authorId',
                }),
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

        const posts = json.posts;
        expect(posts[0]).toHaveProperty('id');
        expect(posts[0]).toHaveProperty('title');
        expect(posts[0]).toHaveProperty('author');
        expect(posts[0].author).toHaveProperty('name', 'Frank');
      });
    });

    describe('with option filtering', () => {
      it('should only include specified relationships with relationsMode=foreignKey (default)', () => {
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
                }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({ with: ['author'] })
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

        expect(json).toEqual({
          id: post.id,
          title: 'Post',
          content: 'Content',
          authorId: user.id,
        });
        expect(json).not.toHaveProperty('commentIds');
        expect(json).not.toHaveProperty('author');
        expect(json).not.toHaveProperty('authors');
        expect(json).not.toHaveProperty('comments');
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
              .serializer({
                with: ['author'],
                relationsMode: 'sideLoaded',
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

        expect(json).toMatchObject({
          post: {
            id: post.id,
            title: 'Post',
            content: 'Content',
            authorId: user.id,
            commentIds: [comment.id],
          },
          authors: [expect.objectContaining({ id: user.id })],
        });
        expect(json).not.toHaveProperty('comments');
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
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({
                with: ['comments'],
                relationsMode: 'embedded',
              })
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

        expect(json).toMatchObject({
          id: post.id,
          title: 'Post',
          content: 'Content',
          comments: [
            {
              id: comment.id,
              content: 'Nice!',
              userId: user.id,
            },
          ],
        });
        expect(json).not.toHaveProperty('authorId');
        expect(json).not.toHaveProperty('commentIds');
        expect(json).not.toHaveProperty('author');
      });
    });
  });

  describe('relationsMode option', () => {
    describe('foreignKey mode (default)', () => {
      it('should include foreign keys for relationships in with array', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({ with: ['author'] })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          author: user,
        });

        const json = post.toJSON();

        expect(json).toEqual({
          id: post.id,
          title: 'Post',
          content: 'Content',
          authorId: user.id,
        });
        expect(json).not.toHaveProperty('author');
      });
    });

    describe('sideLoaded mode', () => {
      it('should include both foreign keys and side-loaded relationships', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({ with: ['posts'], relationsMode: 'sideLoaded' })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
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

        user.reload();
        const json = user.toJSON();

        expect(json).toMatchObject({
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
              .serializer({
                with: ['author'],
                relationsMode: 'sideLoaded',
              })
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

        expect(json).toEqual({
          post: {
            id: post.id,
            title: 'My Post',
            content: 'Content',
            authorId: user.id,
          },
          authors: [
            {
              id: user.id,
              name: 'Diana',
              email: 'diana@example.com',
              password: 'secret',
            },
          ],
        });
      });
    });

    describe('embedded mode', () => {
      it('should include embedded relationships without foreign keys', () => {
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: ['posts'],
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
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

        user.reload();
        const json = user.toJSON();

        expect(json).toEqual({
          id: user.id,
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
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
        expect(json).not.toHaveProperty('postIds');
      });

      it('should embed belongsTo relationships without foreign keys', () => {
        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({
                with: ['author'],
                relationsMode: 'embedded',
              })
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

        expect(json).toEqual({
          id: post.id,
          title: 'My Post',
          content: 'Content',
          author: {
            id: user.id,
            name: 'Frank',
            email: 'frank@example.com',
            password: 'secret',
          },
        });
        expect(json).not.toHaveProperty('authorId');
      });

      it('should use serializeAttrs for nested relationships (attrs + FKs only)', () => {
        // Note: Deep nested relationships from related model's serializer config
        // are NOT automatically applied. Use parent's nested with option instead.
        // This prevents circular reference issues.
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: ['posts'],
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              // Post's serializer config is used for post.toJSON(), NOT when embedded in user
              .serializer({
                select: ['id', 'title', 'content'],
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
          author: user,
        });
        const post2 = testSchema.posts.create({
          title: 'Post 2',
          content: 'Content 2',
          author: user,
        });

        user.reload();
        const json = user.toJSON();

        // Embedded posts use serializeAttrs: selected attrs + foreign keys
        expect(json).toEqual({
          id: user.id,
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
          posts: [
            {
              id: post1.id,
              title: 'Post 1',
              content: 'Content 1',
              authorId: user.id, // FK included via serializeAttrs
            },
            {
              id: post2.id,
              title: 'Post 2',
              content: 'Content 2',
              authorId: user.id, // FK included via serializeAttrs
            },
          ],
        });
        expect(json).not.toHaveProperty('postIds');
      });

      it('should support deep nesting via parent with option', () => {
        // To include nested relationships, use the parent's with option
        const testSchema = schema()
          .collections({
            users: collection()
              .model(userModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                // Parent controls nested relationships via with option
                with: {
                  posts: {
                    select: ['id', 'title', 'content'],
                    with: { author: true },
                  },
                },
                relationsMode: 'embedded',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
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
          author: user,
        });
        const post2 = testSchema.posts.create({
          title: 'Post 2',
          content: 'Content 2',
          author: user,
        });

        user.reload();
        const json = user.toJSON();

        // Posts include nested author via parent's with option
        expect(json).toMatchObject({
          id: user.id,
          name: 'Eve',
          posts: [
            {
              id: post1.id,
              title: 'Post 1',
              content: 'Content 1',
              author: expect.objectContaining({
                id: user.id,
                name: 'Eve',
              }),
            },
            {
              id: post2.id,
              title: 'Post 2',
              content: 'Content 2',
              author: expect.objectContaining({
                id: user.id,
                name: 'Eve',
              }),
            },
          ],
        });
        expect(json).not.toHaveProperty('postIds');
      });
    });

    describe('embedded+foreignKey mode', () => {
      it('should include embedded relationships AND foreign keys', () => {
        interface EmbeddedUserJSON {
          id: string;
          name: string;
          postIds: string[];
          posts: PostAttrs[];
        }

        const embeddedUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<EmbeddedUserJSON>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(embeddedUserModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                with: ['posts'],
                relationsMode: 'embedded+foreignKey',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(embeddedUserModel, {
                  foreignKey: 'authorId',
                }),
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
          author: user,
        });
        user.reload();

        const json = user.toJSON();

        expect(json).toHaveProperty('posts');
        expect(json).toHaveProperty('postIds');
        expect(json.postIds).toEqual([post.id]);
        expect(json.posts).toEqual([
          expect.objectContaining({
            id: post.id,
            title: 'Post 1',
            content: 'Content',
          }),
        ]);
      });

      it('should include embedded belongsTo AND foreign key', () => {
        interface EmbeddedPostJSON {
          id: string;
          title: string;
          authorId: string;
          author: UserAttrs;
        }

        const embeddedPostModel = model()
          .name('post')
          .collection('posts')
          .attrs<PostAttrs>()
          .json<EmbeddedPostJSON>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(embeddedPostModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({
                with: ['author'],
                relationsMode: 'embedded+foreignKey',
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
          title: 'My Post',
          content: 'Content',
          author: user,
        });

        const json = post.toJSON();

        expect(json).toHaveProperty('author');
        expect(json).toHaveProperty('authorId');
        expect(json.authorId).toBe(user.id);
        expect(json.author).toEqual(
          expect.objectContaining({
            id: user.id,
            name: 'Bob',
          }),
        );
      });

      it('should remove foreign keys for relationships NOT in with array', () => {
        interface CommentAttrs {
          id: string;
          content: string;
          postId: string;
        }

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
                }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({
                with: ['author'],
                relationsMode: 'embedded+foreignKey',
              })
              .create(),
            comments: collection().model(commentModel).create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Charlie',
          email: 'charlie@example.com',
          password: 'secret',
        });
        const comment = testSchema.comments.create({
          content: 'Nice!',
          postId: '1',
        });
        const post = testSchema.posts.create({
          title: 'Post',
          content: 'Content',
          author: user,
          comments: [comment],
        });

        const json = post.toJSON();

        expect(json).toHaveProperty('author');
        expect(json).toHaveProperty('authorId');
        expect(json).not.toHaveProperty('commentIds');
        expect(json).not.toHaveProperty('comments');
      });
    });

    describe('sideLoaded+foreignKey mode', () => {
      it('should include side-loaded relationships AND foreign keys', () => {
        interface SideLoadedPostJSON {
          post: PostAttrs;
          users: UserAttrs[];
        }

        const sideLoadedPostModel = model()
          .name('post')
          .collection('posts')
          .attrs<PostAttrs>()
          .json<SideLoadedPostJSON>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection().model(userModel).create(),
            posts: collection()
              .model(sideLoadedPostModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                }),
              })
              .serializer({
                root: true,
                with: ['author'],
                relationsMode: 'sideLoaded+foreignKey',
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Dave',
          email: 'dave@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Side Load Post',
          content: 'Content',
          author: user,
        });

        const json = post.toJSON();

        expect(json).toHaveProperty('post');
        expect(json).toHaveProperty('users');
        expect(json.post).toHaveProperty('authorId', user.id);
        expect(json.users).toEqual([
          expect.objectContaining({
            id: user.id,
            name: 'Dave',
          }),
        ]);
      });

      it('should work the same as sideLoaded (explicit foreignKey mode)', () => {
        interface SideLoadedUserJSON {
          user: UserAttrs & { postIds: string[] };
          posts: PostAttrs[];
        }

        const sideLoadedUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<SideLoadedUserJSON>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(sideLoadedUserModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                root: true,
                with: ['posts'],
                relationsMode: 'sideLoaded+foreignKey',
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(sideLoadedUserModel, {
                  foreignKey: 'authorId',
                }),
              })
              .create(),
          })
          .setup();

        const user = testSchema.users.create({
          name: 'Eve',
          email: 'eve@example.com',
          password: 'secret',
        });
        const post = testSchema.posts.create({
          title: 'Eve Post',
          content: 'Content',
          author: user,
        });
        user.reload();

        const json = user.toJSON();

        expect(json).toHaveProperty('user');
        expect(json).toHaveProperty('posts');
        expect(json.user).toHaveProperty('postIds');
        expect(json.user.postIds).toEqual([post.id]);
        expect(json.posts).toEqual([
          expect.objectContaining({
            id: post.id,
            title: 'Eve Post',
          }),
        ]);
      });
    });

    describe('per-relation mode override', () => {
      it('should embed relationship when using with object with mode override (no global relationsMode)', () => {
        interface TeamAttrs {
          id: string;
          name: string;
        }

        const teamModel = model()
          .name('team')
          .collection('teams')
          .attrs<TeamAttrs>()
          .create();

        interface TaskAttrs {
          id: string;
          title: string;
          teamId: string;
        }

        interface TaskJSON {
          id: string;
          title: string;
          team: TeamAttrs;
        }

        const taskModel = model()
          .name('task')
          .collection('tasks')
          .attrs<TaskAttrs>()
          .json<TaskJSON>()
          .create();

        const testSchema = schema()
          .collections({
            teams: collection().model(teamModel).create(),
            tasks: collection()
              .model(taskModel)
              .relationships({
                team: associations.belongsTo(teamModel, {
                  foreignKey: 'teamId',
                }),
              })
              .serializer({
                // No global relationsMode - should default to foreignKey
                // But per-relation mode override should still work
                with: { team: { mode: 'embedded' } },
              })
              .create(),
          })
          .setup();

        const team = testSchema.teams.create({ name: 'DevX' });
        const task = testSchema.tasks.create({
          title: 'Fix bug',
          team: team,
        });

        const json = task.toJSON();

        // Per-relation mode override should embed the team
        expect(json).toHaveProperty('team');
        expect(json.team).toEqual({ id: team.id, name: 'DevX' });
        // Foreign key should be removed when mode is 'embedded'
        expect(json).not.toHaveProperty('teamId');
      });

      it('should use foreignKey for specific relation even when global mode is embedded', () => {
        type UserJSON = {
          id: string;
          name: string;
          email: string;
          postIds: string[];
        };

        const testUserModel = model()
          .name('user')
          .collection('users')
          .attrs<UserAttrs>()
          .json<UserJSON>()
          .create();

        const testSchema = schema()
          .collections({
            users: collection()
              .model(testUserModel)
              .relationships({
                posts: associations.hasMany(postModel),
              })
              .serializer({
                relationsMode: 'embedded',
                with: { posts: { mode: 'foreignKey' } },
              })
              .create(),
            posts: collection()
              .model(postModel)
              .relationships({
                author: associations.belongsTo(testUserModel, {
                  foreignKey: 'authorId',
                }),
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
          author: user,
        });
        user.reload();

        const json = user.toJSON();

        // Per-relation mode override to foreignKey should NOT embed posts
        expect(json).not.toHaveProperty('posts');
        // But should include the foreign key
        expect(json).toHaveProperty('postIds');
        expect(json.postIds).toEqual([post.id]);
      });
    });

    describe('multiple relationships with mixed modes', () => {
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

        const testPostModel = model()
          .name('post')
          .collection('posts')
          .attrs<PostAttrs>()
          .json<{
            post: PostAttrs;
            comments: CommentAttrs[];
            authors: UserAttrs[];
          }>()
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
              .model(testPostModel)
              .relationships({
                author: associations.belongsTo(userModel, {
                  foreignKey: 'authorId',
                  collectionName: 'authors',
                }),
                comments: associations.hasMany(commentModel),
              })
              .serializer({
                with: ['author', 'comments'],
                relationsMode: 'sideLoaded',
              })
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

        expect(json).toMatchObject({
          post: {
            id: post.id,
            title: 'Post',
            content: 'Content',
            authorId: user.id,
          },
          authors: [expect.objectContaining({ id: user.id })],
          comments: [expect.objectContaining({ id: comment.id })],
        });
        expect(json.post).toHaveProperty('commentIds');
      });
    });
  });

  describe('embedded relationships respect related model serializer config', () => {
    it('should apply related model select config when embedding', () => {
      // Define JSON type that includes embedded author
      type PostWithAuthorJSON = {
        id: string;
        title: string;
        content: string;
        author: { id: string; name: string };
      };

      const testPostModel = model()
        .name('post')
        .collection('posts')
        .attrs<PostAttrs>()
        .json<PostWithAuthorJSON>()
        .create();

      const testSchema = schema()
        .collections({
          users: collection()
            .model(userModel)
            .serializer({
              select: ['id', 'name'],
            })
            .create(),
          posts: collection()
            .model(testPostModel)
            .relationships({
              author: associations.belongsTo(userModel, {
                foreignKey: 'authorId',
              }),
            })
            .serializer({
              with: ['author'],
              relationsMode: 'embedded',
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
        author: user,
      });

      const post = testSchema.posts.first()!;
      const json = post.toJSON();

      // Embedded author should only have id and name (from user's serializer select)
      expect(json.author).toEqual({
        id: user.id,
        name: 'Bob',
      });
    });
  });
});
