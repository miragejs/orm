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
  describe('Constructor', () => {
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
      expect(collection.size).toBe(2);
      expect(collection.find('1')).toEqual({ id: '1', name: 'John' });
    });
  });

  describe('Records Accessor', () => {
    describe('all', () => {
      it('should return all records', () => {
        const collection = new DbCollection<User>('users');
        const record1 = collection.insert({ name: 'John' });
        const record2 = collection.insert({ name: 'Jane' });
        expect(collection.all()).toEqual([record1, record2]);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('size', () => {
      it('should return correct number of records', () => {
        const collection = new DbCollection<User>('users');
        expect(collection.size).toBe(0);
        collection.insert({ name: 'John' });
        expect(collection.size).toBe(1);
      });
    });

    describe('get', () => {
      it('should get record by index', () => {
        const collection = new DbCollection<User>('users');
        const record1 = collection.insert({ name: 'John' });
        const record2 = collection.insert({ name: 'Jane' });
        expect(collection.get(0)).toEqual(record1);
        expect(collection.get(1)).toEqual(record2);
        expect(collection.get(2)).toBeUndefined();
      });
    });

    describe('has', () => {
      it('should check if record exists', () => {
        const collection = new DbCollection<User>('users');
        collection.insert({ id: 'test', name: 'John' });
        expect(collection.has('test')).toBe(true);
        expect(collection.has('nonexistent')).toBe(false);
      });
    });

    describe('first', () => {
      it('should return first record', () => {
        const collection = new DbCollection<User>('users');
        const record1 = collection.insert({ name: 'John' });
        expect(collection.first()).toEqual(record1);
      });

      it('should return undefined if collection is empty', () => {
        const collection = new DbCollection<User>('users');
        expect(collection.first()).toBeUndefined();
      });
    });

    describe('last', () => {
      it('should return last record', () => {
        const collection = new DbCollection<User>('users');
        collection.insert({ name: 'John' });
        const record2 = collection.insert({ name: 'Jane' });
        expect(collection.last()).toEqual(record2);
      });

      it('should return undefined if collection is empty', () => {
        const collection = new DbCollection<User>('users');
        expect(collection.last()).toBeUndefined();
      });
    });

    describe('isEmpty', () => {
      it('should return true for empty collection', () => {
        const collection = new DbCollection<User>('users');
        expect(collection.isEmpty).toBe(true);
        collection.insert({ name: 'John' });
        expect(collection.isEmpty).toBe(false);
      });
    });
  });

  describe('Query Methods', () => {
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

      it('should find first matching record by query object', () => {
        expect(collection.find({ name: 'John' })).toEqual({ id: '1', name: 'John' });
      });

      it('should find first matching record by predicate function', () => {
        const result = collection.find((record) => record.name === 'Jane');
        expect(result).toEqual({ id: '2', name: 'Jane' });
      });

      it('should return null when no match found with query', () => {
        expect(collection.find({ name: 'Bob' })).toBeNull();
      });
    });

    describe('findMany', () => {
      let collection: DbCollection<User>;

      beforeEach(() => {
        collection = new DbCollection<User>('users');
        collection.insert({ name: 'John', age: 30 });
        collection.insert({ name: 'Jane', age: 25 });
        collection.insert({ name: 'Bob', age: 30 });
      });

      it('should find multiple records by IDs', () => {
        expect(collection.findMany(['1', '2'])).toEqual([
          { id: '1', name: 'John', age: 30 },
          { id: '2', name: 'Jane', age: 25 },
        ]);
      });

      it('should find records matching query object', () => {
        const results = collection.findMany({ age: 30 });
        expect(results).toHaveLength(2);
        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'John', age: 30 }),
            expect.objectContaining({ name: 'Bob', age: 30 }),
          ]),
        );
      });

      it('should find records using predicate function', () => {
        const results = collection.findMany((record) => record.age! > 25);
        expect(results).toHaveLength(2);
        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'John', age: 30 }),
            expect.objectContaining({ name: 'Bob', age: 30 }),
          ]),
        );
      });

      it('should return empty array when no IDs match', () => {
        expect(collection.findMany(['999', '998'])).toEqual([]);
      });

      it('should return empty array when no query matches', () => {
        expect(collection.findMany({ name: 'NonExistent' })).toEqual([]);
      });
    });
  });

  describe('Mutation Methods', () => {
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
        expect(collection.size).toBe(2);
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

      it('should return null when updating non-existent ID', () => {
        const updated = collection.update('999', { age: 31 });
        expect(updated).toBeNull();
      });
    });

    describe('updateMany', () => {
      let collection: DbCollection<User>;

      beforeEach(() => {
        collection = new DbCollection<User>('users');
        collection.insert({ name: 'John', age: 30 });
        collection.insert({ name: 'Jane', age: 25 });
        collection.insert({ name: 'Bob', age: 30 });
      });

      it('should update multiple records by IDs', () => {
        const updated = collection.updateMany(['1', '2'], { active: true });
        expect(updated).toHaveLength(2);
        expect(updated).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: '1', active: true }),
            expect.objectContaining({ id: '2', active: true }),
          ]),
        );
      });

      it('should update records by query object', () => {
        const updated = collection.updateMany({ age: 30 }, { active: true });
        expect(updated).toHaveLength(2);
        expect(updated).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'John', active: true }),
            expect.objectContaining({ name: 'Bob', active: true }),
          ]),
        );
      });

      it('should update records by predicate function', () => {
        const updated = collection.updateMany((record) => record.age! > 25, { active: true });
        expect(updated).toHaveLength(2);
        expect(updated).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'John', active: true }),
            expect.objectContaining({ name: 'Bob', active: true }),
          ]),
        );
      });

      it('should return empty array when no records match', () => {
        const updated = collection.updateMany({ name: 'NonExistent' }, { active: true });
        expect(updated).toEqual([]);
      });
    });

    describe('delete', () => {
      let collection: DbCollection<User>;

      beforeEach(() => {
        collection = new DbCollection<User>('users');
        collection.insert({ name: 'John' });
        collection.insert({ name: 'Jane' });
      });

      it('should delete record by ID', () => {
        const result = collection.delete('1');
        expect(result).toBe(true);
        expect(collection.size).toBe(1);
        expect(collection.find('1')).toBeNull();
      });

      it('should return false when deleting non-existent ID', () => {
        const result = collection.delete('999');
        expect(result).toBe(false);
        expect(collection.size).toBe(2);
      });
    });

    describe('deleteMany', () => {
      let collection: DbCollection<User>;

      beforeEach(() => {
        collection = new DbCollection<User>('users');
        collection.insert({ name: 'John', age: 30 });
        collection.insert({ name: 'Jane', age: 25 });
        collection.insert({ name: 'Bob', age: 30 });
      });

      it('should delete multiple records by IDs', () => {
        const deletedCount = collection.deleteMany(['1', '2']);
        expect(deletedCount).toBe(2);
        expect(collection.size).toBe(1);
        expect(collection.find('1')).toBeNull();
        expect(collection.find('2')).toBeNull();
      });

      it('should delete records by query object', () => {
        const deletedCount = collection.deleteMany({ age: 30 });
        expect(deletedCount).toBe(2);
        expect(collection.size).toBe(1);
        expect(collection.find('2')).toEqual({ id: '2', name: 'Jane', age: 25 });
      });

      it('should delete records by predicate function', () => {
        const deletedCount = collection.deleteMany((record) => record.age! > 25);
        expect(deletedCount).toBe(2);
        expect(collection.size).toBe(1);
        expect(collection.find('2')).toEqual({ id: '2', name: 'Jane', age: 25 });
      });

      it('should return 0 when no records match', () => {
        const deletedCount = collection.deleteMany({ name: 'NonExistent' });
        expect(deletedCount).toBe(0);
        expect(collection.size).toBe(3);
      });
    });

    describe('clear', () => {
      it('should remove all records', () => {
        const collection = new DbCollection<User>('users');
        collection.insert({ name: 'John' });
        collection.insert({ name: 'Jane' });
        collection.clear();
        expect(collection.size).toBe(0);
      });
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
