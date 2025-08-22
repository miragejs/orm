import { DbCollection } from '@src/db';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';

interface User {
  id: string;
  name: string;
  email?: string;
  age?: number;
  active?: boolean;
}

describe('DbCollection', () => {
  describe('constructor', () => {
    it('should initialize with name', () => {
      const collection = new DbCollection('users');
      expect(collection.name).toBe('users');
    });

    it('should initialize with initial data', () => {
      const initialData = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ];
      const collection = new DbCollection('users', { initialData });
      expect(collection.length).toBe(2);
      expect(collection.find('1')).toEqual({ id: '1', name: 'John' });
    });
  });

  describe('size', () => {
    it('should return correct number of records', () => {
      const collection = new DbCollection<User>('users');
      expect(collection.length).toBe(0);
      collection.insert({ name: 'John' });
      expect(collection.length).toBe(1);
    });
  });

  describe('records', () => {
    it('should return all records', () => {
      const collection = new DbCollection<User>('users');
      const record1 = collection.insert({ name: 'John' });
      const record2 = collection.insert({ name: 'Jane' });
      expect(collection.records).toEqual([record1, record2]);
    });
  });

  describe('first', () => {
    it('should return first record', () => {
      const collection = new DbCollection<User>('users');
      const record1 = collection.insert({ name: 'John' });
      expect(collection.first()).toEqual(record1);
    });

    it('should return null if collection is empty', () => {
      const collection = new DbCollection<User>('users');
      expect(collection.first()).toBeUndefined();
    });
  });

  describe('find', () => {
    let collection: DbCollection<User>;

    beforeEach(() => {
      collection = new DbCollection<User>('users');
      collection.insert({ name: 'John' });
      collection.insert({ name: 'Jane' });
    });

    it('should find record by single ID', () => {
      expect(collection.find('1')).toEqual({ id: '1', name: 'John' });
    });

    it('should return null for non-existent ID', () => {
      expect(collection.find('999')).toBeNull();
    });

    it('should find multiple records by IDs', () => {
      expect(collection.find('1', '2')).toEqual([
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ]);
    });
  });

  describe('findBy', () => {
    let collection: DbCollection<User>;

    beforeEach(() => {
      collection = new DbCollection<User>('users');
      collection.insert({ name: 'John', age: 30 });
      collection.insert({ name: 'Jane', age: 25 });
    });

    it('should find first matching record', () => {
      expect(collection.findBy({ name: 'John' })).toEqual({ id: '1', name: 'John', age: 30 });
    });

    it('should return null when no match found', () => {
      expect(collection.findBy({ name: 'Bob' })).toBeNull();
    });

    it('should match multiple attributes', () => {
      expect(collection.findBy({ name: 'John', age: 30 })).toEqual({
        id: '1',
        name: 'John',
        age: 30,
      });
    });
  });

  describe('where', () => {
    let collection: DbCollection<User>;

    beforeEach(() => {
      collection = new DbCollection<User>('users');
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
      const results = collection.where((record) => record.age! > 25);
      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'John', age: 30 }),
          expect.objectContaining({ name: 'Bob', age: 30 }),
        ]),
      );
    });
  });

  describe('insert', () => {
    it('should insert record with generated ID', () => {
      const collection = new DbCollection<User>('users');
      const record = collection.insert({ name: 'John' });
      expect(record).toEqual({ id: '1', name: 'John' });
      expect(collection.find('1')).toEqual(record);
    });

    it('should insert record with provided ID', () => {
      const collection = new DbCollection<User>('users');
      const record = collection.insert({ id: '5', name: 'John' });
      expect(record).toEqual({ id: '5', name: 'John' });
      expect(collection.find('5')).toEqual(record);
    });
  });

  describe('insertMany', () => {
    it('should insert multiple records', () => {
      const collection = new DbCollection<User>('users');
      const records = collection.insertMany([{ name: 'John' }, { name: 'Jane' }]);
      expect(records).toHaveLength(2);
      expect(collection.length).toBe(2);
    });
  });

  describe('update', () => {
    let collection: DbCollection<User>;

    beforeEach(() => {
      collection = new DbCollection<User>('users');
      collection.insert({ name: 'John', age: 30 });
      collection.insert({ name: 'Jane', age: 25 });
    });

    it('should update record by ID', () => {
      const updated = collection.update('1', { age: 31 });
      expect(updated).toEqual({ id: '1', name: 'John', age: 31 });
    });

    it('should update record by query', () => {
      const updated = collection.update({ name: 'John' }, { age: 31 });
      expect(updated).toEqual([{ id: '1', name: 'John', age: 31 }]);
    });

    it('should update all records when only attrs provided', () => {
      const updated = collection.update({ active: true });
      expect(updated).toHaveLength(2);
      expect(updated).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: '1', active: true }),
          expect.objectContaining({ id: '2', active: true }),
        ]),
      );
    });
  });

  describe('remove', () => {
    let collection: DbCollection<User>;

    beforeEach(() => {
      collection = new DbCollection<User>('users');
      collection.insert({ name: 'John' });
      collection.insert({ name: 'Jane' });
    });

    it('should remove record by ID', () => {
      collection.remove('1');
      expect(collection.length).toBe(1);
      expect(collection.find('1')).toBeNull();
    });

    it('should remove records by query', () => {
      collection.removeWhere({ name: 'John' });
      expect(collection.length).toBe(1);
      expect(collection.find('1')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all records', () => {
      const collection = new DbCollection<User>('users');
      collection.insert({ name: 'John' });
      collection.insert({ name: 'Jane' });
      collection.clear();
      expect(collection.length).toBe(0);
    });
  });
});

describe('DbCollection Types', () => {
  describe('Default string ID behavior', () => {
    it('should use string IDs by default', () => {
      const users = new DbCollection<User>('users');

      // Insert a user with auto-generated string ID
      const user = users.insert({ name: 'John', email: 'john@example.com' });
      expect(typeof user.id).toBe('string');
      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');

      // Find by string ID
      const found = users.find(user.id);
      expect(found).toEqual(user);
    });
  });

  describe('Number ID behavior when explicitly typed', () => {
    it('should work with number IDs when explicitly typed', () => {
      interface CommentAttrs {
        id: number;
        text: string;
        userId: number;
      }

      const comments = new DbCollection<CommentAttrs>('comments', {
        identityManager: new NumberIdentityManager(),
      });
      const comment = comments.insert({ text: 'Great post!', userId: 1 });

      expect(typeof comment.id).toBe('number');
      expect(comment.text).toBe('Great post!');
      expect(comment.userId).toBe(1);
    });
  });

  describe('Custom string ID behavior', () => {
    it('should work with custom string IDs', () => {
      const users = new DbCollection<User>('users', {
        identityManager: new StringIdentityManager({
          initialCounter: 'user-1',
          idGenerator: (currentId: string) => {
            const num = parseInt(currentId.split('-')[1]);
            return `user-${num + 1}`;
          },
        }),
      });

      // Insert a user with custom string ID
      const user = users.insert({ name: 'John', email: 'john@example.com' });
      expect(user.id).toBe('user-1');
      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');

      // Find by string ID
      const found = users.find('user-1');
      expect(found).toEqual(user);
    });
  });
});
