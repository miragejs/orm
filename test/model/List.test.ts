import { DbCollection } from '@src/db';
import { List, Model, type ModelAttrs } from '@src/model';

interface UserAttrs extends ModelAttrs<number> {
  email: string;
  name: string;
}

const UserModel = Model.define<UserAttrs>();

describe('List', () => {
  let collection: DbCollection<number, UserAttrs>;
  let list: List<UserAttrs>;
  let user1: InstanceType<typeof UserModel>;
  let user2: InstanceType<typeof UserModel>;

  beforeEach(() => {
    collection = new DbCollection<number, UserAttrs>({
      name: 'users',
    });
    user1 = new UserModel({
      attrs: { name: 'John', email: 'john@example.com' },
      collection,
      name: 'user',
    });
    user2 = new UserModel({
      attrs: { name: 'Jane', email: 'jane@example.com' },
      collection,
      name: 'user',
    });
    list = new List<UserAttrs>({
      modelName: 'user',
      models: [user1],
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(list.modelName).toBe('user');
      expect(Array.from(list)).toStrictEqual([user1]);
      expect(list.length).toBe(1);
    });
  });

  describe('array methods', () => {
    it('should use native array methods', () => {
      // Test push
      list.push(user2);
      expect(Array.from(list)).toStrictEqual([user1, user2]);

      // Test filter
      const filtered = list.filter((model) => model.name === 'John');
      expect(Array.from(filtered)).toStrictEqual([user1]);

      // Test includes
      expect(list.includes(user1)).toBe(true);
      expect(list.includes(user2)).toBe(true);

      // Test slice
      const sliced = list.slice(0, 1);
      expect(Array.from(sliced)).toStrictEqual([user1]);

      // Test sort
      list.sort((a, b) => a.name.localeCompare(b.name));
      expect(Array.from(list)).toStrictEqual([user2, user1]); // Jane comes before John
    });
  });

  describe('list-specific methods', () => {
    it('should add model to list', () => {
      list.add(user2);
      expect(Array.from(list)).toStrictEqual([user1, user2]);
    });

    it('should destroy all models', () => {
      const originalDestroy = user1.destroy;
      let destroyCalled = false;
      user1.destroy = () => {
        destroyCalled = true;
        originalDestroy.call(user1);
      };
      list.destroy();
      expect(destroyCalled).toBe(true);
      expect(list.length).toBe(0);
    });

    it('should reload all models', () => {
      user1.save(); // Ensure model is saved before reload
      const originalReload = user1.reload;
      let reloadCalled = false;
      user1.reload = function () {
        reloadCalled = true;
        return originalReload.call(this);
      };
      list.reload();
      expect(reloadCalled).toBe(true);
    });

    it('should remove model from list', () => {
      user1.save(); // Ensure model is saved before removal
      list.remove(user1);
      expect(Array.from(list)).toStrictEqual([]);
    });

    it('should save all models', () => {
      const originalSave = user1.save;
      let saveCalled = false;
      user1.save = function () {
        saveCalled = true;
        return originalSave.call(this);
      };
      list.save();
      expect(saveCalled).toBe(true);
    });

    it('should update all models', () => {
      user1.save(); // Ensure model is saved before update
      const originalUpdate = user1.update;
      let updateCalled = false;
      let updateArgs: any;
      user1.update = function (attrs) {
        updateCalled = true;
        updateArgs = attrs;
        return originalUpdate.call(this, attrs);
      };
      list.update({ name: 'Updated' });
      expect(updateCalled).toBe(true);
      expect(updateArgs).toEqual({ name: 'Updated' });
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      user1.save(); // Ensure model is saved before string conversion
      expect(list.toString()).toBe(`list:user(${user1.toString()})`);
    });
  });
});
