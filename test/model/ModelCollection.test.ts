import { DbCollection } from '@src/db';
import { defineModelClass, ModelCollection, model, type ModelInstance } from '@src/model';

interface UserAttrs {
  id: string;
  email: string;
  name: string;
}
const UserModel = model('user', 'users').attrs<UserAttrs>().create();
const UserModelClass = defineModelClass(UserModel);

describe('ModelCollection', () => {
  const dbCollection: DbCollection<UserAttrs> = new DbCollection<UserAttrs>('users');

  let user1: ModelInstance<typeof UserModel>;
  let user2: ModelInstance<typeof UserModel>;
  let userCollection: ModelCollection<typeof UserModel>;

  beforeEach(() => {
    dbCollection.clear();

    user1 = new UserModelClass({
      attrs: { name: 'John', email: 'john@example.com' },
      dbCollection,
    }).save();
    user2 = new UserModelClass({
      attrs: { name: 'Jane', email: 'jane@example.com' },
      dbCollection,
    }).save();
    userCollection = new ModelCollection(UserModel, [user1]);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(userCollection.collectionName).toBe('users');
      expect(Array.from(userCollection)).toStrictEqual([user1]);
      expect(userCollection.length).toBe(1);
    });
  });

  describe('array methods', () => {
    it('should use array-like methods', () => {
      // Test add (replacement for push)
      userCollection.add(user2);
      expect(Array.from(userCollection)).toStrictEqual([user1, user2]);

      // Test filter (returns new collection)
      const filtered = userCollection.filter((model) => model.name === 'John');
      expect(Array.from(filtered)).toStrictEqual([user1]);

      // Test includes (uses toString comparison)
      expect(userCollection.includes(user1)).toBe(true);
      expect(userCollection.includes(user2)).toBe(true);

      // Test slice (returns new collection)
      const sliced = userCollection.slice(0, 1);
      expect(Array.from(sliced)).toStrictEqual([user1]);

      // Test sort (returns new collection, doesn't mutate original)
      const sorted = userCollection.sort((a, b) => a.name.localeCompare(b.name));
      expect(Array.from(sorted)).toStrictEqual([user2, user1]); // Jane comes before John
      expect(Array.from(userCollection)).toStrictEqual([user1, user2]); // Original unchanged
    });
  });

  describe('collection-specific methods', () => {
    it('should add model to collection', () => {
      userCollection.add(user2);
      expect(Array.from(userCollection)).toStrictEqual([user1, user2]);
    });

    it('should destroy all models', () => {
      const originalDestroy = user1.destroy;
      let destroyCalled = false;
      user1.destroy = () => {
        destroyCalled = true;
        return originalDestroy.call(user1);
      };
      userCollection.destroy();
      expect(destroyCalled).toBe(true);
      expect(userCollection.length).toBe(0);
    });

    it('should reload all models', () => {
      const originalReload = user1.reload;
      let reloadCalled = false;
      user1.reload = function () {
        reloadCalled = true;
        return originalReload.call(this);
      };
      userCollection.reload();
      expect(reloadCalled).toBe(true);
    });

    it('should remove model from collection', () => {
      userCollection.remove(user1);
      expect(Array.from(userCollection)).toStrictEqual([]);
    });

    it('should save all models', () => {
      const originalSave = user1.save;
      let saveCalled = false;
      user1.save = function () {
        saveCalled = true;
        return originalSave.call(this);
      };
      userCollection.save();
      expect(saveCalled).toBe(true);
    });

    it('should update all models', () => {
      const originalUpdate = user1.update;
      let updateCalled = false;
      let updateArgs: any;
      user1.update = function (attrs: Partial<UserAttrs>) {
        updateCalled = true;
        updateArgs = attrs;
        return originalUpdate.call(this, attrs);
      };
      userCollection.update({ name: 'Updated' });
      expect(updateCalled).toBe(true);
      expect(updateArgs).toEqual({ name: 'Updated' });
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      expect(userCollection.toString()).toBe(`collection:users(${user1.toString()})`);
    });
  });

  describe('default string ID behavior', () => {
    it('should work with string IDs by default', () => {
      interface CommentAttrs {
        id: string;
        text: string;
        userId: string;
      }

      const CommentModel = model('comment', 'comments').attrs<CommentAttrs>().create();
      const CommentModelClass = defineModelClass(CommentModel);
      const commentDbCollection = new DbCollection<CommentAttrs>('comments');

      const comment1 = new CommentModelClass({
        attrs: { text: 'First comment', userId: '1' },
        dbCollection: commentDbCollection,
      }).save();
      const comment2 = new CommentModelClass({
        attrs: { text: 'Second comment', userId: '2' },
        dbCollection: commentDbCollection,
      }).save();
      const commentCollection = new ModelCollection(CommentModel, [comment1, comment2]);

      expect(commentCollection.length).toBe(2);
      expect(commentCollection.at(0)?.text).toBe('First comment');
      expect(commentCollection.at(1)?.text).toBe('Second comment');
      expect(typeof commentCollection.at(0)?.id).toBe('string');
      expect(typeof commentCollection.at(1)?.id).toBe('string');
    });
  });
});
