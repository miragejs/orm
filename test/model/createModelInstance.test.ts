import { DbCollection } from '@src/db';
import { createModelInstance, type ModelAttrs, type ModelInstance } from '@src/model/BaseModel';

interface UserAttrs extends ModelAttrs<number> {
  email?: string;
  id: number;
  name?: string;
}

describe('createModelInstance', () => {
  describe('basic attribute accessors', () => {
    let model: ModelInstance<UserAttrs>;
    let collection: DbCollection<number, UserAttrs>;

    beforeEach(() => {
      collection = new DbCollection<number, UserAttrs>({ name: 'users' });
      model = createModelInstance<UserAttrs>({
        attrs: {
          email: 'john@example.com',
          id: 1,
          name: 'John',
        },
        collection,
        name: 'User',
      });
    });

    it('should provide getters and setters for attributes', () => {
      expect(model.name).toBe('John');
      expect(model.email).toBe('john@example.com');

      model.name = 'Jane';

      expect(model.name).toBe('Jane');
      expect(model.attrs.name).toBe('Jane');
    });

    it('should not allow id modification through accessor', () => {
      expect(() => {
        (model as any).id = 1;
      }).toThrow();
    });

    it('should maintain accessors after save', () => {
      model.save();
      model.name = 'Jane';

      expect(model.name).toBe('Jane');
      expect(model.attrs.name).toBe('Jane');
    });

    it('should maintain accessors after reload', () => {
      model.save();
      const id = model.id;

      collection.update(id, { name: 'Jane', email: 'jane@example.com' });
      model.reload();

      expect(model.name).toBe('Jane');
      expect(model.email).toBe('jane@example.com');
    });
  });

  describe('dynamic attribute management', () => {
    let model: ModelInstance<UserAttrs>;
    let collection: DbCollection<number, UserAttrs>;

    beforeEach(() => {
      collection = new DbCollection<number, UserAttrs>({ name: 'users' });
      model = createModelInstance<UserAttrs>({
        attrs: { id: 1 },
        collection,
        name: 'User',
      });
      model.save();
    });

    it('should handle attribute addition during update', () => {
      model.update({ name: 'John' });
      expect(model.name).toBe('John');
      expect(model.email).toBeUndefined();

      model.update({ email: 'john@example.com' });
      expect(model.name).toBe('John');
      expect(model.email).toBe('john@example.com');

      expect(() => {
        model.name = 'Jane';
        model.email = 'jane@example.com';
      }).not.toThrow();
    });

    it('should handle attribute removal during update', () => {
      model.update({ name: 'John', email: 'john@example.com' });
      expect(model.name).toBe('John');
      expect(model.email).toBe('john@example.com');

      model.update({ name: 'Jane', email: undefined });
      expect(model.name).toBe('Jane');
      expect(model.email).toBeUndefined();

      expect(() => {
        model.email = 'new@example.com';
      }).not.toThrow();
    });

    it('should handle attribute changes during reload', () => {
      model.update({ name: 'John', email: 'john@example.com' });
      expect(model.name).toBe('John');
      expect(model.email).toBe('john@example.com');
      expect(model.age).toBeUndefined();

      collection.update(model.id, { name: 'Jane', age: 25 });
      model.reload();

      expect(model.name).toBe('Jane');
      expect(model.email).toBe('john@example.com');
      expect(model.age).toBe(25);

      expect(() => {
        model.age = 26;
      }).not.toThrow();
    });

    it('should preserve class methods while managing accessors', () => {
      model.update({ name: 'John' });
      model.update({ email: 'john@example.com' });
      model.update({ name: 'Jane', age: 25 });

      expect(model.isSaved()).toBe(true);
      expect(model.toString()).toBe('model:user(1)');
      expect(model.toJSON()).toEqual({
        age: 25,
        email: 'john@example.com',
        id: 1,
        name: 'Jane',
      });
    });
  });
});
