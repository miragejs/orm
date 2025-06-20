import { DbCollection, NumberIdentityManager } from '@src/db';
import { Model, type ModelAttrs } from '@src/model';

interface UserAttrs extends ModelAttrs<string> {
  name: string;
  email: string;
}

const UserModel = Model.define<UserAttrs>();

describe('Model', () => {
  let collection: DbCollection<UserAttrs>;

  beforeEach(() => {
    collection = new DbCollection<UserAttrs>({ name: 'users' });
  });

  describe('define', () => {
    it('should create a model class with attribute getters/setters', () => {
      const user = new UserModel({
        name: 'User',
        attrs: { name: 'John', email: 'john@example.com' },
        collection,
      });
      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');
      expect(user.isNew()).toBe(true);
    });

    it('should allow attribute modification', () => {
      const user = new UserModel({
        name: 'User',
        attrs: { name: 'John', email: 'john@example.com' },
        collection,
      });

      user.name = 'Jane';
      expect(user.name).toBe('Jane');
      expect(user.attrs.name).toBe('Jane');
    });

    it('should preserve model methods', () => {
      const user = new UserModel({
        name: 'User',
        attrs: { name: 'John', email: 'john@example.com' },
        collection,
      });

      expect(typeof user.save).toBe('function');
      expect(typeof user.update).toBe('function');
      expect(typeof user.destroy).toBe('function');
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
        name: 'Comment',
        attrs: { text: 'Great post!', userId: '1' },
        collection: commentCollection,
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
        name: 'Post',
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
