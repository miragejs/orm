import { DbCollection, NumberIdentityManager } from '@src/db';
import { Model, defineModel, type ModelAttrs } from '@src/model';

interface UserAttrs extends ModelAttrs {
  email: string;
  name: string;
}

describe('Model', () => {
  let model: Model<UserAttrs>;
  let collection: DbCollection<UserAttrs>;

  beforeEach(() => {
    collection = new DbCollection<UserAttrs>({ name: 'users' });
    model = new Model<UserAttrs>({
      name: 'user',
      attrs: {
        email: 'john@example.com',
        name: 'John',
      },
      collection,
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
      expect(model.attrs.name).toBe('Jane');
    });

    it('should handle destroy operation', () => {
      const user = model.save();
      const id = user.id;
      user.destroy();
      expect(collection.find(id)).toBeNull();
    });

    it('should handle reload operation', () => {
      const user = model.save();
      const id = user.id;
      collection.update(id, { name: 'Jane', email: 'jane@example.com' });
      user.reload();
      expect(user.attrs.name).toBe('Jane');
      expect(user.attrs.email).toBe('jane@example.com');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      model.save();
      const json = model.toJSON();
      expect(json).toEqual({
        id: model.id,
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
      interface CommentAttrs extends ModelAttrs {
        text: string;
        userId: string;
      }

      const CommentModel = defineModel<CommentAttrs>();
      const commentCollection = new DbCollection<CommentAttrs>({ name: 'comments' });
      const comment = new CommentModel({
        attrs: { text: 'Great post!', userId: '1' },
        collection: commentCollection,
        name: 'comment',
      });

      comment.save();
      expect(typeof comment.id).toBe('string');
      expect(comment.text).toBe('Great post!');
      expect(comment.userId).toBe('1');
    });
  });

  describe('explicit number ID behavior', () => {
    it('should work with number IDs when explicitly typed', () => {
      interface PostAttrs extends ModelAttrs<number> {
        title: string;
        content: string;
      }

      const PostModel = defineModel<PostAttrs>();
      const postCollection = new DbCollection<PostAttrs, number>({
        name: 'posts',
        identityManager: new NumberIdentityManager(),
      });
      const post = new PostModel({
        name: 'post',
        attrs: { title: 'My Post', content: 'Content here' },
        collection: postCollection,
      });

      post.save();
      expect(typeof post.id).toBe('number');
      expect(post.title).toBe('My Post');
      expect(post.content).toBe('Content here');
    });
  });

  describe('defineModel factory function', () => {
    it('should create a model class with attribute accessors', () => {
      interface TestAttrs extends ModelAttrs {
        value: string;
      }

      const TestModel = defineModel<TestAttrs>();
      const testCollection = new DbCollection<TestAttrs>({ name: 'tests' });

      const test = new TestModel({
        name: 'Test',
        attrs: { value: 'test value' },
        collection: testCollection,
      });

      expect(test.value).toBe('test value');
      expect(test.isNew()).toBe(true);
      expect(typeof test.save).toBe('function');
    });
  });
});
