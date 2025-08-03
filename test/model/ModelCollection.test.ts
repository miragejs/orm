import { DbCollection } from '@src/db';
import { ModelCollection, defineModel, type ModelAttrs, type SavedModelInstance } from '@src/model';

interface UserAttrs extends ModelAttrs<string> {
  email: string;
  name: string;
}

const UserModel = defineModel<UserAttrs>();

describe('ModelCollection', () => {
  let collection: DbCollection<UserAttrs>;
  let modelCollection: ModelCollection<UserAttrs>;
  let user1: SavedModelInstance<UserAttrs>;
  let user2: SavedModelInstance<UserAttrs>;

  beforeEach(() => {
    collection = new DbCollection<UserAttrs>({
      name: 'users',
    });

    user1 = new UserModel({
      name: 'user',
      attrs: { name: 'John', email: 'john@example.com' },
      collection,
    }).save();
    user2 = new UserModel({
      name: 'user',
      attrs: { name: 'Jane', email: 'jane@example.com' },
      collection,
    }).save();

    modelCollection = new ModelCollection<UserAttrs>({
      collectionName: 'users',
      models: [user1],
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(modelCollection.collectionName).toBe('users');
      expect(Array.from(modelCollection)).toStrictEqual([user1]);
      expect(modelCollection.length).toBe(1);
    });
  });

  describe('array methods', () => {
    it('should use native array methods', () => {
      // Test push
      modelCollection.push(user2);
      expect(Array.from(modelCollection)).toStrictEqual([user1, user2]);

      // Test filter
      const filtered = modelCollection.filter((model) => model.name === 'John');
      expect(Array.from(filtered)).toStrictEqual([user1]);

      // Test includes
      expect(modelCollection.includes(user1)).toBe(true);
      expect(modelCollection.includes(user2)).toBe(true);

      // Test slice
      const sliced = modelCollection.slice(0, 1);
      expect(Array.from(sliced)).toStrictEqual([user1]);

      // Test sort
      modelCollection.sort((a, b) => a.name.localeCompare(b.name));
      expect(Array.from(modelCollection)).toStrictEqual([user2, user1]); // Jane comes before John
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
      user1.update = function (attrs: Partial<UserAttrs & { id: string }>) {
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
      interface CommentAttrs extends ModelAttrs {
        text: string;
        userId: string;
      }

      const CommentModel = defineModel<CommentAttrs>();
      const commentCollection = new DbCollection<CommentAttrs>({ name: 'comments' });

      const comment1 = new CommentModel({
        name: 'Comment',
        attrs: { text: 'First comment', userId: '1' },
        collection: commentCollection,
      }).save();

      const comment2 = new CommentModel({
        name: 'Comment',
        attrs: { text: 'Second comment', userId: '2' },
        collection: commentCollection,
      }).save();

      const commentModelCollection = new ModelCollection<CommentAttrs>({
        collectionName: 'comment',
        models: [comment1, comment2],
      });

      expect(commentModelCollection.length).toBe(2);
      expect(commentModelCollection[0].text).toBe('First comment');
      expect(commentModelCollection[1].text).toBe('Second comment');
      expect(typeof commentModelCollection[0].id).toBe('string');
      expect(typeof commentModelCollection[1].id).toBe('string');
    });
  });
});
