import { DbCollection } from '@src/db';
import { ModelCollection, defineModel, defineToken, type ModelInstance } from '@src/model';

interface UserModel {
  id: string;
  email: string;
  name: string;
}

const UserToken = defineToken<UserModel>('user', 'users');
const UserModelClass = defineModel(UserToken);

describe('ModelCollection', () => {
  let collection: DbCollection<UserModel>;
  let modelCollection: ModelCollection<typeof UserToken>;
  let user1: ModelInstance<typeof UserToken>;
  let user2: ModelInstance<typeof UserToken>;

  beforeEach(() => {
    collection = new DbCollection<UserModel>('users');

    user1 = new UserModelClass({
      attrs: { name: 'John', email: 'john@example.com' },
      collection,
    }).save();
    user2 = new UserModelClass({
      attrs: { name: 'Jane', email: 'jane@example.com' },
      collection,
    }).save();

    modelCollection = new ModelCollection(UserToken, [user1]);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(modelCollection.collectionName).toBe('users');
      expect(Array.from(modelCollection)).toStrictEqual([user1]);
      expect(modelCollection.length).toBe(1);
    });
  });

  describe('array methods', () => {
    it('should use array-like methods', () => {
      // Test add (replacement for push)
      modelCollection.add(user2);
      expect(Array.from(modelCollection)).toStrictEqual([user1, user2]);

      // Test filter (returns new collection)
      const filtered = modelCollection.filter((model) => model.name === 'John');
      expect(Array.from(filtered)).toStrictEqual([user1]);

      // Test includes (uses toString comparison)
      expect(modelCollection.includes(user1)).toBe(true);
      expect(modelCollection.includes(user2)).toBe(true);

      // Test slice (returns new collection)
      const sliced = modelCollection.slice(0, 1);
      expect(Array.from(sliced)).toStrictEqual([user1]);

      // Test sort (returns new collection, doesn't mutate original)
      const sorted = modelCollection.sort((a, b) => a.name.localeCompare(b.name));
      expect(Array.from(sorted)).toStrictEqual([user2, user1]); // Jane comes before John
      expect(Array.from(modelCollection)).toStrictEqual([user1, user2]); // Original unchanged
    });
  });

  describe('collection-specific methods', () => {
    it('should add model to collection', () => {
      modelCollection.add(user2);
      expect(Array.from(modelCollection)).toStrictEqual([user1, user2]);
    });

    it('should destroy all models', () => {
      const originalDestroy = user1.destroy;
      let destroyCalled = false;
      user1.destroy = () => {
        destroyCalled = true;
        return originalDestroy.call(user1);
      };
      modelCollection.destroy();
      expect(destroyCalled).toBe(true);
      expect(modelCollection.length).toBe(0);
    });

    it('should reload all models', () => {
      const originalReload = user1.reload;
      let reloadCalled = false;
      user1.reload = function () {
        reloadCalled = true;
        return originalReload.call(this);
      };
      modelCollection.reload();
      expect(reloadCalled).toBe(true);
    });

    it('should remove model from collection', () => {
      modelCollection.remove(user1);
      expect(Array.from(modelCollection)).toStrictEqual([]);
    });

    it('should save all models', () => {
      const originalSave = user1.save;
      let saveCalled = false;
      user1.save = function () {
        saveCalled = true;
        return originalSave.call(this);
      };
      modelCollection.save();
      expect(saveCalled).toBe(true);
    });

    it('should update all models', () => {
      const originalUpdate = user1.update;
      let updateCalled = false;
      let updateArgs: any;
      user1.update = function (attrs: Partial<UserModel>) {
        updateCalled = true;
        updateArgs = attrs;
        return originalUpdate.call(this, attrs);
      };
      modelCollection.update({ name: 'Updated' });
      expect(updateCalled).toBe(true);
      expect(updateArgs).toEqual({ name: 'Updated' });
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      expect(modelCollection.toString()).toBe(`collection:users(${user1.toString()})`);
    });
  });

  describe('default string ID behavior', () => {
    it('should work with string IDs by default', () => {
      interface CommentModel {
        id: string;
        text: string;
        userId: string;
      }

      const CommentToken = defineToken<CommentModel>('comment', 'comments');
      const CommentModelClass = defineModel(CommentToken);
      const commentCollection = new DbCollection<CommentModel>('comments');

      const comment1 = new CommentModelClass({
        attrs: { text: 'First comment', userId: '1' },
        collection: commentCollection,
      }).save();

      const comment2 = new CommentModelClass({
        attrs: { text: 'Second comment', userId: '2' },
        collection: commentCollection,
      }).save();

      const commentModelCollection = new ModelCollection(CommentToken, [comment1, comment2]);

      expect(commentModelCollection.length).toBe(2);
      expect(commentModelCollection.get(0)?.text).toBe('First comment');
      expect(commentModelCollection.get(1)?.text).toBe('Second comment');
      expect(typeof commentModelCollection.get(0)?.id).toBe('string');
      expect(typeof commentModelCollection.get(1)?.id).toBe('string');
    });
  });
});
