import { DbCollection } from '@src/db';
import BaseModel, { type ModelAttrs, type ModelInstance } from '@src/model/BaseModel';

interface UserAttrs extends ModelAttrs<number> {
  name: string;
  email: string;
}

describe('BaseModel', () => {
  let model: ModelInstance<UserAttrs>;
  let collection: DbCollection<number, UserAttrs>;

  beforeEach(() => {
    collection = new DbCollection<number, UserAttrs>({ name: 'users' });
    model = new BaseModel<UserAttrs>({
      name: 'User',
      attrs: { name: 'John', email: 'john@example.com' },
      collection,
    }) as ModelInstance<UserAttrs>;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(model.attrs).toEqual({ name: 'John', email: 'john@example.com', id: null });
      expect(model.modelName).toBe('user');
      expect(model.isNew()).toBe(true);
    });

    it('should create a new collection if not provided', () => {
      const model = new BaseModel<UserAttrs>({
        name: 'User',
        attrs: { name: 'John', email: 'john@example.com' },
      });
      expect(model.attrs).toBeDefined();
    });
  });

  describe('attribute access', () => {
    it('should provide getters and setters for attributes', () => {
      expect(model.name).toBe('John');
      expect(model.email).toBe('john@example.com');

      model.name = 'Jane';
      expect(model.name).toBe('Jane');
      expect(model.attrs.name).toBe('Jane');
    });

    it('should not allow id modification', () => {
      expect(() => {
        (model as any).id = 1;
      }).toThrow();
    });
  });

  describe('save', () => {
    it('should insert new record', () => {
      model.save();
      expect(model.isSaved()).toBe(true);
      expect(model.id).toBeDefined();
    });

    it('should update existing record', () => {
      model.save();
      const id = model.id;
      model.name = 'Jane';
      model.save();
      expect(model.id).toBe(id);
    });
  });

  describe('update', () => {
    it('should update attributes and save', () => {
      model.save();
      model.update({ name: 'Jane' });
      expect(model.name).toBe('Jane');
      expect(model.isSaved()).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should remove record from collection', () => {
      model.save();
      const id = model.id as number;
      model.destroy();
      expect(collection.find(id)).toBeNull();
    });
  });

  describe('reload', () => {
    it('should reload attributes from collection', () => {
      model.save();
      const id = model.id as number;
      collection.update(id, { name: 'Jane', email: 'jane@example.com' });
      model.reload();
      expect(model.name).toBe('Jane');
      expect(model.email).toBe('jane@example.com');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      model.save();
      const json = model.toJSON();
      expect(json).toEqual({
        id: model.id,
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should convert to string', () => {
      model.save();
      expect(model.toString()).toBe(`model:user(${model.id})`);
    });
  });
});
