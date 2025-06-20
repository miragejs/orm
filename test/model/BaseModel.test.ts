import { DbCollection, NumberIdentityManager } from '@src/db';
import { BaseModel, Model, type ModelAttrs } from '@src/model';

interface UserAttrs extends ModelAttrs<string> {
  email: string;
  name: string;
}

describe('BaseModel', () => {
  let model: BaseModel<UserAttrs>;
  let collection: DbCollection<UserAttrs, string>;

  beforeEach(() => {
    collection = new DbCollection<UserAttrs, string>({ name: 'users' });
    model = new BaseModel<UserAttrs>({
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
      model.save();
      const id = model.id as string;
      model.destroy();
      expect(collection.find(id)).toBeNull();
    });

    it('should handle reload operation', () => {
      model.save();
      const id = model.id as string;
      collection.update(id, { name: 'Jane', email: 'jane@example.com' });
      model.reload();
      expect(model.attrs.name).toBe('Jane');
      expect(model.attrs.email).toBe('jane@example.com');
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

      const CommentModel = Model.define<CommentAttrs>();
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

      const PostModel = Model.define<PostAttrs>();
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
});
