import { DbCollection } from '@src/db';
import BaseModel, { type ModelAttrs } from '@src/model/BaseModel';

interface UserAttrs extends ModelAttrs<number> {
  name: string;
  email: string;
}

describe('BaseModel', () => {
  let model: BaseModel<UserAttrs>;
  let collection: DbCollection<number, UserAttrs>;

  beforeEach(() => {
    collection = new DbCollection<number, UserAttrs>({ name: 'users' });
    model = new BaseModel<UserAttrs>({
      name: 'User',
      attrs: { name: 'John', email: 'john@example.com' },
      collection,
    });
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

  describe('core functionality', () => {
    it('should provide id getter', () => {
      expect(model.id).toBeNull();
      model.attrs.id = 1;
      expect(model.id).toBe(1);
    });

    it('should handle save operation', () => {
      model.save();
      expect(model.isSaved()).toBe(true);
      expect(model.id).toBeDefined();
    });

    it('should handle update operation', () => {
      model.save();
      const id = model.id;
      model.attrs.name = 'Jane';
      model.save();
      expect(model.id).toBe(id);
      expect(model.attrs.name).toBe('Jane');
    });

    it('should handle destroy operation', () => {
      model.save();
      const id = model.id as number;
      model.destroy();
      expect(collection.find(id)).toBeNull();
    });

    it('should handle reload operation', () => {
      model.save();
      const id = model.id as number;
      collection.update(id, { name: 'Jane', email: 'jane@example.com' });
      model.reload();
      expect(model.attrs.name).toBe('Jane');
      expect(model.attrs.email).toBe('jane@example.com');
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
