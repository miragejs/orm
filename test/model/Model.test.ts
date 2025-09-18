import { DbCollection } from '@src/db';
import { NumberIdentityManager } from '@src/id-manager';
import { defineModelClass, model, NewModelInstance } from '@src/model';

describe('defineModelClass', () => {
  it('should create a model class with attribute accessors', () => {
    interface TestModel {
      id: string;
      value: string;
    }

    const TestModel = model('test', 'tests').attrs<TestModel>().create();
    const TestModelClass = defineModelClass(TestModel);
    const testDbCollection = new DbCollection<TestModel>('tests');

    const test = new TestModelClass({
      attrs: { value: 'test value' },
      dbCollection: testDbCollection,
    });

    expect(test.value).toBe('test value');
    expect(test.isNew()).toBe(true);
    expect(typeof test.save).toBe('function');
  });
});

describe('Model', () => {
  // Setup test user model
  interface UserAttrs {
    id: string;
    name: string;
    email: string;
  }
  const UserModel = model('user', 'users').attrs<UserAttrs>().create();
  const UserModelClass = defineModelClass(UserModel);
  const userDbCollection = new DbCollection<UserAttrs>('users');

  let user: NewModelInstance<typeof UserModel>;

  beforeEach(() => {
    userDbCollection.clear();

    user = new UserModelClass({
      attrs: {
        name: 'John',
        email: 'john@example.com',
      },
      dbCollection: userDbCollection,
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(user.attrs).toEqual({ name: 'John', email: 'john@example.com', id: null });
      expect(user.modelName).toBe('user');
      expect(user.isNew()).toBe(true);
    });
  });

  describe('core functionality', () => {
    it('should provide id getter', () => {
      expect(user.id).toBeNull();
      user.save();
      expect(user.id).toBe('1');
    });

    it('should handle save operation', () => {
      user.save();
      expect(user.isSaved()).toBe(true);
      expect(user.id).toBeDefined();
    });

    it('should handle update operation', () => {
      user.save();
      const id = user.id;
      user.update({ name: 'Jane' });
      expect(user.id).toBe(id);
      expect(user.name).toBe('Jane');
    });

    it('should handle destroy operation', () => {
      const savedUser = user.save();
      const id = savedUser.id;
      savedUser.destroy();
      expect(userDbCollection.find(id)).toBeNull();
    });

    it('should handle reload operation', () => {
      const savedUser = user.save();
      savedUser.name = 'Jane';
      savedUser.reload();
      expect(savedUser.name).toBe('John');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      user.save();
      const json = user.toJSON();
      expect(json).toEqual({
        id: '1',
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should convert to string', () => {
      user.save();
      expect(user.toString()).toBe(`model:user(${user.id})`);
    });
  });

  describe('default string ID behavior', () => {
    it('should use string IDs by default', () => {
      interface CommentAttrs {
        id: string;
        text: string;
      }
      const CommentModel = model('comment', 'comments').attrs<CommentAttrs>().create();
      const CommentModelClass = defineModelClass(CommentModel);

      const comment = new CommentModelClass({
        attrs: { text: 'Great post!' },
      });
      expect(comment.id).toBeNull();

      comment.save();

      expect(typeof comment.id).toBe('string');
      expect(comment.text).toBe('Great post!');
    });
  });

  describe('explicit number ID behavior', () => {
    it('should work with number IDs when explicitly typed', () => {
      interface PostAttrs {
        id: number;
        title: string;
        content: string;
      }
      const PostModel = model('post', 'posts').attrs<PostAttrs>().create();
      const PostModelClass = defineModelClass(PostModel);
      const postDbCollection = new DbCollection<PostAttrs>('posts', {
        identityManager: new NumberIdentityManager(),
      });

      const post = new PostModelClass({
        attrs: { title: 'My Post', content: 'Content here' },
        dbCollection: postDbCollection,
      });
      expect(post.id).toBeNull();

      post.save();

      expect(post.id).toBeDefined();
      expect(typeof post.id).toBe('number');
      expect(post.title).toBe('My Post');
    });
  });
});
