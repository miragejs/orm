import Collection from '@src/collection/Collection';
import { type ModelAttrs } from '@src/model/BaseModel';
import { createModelInstance } from '@src/model/BaseModel';

interface UserAttrs extends ModelAttrs<number> {
  name: string;
  email: string;
}

describe('Collection', () => {
  let collection: Collection<UserAttrs>;
  let user1: ReturnType<typeof createModelInstance<UserAttrs>>;
  let user2: ReturnType<typeof createModelInstance<UserAttrs>>;

  beforeEach(() => {
    user1 = createModelInstance<UserAttrs>({
      name: 'user',
      attrs: { name: 'John', email: 'john@example.com' },
    });
    user2 = createModelInstance<UserAttrs>({
      name: 'user',
      attrs: { name: 'Jane', email: 'jane@example.com' },
    });
    collection = new Collection<UserAttrs>({
      modelName: 'user',
      models: [user1],
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(collection.modelName).toBe('user');
      expect(collection.models).toEqual([user1]);
      expect(collection.length).toBe(1);
    });

    it('should throw error if modelName is not provided', () => {
      expect(() => {
        new Collection<UserAttrs>({ modelName: '' });
      }).toThrow('You must pass a `modelName` into a Collection');
    });
  });

  describe('array-like methods', () => {
    it('should concatenate collections', () => {
      const otherCollection = new Collection<UserAttrs>({
        modelName: 'user',
        models: [user2],
      });
      collection.concat(otherCollection);
      expect(collection.models).toEqual([user1, user2]);
    });

    it('should filter models', () => {
      collection.push(user2);
      collection.filter((model) => model.name === 'John');
      expect(collection.models).toEqual([user1]);
    });

    it('should check if model is included', () => {
      collection.save();
      expect(collection.includes(user1)).toBe(true);
      expect(collection.includes(user2)).toBe(false);
    });

    it('should push model to collection', () => {
      collection.push(user2);
      expect(collection.models).toEqual([user1, user2]);
    });

    it('should slice models', () => {
      collection.push(user2);
      collection.slice(0, 1);
      expect(collection.models).toEqual([user1]);
    });

    it('should sort models', () => {
      collection.push(user2);
      collection.sort((a, b) => a.name.localeCompare(b.name));
      expect(collection.models).toEqual([user2, user1]); // Jane comes before John
    });
  });

  describe('collection-specific methods', () => {
    it('should add model to collection', () => {
      collection.add(user2);
      expect(collection.models).toEqual([user1, user2]);
    });

    it('should destroy all models', () => {
      const originalDestroy = user1.destroy;
      let destroyCalled = false;
      user1.destroy = () => {
        destroyCalled = true;
        originalDestroy.call(user1);
      };
      collection.destroy();
      expect(destroyCalled).toBe(true);
    });

    it('should merge collections', () => {
      const otherCollection = new Collection<UserAttrs>({
        modelName: 'user',
        models: [user2],
      });
      collection.mergeCollection(otherCollection);
      expect(collection.models).toEqual([user1, user2]);
    });

    it('should reload all models', () => {
      const originalReload = user1.reload;
      let reloadCalled = false;
      user1.reload = function () {
        reloadCalled = true;
        return originalReload.call(this);
      };
      collection.reload();
      expect(reloadCalled).toBe(true);
    });

    it('should remove model from collection', () => {
      collection.remove(user1);
      expect(collection.models).toEqual([]);
    });

    it('should save all models', () => {
      const originalSave = user1.save;
      let saveCalled = false;
      user1.save = function () {
        saveCalled = true;
        return originalSave.call(this);
      };
      collection.save();
      expect(saveCalled).toBe(true);
    });

    it('should update all models', () => {
      const originalUpdate = user1.update;
      let updateCalled = false;
      let updateArgs: any;
      user1.update = function (attrs) {
        updateCalled = true;
        updateArgs = attrs;
        return originalUpdate.call(this, attrs);
      };
      collection.update({ name: 'Updated' });
      expect(updateCalled).toBe(true);
      expect(updateArgs).toEqual({ name: 'Updated' });
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      expect(collection.toString()).toBe(`collection:user(${user1.toString()})`);
    });
  });
});
