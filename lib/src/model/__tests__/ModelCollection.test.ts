import { collection, schema, type CollectionConfig } from '@src/schema';

import Model from '../Model';
import { model } from '../ModelBuilder';
import ModelCollection from '../ModelCollection';
import type { ModelInstance } from '../types';

// Define test model attributes
interface UserAttrs {
  id: string;
  email: string;
  name: string;
}

// Create test model
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .create();

// Create test model type
type UserModel = typeof userModel;

// Define test schema type
type TestSchema = {
  users: CollectionConfig<UserModel>;
};

// Define model class
const UserModelClass = Model.define<UserModel, TestSchema>(userModel);

// Create schema instance
const testSchema = schema()
  .collections({
    users: collection().model(userModel).create(),
  })
  .setup();

describe('ModelCollection', () => {
  let user1: ModelInstance<UserModel, TestSchema>;
  let user2: ModelInstance<UserModel, TestSchema>;
  let user3: ModelInstance<UserModel, TestSchema>;
  let userCollection: ModelCollection<UserModel, TestSchema>;

  beforeEach(() => {
    user1 = new UserModelClass({
      attrs: { name: 'John', email: 'john@example.com' },
      schema: testSchema,
    }).save();
    user2 = new UserModelClass({
      attrs: { name: 'Jane', email: 'jane@example.com' },
      schema: testSchema,
    }).save();
    user3 = new UserModelClass({
      attrs: { name: 'Alice', email: 'alice@example.com' },
      schema: testSchema,
    }).save();
    userCollection = new ModelCollection<UserModel, TestSchema>(userModel, [
      user1,
      user2,
    ]);
  });

  afterEach(() => {
    testSchema.db.emptyData();
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      expect(userCollection.collectionName).toBe('users');
      expect(Array.from(userCollection)).toStrictEqual([user1, user2]);
      expect(userCollection.length).toBe(2);
    });

    it('should initialize empty collection', () => {
      const emptyCollection = new ModelCollection<UserModel, TestSchema>(
        userModel,
      );
      expect(emptyCollection.length).toBe(0);
      expect(emptyCollection.isEmpty).toBe(true);
      expect(Array.from(emptyCollection)).toStrictEqual([]);
    });
  });

  describe('Getters', () => {
    it('should return correct length', () => {
      expect(userCollection.length).toBe(2);

      const emptyCollection = new ModelCollection<UserModel, TestSchema>(
        userModel,
      );
      expect(emptyCollection.length).toBe(0);
    });

    it('should check if collection is empty', () => {
      expect(userCollection.isEmpty).toBe(false);

      const emptyCollection = new ModelCollection<UserModel, TestSchema>(
        userModel,
      );
      expect(emptyCollection.isEmpty).toBe(true);
    });

    it('should get model by index', () => {
      expect(userCollection.at(0)).toBe(user1);
      expect(userCollection.at(1)).toBe(user2);
      expect(userCollection.at(2)).toBeUndefined();
      expect(userCollection.at(-1)).toBeUndefined();
    });

    it('should get first model', () => {
      expect(userCollection.first()).toBe(user1);

      const emptyCollection = new ModelCollection<UserModel, TestSchema>(
        userModel,
      );
      expect(emptyCollection.first()).toBeNull();
    });

    it('should get last model', () => {
      expect(userCollection.last()).toBe(user2);

      const emptyCollection = new ModelCollection<UserModel, TestSchema>(
        userModel,
      );
      expect(emptyCollection.last()).toBeNull();
    });
  });

  describe('Array-like iteration methods', () => {
    it('should execute forEach for each model', () => {
      const mockCallback = vi.fn();
      userCollection.forEach(mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, user1, 0, userCollection);
      expect(mockCallback).toHaveBeenNthCalledWith(2, user2, 1, userCollection);
    });

    it('should map models to new collection', () => {
      const mappedCollection = userCollection.map((m) => {
        m.update({ name: `Mapped ${m.name}` });
        return m;
      });

      expect(mappedCollection).toBeInstanceOf(ModelCollection);
      expect(mappedCollection.length).toBe(2);
      expect(mappedCollection.at(0)?.name).toBe('Mapped John');
      expect(mappedCollection.at(1)?.name).toBe('Mapped Jane');
    });

    it('should filter models to new collection', () => {
      const filteredCollection = userCollection.filter(
        (model) => model.name === 'John',
      );

      expect(filteredCollection).toBeInstanceOf(ModelCollection);
      expect(filteredCollection.length).toBe(1);
      expect(filteredCollection.at(0)).toBe(user1);
      // Original collection should be unchanged
      expect(userCollection.length).toBe(2);
    });

    it('should find first model matching condition', () => {
      const found = userCollection.find((model) => model.name === 'Jane');
      expect(found).toBe(user2);

      const notFound = userCollection.find((model) => model.name === 'Bob');
      expect(notFound).toBeUndefined();
    });

    it('should check if some models match condition', () => {
      expect(userCollection.some((model) => model.name === 'John')).toBe(true);
      expect(userCollection.some((model) => model.name === 'Bob')).toBe(false);
    });

    it('should check if every model matches condition', () => {
      expect(
        userCollection.every((model) => model.email.includes('@example.com')),
      ).toBe(true);
      expect(userCollection.every((model) => model.name === 'John')).toBe(
        false,
      );
    });
  });

  describe('Array-like utility methods', () => {
    it('should concatenate collections and arrays', () => {
      const otherCollection = new ModelCollection<UserModel, TestSchema>(
        userModel,
        [user3],
      );
      const concatenated = userCollection.concat(otherCollection);

      expect(concatenated).toBeInstanceOf(ModelCollection);
      expect(concatenated.length).toBe(3);
      expect(Array.from(concatenated)).toStrictEqual([user1, user2, user3]);

      // Original collections should be unchanged
      expect(userCollection.length).toBe(2);
      expect(otherCollection.length).toBe(1);
    });

    it('should concatenate with arrays', () => {
      const concatenated = userCollection.concat([user3]);

      expect(concatenated).toBeInstanceOf(ModelCollection);
      expect(concatenated.length).toBe(3);
      expect(Array.from(concatenated)).toStrictEqual([user1, user2, user3]);
    });

    it('should check if collection includes model', () => {
      expect(userCollection.includes(user1)).toBe(true);
      expect(userCollection.includes(user2)).toBe(true);
      expect(userCollection.includes(user3)).toBe(false);
    });

    it('should find index of model', () => {
      expect(userCollection.indexOf(user1)).toBe(0);
      expect(userCollection.indexOf(user2)).toBe(1);
      expect(userCollection.indexOf(user3)).toBe(-1);
    });

    it('should sort models in new collection', () => {
      const sorted = userCollection.sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      expect(sorted).toBeInstanceOf(ModelCollection);
      expect(Array.from(sorted)).toStrictEqual([user2, user1]); // Jane comes before John

      // Original collection should be unchanged
      expect(Array.from(userCollection)).toStrictEqual([user1, user2]);
    });

    it('should reverse models in new collection', () => {
      const reversed = userCollection.reverse();

      expect(reversed).toBeInstanceOf(ModelCollection);
      expect(Array.from(reversed)).toStrictEqual([user2, user1]);

      // Original collection should be unchanged
      expect(Array.from(userCollection)).toStrictEqual([user1, user2]);
    });

    it('should convert to plain array', () => {
      const array = userCollection.toArray();

      expect(Array.isArray(array)).toBe(true);
      expect(array).toStrictEqual([user1, user2]);

      // Should be a copy, not the same reference
      expect(array).not.toBe(userCollection.models);
    });

    it('should convert to string representation', () => {
      const str = userCollection.toString();
      expect(str).toBe(
        `collection:users(${user1.toString()}, ${user2.toString()})`,
      );
    });

    it('should be iterable', () => {
      const models = [];
      for (const model of userCollection) {
        models.push(model);
      }
      expect(models).toStrictEqual([user1, user2]);
    });
  });

  describe('CRUD operations', () => {
    it('should add model to collection', () => {
      userCollection.add(user3);
      expect(userCollection.length).toBe(3);
      expect(Array.from(userCollection)).toStrictEqual([user1, user2, user3]);
    });

    it('should remove model from collection', () => {
      const removed = userCollection.remove(user1);
      expect(removed).toBe(true);
      expect(userCollection.length).toBe(1);
      expect(Array.from(userCollection)).toStrictEqual([user2]);

      // Try to remove non-existent model
      const notRemoved = userCollection.remove(user3);
      expect(notRemoved).toBe(false);
      expect(userCollection.length).toBe(1);
    });

    it('should save all models', () => {
      const originalSave1 = user1.save;
      const originalSave2 = user2.save;
      let save1Called = false;
      let save2Called = false;

      user1.save = function () {
        save1Called = true;
        return originalSave1.call(this);
      };
      user2.save = function () {
        save2Called = true;
        return originalSave2.call(this);
      };

      const result = userCollection.save();
      expect(save1Called).toBe(true);
      expect(save2Called).toBe(true);
      expect(result).toBe(userCollection); // Should return this for chaining
    });

    it('should destroy all models', () => {
      const originalDestroy1 = user1.destroy;
      const originalDestroy2 = user2.destroy;
      let destroy1Called = false;
      let destroy2Called = false;

      user1.destroy = function () {
        destroy1Called = true;
        return originalDestroy1.call(this);
      };
      user2.destroy = function () {
        destroy2Called = true;
        return originalDestroy2.call(this);
      };

      const result = userCollection.destroy();
      expect(destroy1Called).toBe(true);
      expect(destroy2Called).toBe(true);
      expect(userCollection.length).toBe(0);
      expect(result).toBe(userCollection); // Should return this for chaining
    });

    it('should reload all models', () => {
      const originalReload1 = user1.reload;
      const originalReload2 = user2.reload;
      let reload1Called = false;
      let reload2Called = false;

      user1.reload = function () {
        reload1Called = true;
        return originalReload1.call(this);
      };
      user2.reload = function () {
        reload2Called = true;
        return originalReload2.call(this);
      };

      const result = userCollection.reload();
      expect(reload1Called).toBe(true);
      expect(reload2Called).toBe(true);
      expect(result).toBe(userCollection); // Should return this for chaining
    });

    it('should update all models', () => {
      const originalUpdate1 = user1.update;
      const originalUpdate2 = user2.update;
      let update1Called = false;
      let update2Called = false;
      let update1Args: any;
      let update2Args: any;

      user1.update = function (attrs: Partial<UserAttrs>) {
        update1Called = true;
        update1Args = attrs;
        return originalUpdate1.call(this, attrs);
      };
      user2.update = function (attrs: Partial<UserAttrs>) {
        update2Called = true;
        update2Args = attrs;
        return originalUpdate2.call(this, attrs);
      };

      const result = userCollection.update({ name: 'Updated' });
      expect(update1Called).toBe(true);
      expect(update2Called).toBe(true);
      expect(update1Args).toEqual({ name: 'Updated' });
      expect(update2Args).toEqual({ name: 'Updated' });
      expect(result).toBe(userCollection); // Should return this for chaining
    });
  });

  describe('Edge cases', () => {
    it('should handle empty collection operations', () => {
      const emptyCollection = new ModelCollection<UserModel, TestSchema>(
        userModel,
      );

      expect(emptyCollection.length).toBe(0);
      expect(emptyCollection.isEmpty).toBe(true);
      expect(emptyCollection.first()).toBeNull();
      expect(emptyCollection.last()).toBeNull();
      expect(emptyCollection.at(0)).toBeUndefined();
      expect(emptyCollection.includes(user1)).toBe(false);
      expect(emptyCollection.indexOf(user1)).toBe(-1);

      // Operations that return new collections should still work
      const filtered = emptyCollection.filter(() => true);
      expect(filtered.length).toBe(0);

      const sorted = emptyCollection.sort();
      expect(sorted.length).toBe(0);

      const reversed = emptyCollection.reverse();
      expect(reversed.length).toBe(0);
    });

    it('should handle operations with no matches', () => {
      const notFound = userCollection.find(
        (model) => model.name === 'NonExistent',
      );
      expect(notFound).toBeUndefined();

      const filtered = userCollection.filter(
        (model) => model.name === 'NonExistent',
      );
      expect(filtered.length).toBe(0);

      expect(userCollection.some((model) => model.name === 'NonExistent')).toBe(
        false,
      );
      expect(
        userCollection.every((model) => model.name === 'NonExistent'),
      ).toBe(false);
    });
  });

  describe('default string ID behavior', () => {
    it('should work with string IDs by default', () => {
      interface CommentAttrs {
        id: string;
        text: string;
        userId: string;
      }

      const CommentModel = model()
        .name('comment')
        .collection('comments')
        .attrs<CommentAttrs>()
        .create();

      type CommentSchema = {
        comments: CollectionConfig<typeof CommentModel>;
      };

      const CommentModelClass = Model.define<
        typeof CommentModel,
        CommentSchema
      >(CommentModel);

      const commentSchema = schema()
        .collections({
          comments: collection().model(CommentModel).create(),
        })
        .setup();

      const comment1 = new CommentModelClass({
        attrs: { text: 'First comment', userId: '1' },
        schema: commentSchema,
      }).save();
      const comment2 = new CommentModelClass({
        attrs: { text: 'Second comment', userId: '2' },
        schema: commentSchema,
      }).save();
      const commentCollection = new ModelCollection<
        typeof CommentModel,
        CommentSchema
      >(CommentModel, [comment1, comment2]);

      expect(commentCollection.length).toBe(2);
      expect(commentCollection.at(0)?.text).toBe('First comment');
      expect(commentCollection.at(1)?.text).toBe('Second comment');
      expect(typeof commentCollection.at(0)?.id).toBe('string');
      expect(typeof commentCollection.at(1)?.id).toBe('string');
    });
  });
});
