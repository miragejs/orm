import { DbCollection } from '@src/db';
import { NumberIdentityManager } from '@src/id-manager';
import { defineModel, defineToken, NewModelInstance } from '@src/model';

describe('defineModel', () => {
  it('should create a model class with attribute accessors', () => {
    interface TestModel {
      id: string;
      value: string;
    }

    const TestToken = defineToken<TestModel>('test', 'tests');
    const TestModelClass = defineModel(TestToken);
    const testCollection = new DbCollection<TestModel>('tests');

    const test = new TestModelClass({
      attrs: { value: 'test value' },
      collection: testCollection,
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
    email: string;
    name: string;
  }
  const UserToken = defineToken<UserAttrs>('user', 'users');
  const UserModel = defineModel(UserToken);
  const userDbCollection = new DbCollection<UserAttrs>('users');

  let model: NewModelInstance<typeof UserToken>;

  beforeEach(() => {
    userDbCollection.clear();

    model = new UserModel({
      attrs: {
        email: 'john@example.com',
        name: 'John',
      },
      collection: userDbCollection,
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(model.attrs).toEqual({ name: 'John', email: 'john@example.com', id: null });
      expect(model.modelName).toBe('user');
      expect(model.isNew()).toBe(true);
    });
  });

  describe('core functionality', () => {
    it('should provide id getter', () => {
      expect(model.id).toBeNull();
      model.save();
      expect(model.id).toBe('1');
    });

    it('should handle save operation', () => {
      model.save();
      expect(model.isSaved()).toBe(true);
      expect(model.id).toBeDefined();
    });

    it('should handle update operation', () => {
      model.save();
      const id = model.id;
      model.update({ name: 'Jane' });
      expect(model.id).toBe(id);
      expect(model.name).toBe('Jane');
    });

    it('should handle destroy operation', () => {
      const user = model.save();
      const id = user.id;
      user.destroy();
      expect(userDbCollection.find(id)).toBeNull();
    });

    it('should handle reload operation', () => {
      const user = model.save();
      const id = user.id;
      userDbCollection.update(id, { name: 'Jane', email: 'jane@example.com' });
      user.reload();
      expect(user.name).toBe('Jane');
      expect(user.email).toBe('jane@example.com');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      model.save();
      const json = model.toJSON();
      expect(json).toEqual({
        id: '1',
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should convert to string', () => {
      model.save();
      expect(model.toString()).toBe(`model:user(${model.id})`);
    });
  });

  describe('default string ID behavior', () => {
    it('should use string IDs by default', () => {
      interface CommentAttrs {
        id: string;
        text: string;
      }

      const CommentToken = defineToken<CommentAttrs>('comment', 'comments');
      const CommentModel = defineModel(CommentToken);

      const comment = new CommentModel({
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

      const PostToken = defineToken<PostAttrs>('post', 'posts');
      const PostModel = defineModel(PostToken);

      const postCollection = new DbCollection<PostAttrs>('posts', {
        identityManager: new NumberIdentityManager(),
      });
      const post = new PostModel({
        attrs: { title: 'My Post', content: 'Content here' },
        collection: postCollection,
      });
      expect(post.id).toBeNull();

      post.save();

      expect(post.id).toBeDefined();
      expect(typeof post.id).toBe('number');
      expect(post.title).toBe('My Post');
    });
  });
});
