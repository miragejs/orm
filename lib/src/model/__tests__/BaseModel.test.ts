import { DbCollection } from '@src/db';
import { NumberIdentityManager } from '@src/id-manager';

import BaseModel from '../BaseModel';

// Define test model attributes
interface UserAttrs {
  id: string;
  name: string;
  email: string;
}

describe('BaseModel', () => {
  // Create test collection
  const userDbCollection = new DbCollection<UserAttrs>('users');

  let user: BaseModel<UserAttrs>;
  beforeEach(() => {
    // Create test base model instance
    user = new BaseModel<UserAttrs>(
      'user',
      'users',
      {
        name: 'John',
        email: 'john@example.com',
      },
      userDbCollection,
    );

    // Clear test collection
    userDbCollection.clear();
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      expect(user.attrs).toEqual({ name: 'John', email: 'john@example.com', id: null });
      expect(user.modelName).toBe('user');
      expect(user.isNew()).toBe(true);
    });
  });

  describe('Core functionality', () => {
    it('should provide id getter', () => {
      expect(user.id).toBeNull();
      user.save();
      expect(user.id).toBe('1');
    });

    it('should provide attrs getter', () => {
      expect(user.attrs).toEqual({ name: 'John', email: 'john@example.com', id: null });
      user.save();
      expect(user.attrs).toEqual({ name: 'John', email: 'john@example.com', id: '1' });
    });

    it('should handle save operation', () => {
      user.save();
      expect(user.isSaved()).toBe(true);
      expect(user.id).toBeDefined();
    });

    it('should handle update operation', () => {
      const updatedUser = user.update({ name: 'Jane' });
      const { id } = updatedUser;

      expect(user.id).toBe(id);
      expect(user.attrs.name).toBe('Jane');
      expect(userDbCollection.find(id)).toMatchObject({ name: 'Jane' });
    });

    it('should handle destroy operation', () => {
      const savedUser = user.save();
      const id = savedUser.id;

      savedUser.destroy();

      expect(userDbCollection.find(id)).toBeNull();
      expect(user.isNew()).toBe(true);
      expect(user.id).toBeNull();
    });

    it('should handle reload operation', () => {
      const savedUser = user.save();
      expect(savedUser.attrs.name).toBe('John');

      userDbCollection.update(savedUser.id, { name: 'Jane' });
      savedUser.reload();

      expect(savedUser.attrs.name).toBe('Jane');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      user.save();

      const json: UserAttrs = user.toJSON();
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

  describe('ID behavior', () => {
    it('should use string IDs by default', () => {
      const comment = new BaseModel<{ id: string; text: string }>('comment', 'comments', {
        text: 'Great post!',
      });
      expect(comment.id).toBeNull();

      comment.save();

      expect(typeof comment.id).toBe('string');
      expect(comment.attrs.text).toBe('Great post!');
    });

    it('should work with number IDs when explicitly typed', () => {
      const postDbCollection = new DbCollection<{ id: number; title: string; content: string }>(
        'posts',
        { identityManager: new NumberIdentityManager() },
      );

      const post = new BaseModel<{ id: number; title: string; content: string }>(
        'post',
        'posts',
        { title: 'My Post', content: 'Content here' },
        postDbCollection,
      );
      expect(post.id).toBeNull();

      post.save();

      expect(post.id).toBeDefined();
      expect(typeof post.id).toBe('number');
      expect(post.attrs.title).toBe('My Post');
    });
  });
});
