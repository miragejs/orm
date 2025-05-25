import { DbCollection } from '@src/db';

describe('DbCollection', () => {
  describe('constructor', () => {
    it('should initialize with name', () => {
      const collection = new DbCollection({ name: 'users' });
      expect(collection.name).toBe('users');
    });

    it('should initialize with initial data', () => {
      const initialData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];
      const collection = new DbCollection({ name: 'users', initialData });
      expect(collection.size).toBe(2);
      expect(collection.find(1)).toEqual({ id: 1, name: 'John' });
    });
  });

  describe('size', () => {
    it('should return correct number of records', () => {
      const collection = new DbCollection({ name: 'users' });
      expect(collection.size).toBe(0);
      collection.insert({ name: 'John' });
      expect(collection.size).toBe(1);
    });
  });

  describe('all', () => {
    it('should return all records', () => {
      const collection = new DbCollection({ name: 'users' });
      const record1 = collection.insert({ name: 'John' });
      const record2 = collection.insert({ name: 'Jane' });
      expect(collection.all()).toEqual([record1, record2]);
    });
  });

  describe('find', () => {
    let collection: DbCollection;

    beforeEach(() => {
      collection = new DbCollection({ name: 'users' });
      collection.insert({ name: 'John' });
      collection.insert({ name: 'Jane' });
    });

    it('should find record by single ID', () => {
      expect(collection.find(1)).toEqual({ id: 1, name: 'John' });
    });

    it('should return null for non-existent ID', () => {
      expect(collection.find(999)).toBeNull();
    });

    it('should find multiple records by IDs', () => {
      expect(collection.find(1, 2)).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]);
    });
  });

  describe('findBy', () => {
    let collection: DbCollection;

    beforeEach(() => {
      collection = new DbCollection({ name: 'users' });
      collection.insert({ name: 'John', age: 30 });
      collection.insert({ name: 'Jane', age: 25 });
    });

    it('should find first matching record', () => {
      expect(collection.findBy({ name: 'John' })).toEqual({ id: 1, name: 'John', age: 30 });
    });

    it('should return null when no match found', () => {
      expect(collection.findBy({ name: 'Bob' })).toBeNull();
    });

    it('should match multiple attributes', () => {
      expect(collection.findBy({ name: 'John', age: 30 })).toEqual({
        id: 1,
        name: 'John',
        age: 30,
      });
    });
  });

  describe('where', () => {
    let collection: DbCollection;

    beforeEach(() => {
      collection = new DbCollection({ name: 'users' });
      collection.insert({ name: 'John', age: 30 });
      collection.insert({ name: 'Jane', age: 25 });
      collection.insert({ name: 'Bob', age: 30 });
    });

    it('should find records matching query object', () => {
      const results = collection.where({ age: 30 });
      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'John', age: 30 }),
          expect.objectContaining({ name: 'Bob', age: 30 }),
        ]),
      );
    });

    it('should find records using predicate function', () => {
      const results = collection.where((record) => record.age > 25);
      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'John', age: 30 }),
          expect.objectContaining({ name: 'Bob', age: 30 }),
        ]),
      );
    });
  });

  describe('firstOrCreate', () => {
    let collection: DbCollection;

    beforeEach(() => {
      collection = new DbCollection({ name: 'users' });
    });

    it('should return existing record if found', () => {
      const existing = collection.insert({ name: 'John' });
      const result = collection.firstOrCreate({ name: 'John' });
      expect(result).toEqual(existing);
    });

    it('should create new record if not found', () => {
      const result = collection.firstOrCreate({ name: 'John' }, { name: 'John', age: 30 });
      expect(result).toEqual({ id: 1, name: 'John', age: 30 });
    });
  });

  describe('insert', () => {
    it('should insert record with generated ID', () => {
      const collection = new DbCollection({ name: 'users' });
      const record = collection.insert({ name: 'John' });
      expect(record).toEqual({ id: 1, name: 'John' });
      expect(collection.find(1)).toEqual(record);
    });

    it('should insert record with provided ID', () => {
      const collection = new DbCollection({ name: 'users' });
      const record = collection.insert({ id: 5, name: 'John' });
      expect(record).toEqual({ id: 5, name: 'John' });
      expect(collection.find(5)).toEqual(record);
    });
  });

  describe('insertMany', () => {
    it('should insert multiple records', () => {
      const collection = new DbCollection({ name: 'users' });
      const records = collection.insertMany([{ name: 'John' }, { name: 'Jane' }]);
      expect(records).toHaveLength(2);
      expect(collection.size).toBe(2);
    });
  });

  describe('update', () => {
    let collection: DbCollection;

    beforeEach(() => {
      collection = new DbCollection({ name: 'users' });
      collection.insert({ name: 'John', age: 30 });
      collection.insert({ name: 'Jane', age: 25 });
    });

    it('should update record by ID', () => {
      const updated = collection.update(1, { age: 31 });
      expect(updated).toEqual({ id: 1, name: 'John', age: 31 });
    });

    it('should update record by query', () => {
      const updated = collection.update({ name: 'John' }, { age: 31 });
      expect(updated).toEqual({ id: 1, name: 'John', age: 31 });
    });

    it('should update all records when only attrs provided', () => {
      const updated = collection.update({ active: true });
      expect(updated).toHaveLength(2);
      expect(updated).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, active: true }),
          expect.objectContaining({ id: 2, active: true }),
        ]),
      );
    });
  });

  describe('remove', () => {
    let collection: DbCollection;

    beforeEach(() => {
      collection = new DbCollection({ name: 'users' });
      collection.insert({ name: 'John' });
      collection.insert({ name: 'Jane' });
    });

    it('should remove record by ID', () => {
      collection.remove(1);
      expect(collection.size).toBe(1);
      expect(collection.find(1)).toBeNull();
    });

    it('should remove records by query', () => {
      collection.remove({ name: 'John' });
      expect(collection.size).toBe(1);
      expect(collection.find(1)).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all records', () => {
      const collection = new DbCollection({ name: 'users' });
      collection.insert({ name: 'John' });
      collection.insert({ name: 'Jane' });
      collection.clear();
      expect(collection.size).toBe(0);
    });
  });
});
