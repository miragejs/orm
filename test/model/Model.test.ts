import { DbCollection } from '@src/db';
import { Model, type ModelAttrs } from '@src/model';

interface UserAttrs extends ModelAttrs<number> {
  name: string;
  email: string;
}

const UserModel = Model.define<UserAttrs>();

describe('Model', () => {
  let collection: DbCollection<number, UserAttrs>;

  beforeEach(() => {
    collection = new DbCollection<number, UserAttrs>({ name: 'users' });
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
});
