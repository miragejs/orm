import { DbCollection } from '@src/db';
import { NumberIdentityManager, StringIdentityManager } from '@src/id-manager';

// Setup test models
interface UserAttrs {
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

  describe('Records accessor', () => {
    describe('all', () => {
      it('should return all records', () => {
        const collection = new DbCollection<UserAttrs>('users');
        const record1 = collection.insert({ name: 'John' });
        const record2 = collection.insert({ name: 'Jane' });
        expect(collection.all()).toEqual([record1, record2]);
      });
    });
  });

  describe('Utility methods', () => {
    describe('size', () => {
      it('should return correct number of records', () => {
        const collection = new DbCollection<UserAttrs>('users');
        expect(collection.size).toBe(0);
        collection.insert({ name: 'John' });
        expect(collection.size).toBe(1);
      });
    });

    describe('at', () => {
      it('should get record by index', () => {
        const collection = new DbCollection<UserAttrs>('users');
        const record1 = collection.insert({ name: 'John' });
        const record2 = collection.insert({ name: 'Jane' });
        expect(collection.at(0)).toEqual(record1);
        expect(collection.at(1)).toEqual(record2);
        expect(collection.at(2)).toBeUndefined();
      });
    });

    describe('has', () => {
      it('should check if record exists', () => {
        const collection = new DbCollection<UserAttrs>('users');
        collection.insert({ id: 'test', name: 'John' });
        expect(collection.has('test')).toBe(true);
        expect(collection.has('nonexistent')).toBe(false);
      });
    });

    describe('first', () => {
      it('should return first record', () => {
        const collection = new DbCollection<UserAttrs>('users');
        const record1 = collection.insert({ name: 'John' });
        expect(collection.first()).toEqual(record1);
      });

      it('should return undefined if collection is empty', () => {
        const collection = new DbCollection<UserAttrs>('users');
        expect(collection.first()).toBeUndefined();
      });
    });

    describe('last', () => {
      it('should return last record', () => {
        const collection = new DbCollection<UserAttrs>('users');
        collection.insert({ name: 'John' });
        const record2 = collection.insert({ name: 'Jane' });
        expect(collection.last()).toEqual(record2);
      });

      it('should return undefined if collection is empty', () => {
        const collection = new DbCollection<UserAttrs>('users');
        expect(collection.last()).toBeUndefined();
      });
    });

    describe('isEmpty', () => {
      it('should return true for empty collection', () => {
        const collection = new DbCollection<UserAttrs>('users');
        expect(collection.isEmpty).toBe(true);
        collection.insert({ name: 'John' });
        expect(collection.isEmpty).toBe(false);
      });
    });
  });

  describe('Query methods', () => {
    describe('find', () => {
      const collection = new DbCollection<UserAttrs>('users');
      collection.insertMany([{ name: 'John' }, { name: 'Jane' }]);

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
        const result = collection.find({ where: (record) => record.name === 'Jane' });
        expect(result).toEqual({ id: '2', name: 'Jane' });
      });

      it('should return null when no match found with query', () => {
        expect(collection.find({ name: 'Bob' })).toBeNull();
      });
    });

    describe('findMany', () => {
      const collection = new DbCollection<UserAttrs>('users');
      collection.insertMany([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 30 },
      ]);

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
        const results = collection.findMany({ where: (record) => (record.age ?? 0) > 25 });
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

  describe('Mutation methods', () => {
    describe('insert', () => {
      it('should insert record with generated ID', () => {
        const collection = new DbCollection<UserAttrs>('users');
        const record = collection.insert({ name: 'John' });
        expect(record).toEqual({ id: '1', name: 'John' });
        expect(collection.find('1')).toEqual(record);
      });

      it('should insert record with provided ID', () => {
        const collection = new DbCollection<UserAttrs>('users');
        const record = collection.insert({ id: '5', name: 'John' });
        expect(record).toEqual({ id: '5', name: 'John' });
        expect(collection.find('5')).toEqual(record);
      });
    });

    describe('insertMany', () => {
      it('should insert multiple records', () => {
        const collection = new DbCollection<UserAttrs>('users');
        const records = collection.insertMany([{ name: 'John' }, { name: 'Jane' }]);
        expect(records).toHaveLength(2);
        expect(collection.size).toBe(2);
      });
    });

    describe('update', () => {
      const collection = new DbCollection<UserAttrs>('users');

      beforeEach(() => {
        collection.insertMany([
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ]);
      });

      afterEach(() => {
        collection.clear();
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
      const collection = new DbCollection<UserAttrs>('users');

      beforeEach(() => {
        collection.insertMany([
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
          { name: 'Bob', age: 30 },
        ]);
      });

      afterEach(() => {
        collection.clear();
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
        const updated = collection.updateMany(
          { where: (record) => (record.age ?? 0) > 25 },
          { active: true },
        );
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

      it('should update records with where clause field operations', () => {
        const updated = collection.updateMany({ where: { age: { gte: 30 } } }, { active: true });
        expect(updated).toHaveLength(2);
        expect(updated.every((r) => r.active === true)).toBe(true);
        expect(updated.map((r) => r.name).sort()).toEqual(['Bob', 'John']);
      });

      it('should update records with logical operators', () => {
        const updated = collection.updateMany(
          {
            where: {
              OR: [{ name: 'John' }, { age: { lt: 30 } }],
            },
          },
          { active: true },
        );
        expect(updated).toHaveLength(2);
        expect(updated.map((r) => r.name).sort()).toEqual(['Jane', 'John']);
      });

      it('should update records with limit', () => {
        const updated = collection.updateMany(
          {
            where: { age: 30 },
            limit: 1,
          },
          { active: true },
        );
        expect(updated).toHaveLength(1);
        expect(updated[0].active).toBe(true);
        expect(updated[0].age).toBe(30);
      });

      it('should update records with sorting and offset', () => {
        const updated = collection.updateMany(
          {
            orderBy: { name: 'asc' },
            offset: 1,
            limit: 1,
          },
          { active: true },
        );
        expect(updated).toHaveLength(1);
        expect(updated[0].name).toBe('Jane'); // Bob, Jane, John -> skip Bob, take Jane
      });
    });

    describe('delete', () => {
      const collection = new DbCollection<UserAttrs>('users');

      beforeEach(() => {
        collection.insertMany([{ name: 'John' }, { name: 'Jane' }]);
      });

      afterEach(() => {
        collection.clear();
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
      const collection = new DbCollection<UserAttrs>('users');

      beforeEach(() => {
        collection.insertMany([
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
          { name: 'Bob', age: 30 },
        ]);
      });

      afterEach(() => {
        collection.clear();
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
        const deletedCount = collection.deleteMany({ where: (record) => (record.age ?? 0) > 25 });
        expect(deletedCount).toBe(2);
        expect(collection.size).toBe(1);
        expect(collection.find('2')).toEqual({ id: '2', name: 'Jane', age: 25 });
      });

      it('should return 0 when no records match', () => {
        const deletedCount = collection.deleteMany({ name: 'NonExistent' });
        expect(deletedCount).toBe(0);
        expect(collection.size).toBe(3);
      });

      it('should delete records with where clause field operations', () => {
        const deletedCount = collection.deleteMany({
          where: { age: { gte: 30 } },
        });
        expect(deletedCount).toBe(2);
        expect(collection.size).toBe(1);
        expect(collection.find('2')).toEqual({ id: '2', name: 'Jane', age: 25 });
      });

      it('should delete records with logical operators', () => {
        const deletedCount = collection.deleteMany({
          where: {
            OR: [{ name: 'John' }, { age: { lt: 30 } }],
          },
        });
        expect(deletedCount).toBe(2);
        expect(collection.size).toBe(1);
        const remaining = collection.all();
        expect(remaining[0].name).toBe('Bob');
      });

      it('should delete records with limit', () => {
        const deletedCount = collection.deleteMany({
          where: { age: 30 },
          limit: 1,
        });
        expect(deletedCount).toBe(1);
        expect(collection.size).toBe(2);
        // One of John or Bob should be deleted, one should remain
        const remaining = collection.all().filter((r) => r.age === 30);
        expect(remaining).toHaveLength(1);
      });

      it('should delete records with sorting and offset', () => {
        const deletedCount = collection.deleteMany({
          orderBy: { name: 'asc' },
          offset: 1,
          limit: 1,
        });
        expect(deletedCount).toBe(1);
        expect(collection.size).toBe(2);
        // Bob, Jane, John -> skip Bob, delete Jane
        expect(collection.find('2')).toBeNull(); // Jane should be deleted
        expect(collection.find('1')).toBeTruthy(); // John should remain
        expect(collection.find('3')).toBeTruthy(); // Bob should remain
      });

      it('should delete records with callback where and helpers', () => {
        const deletedCount = collection.deleteMany({
          where: (record, { and, gte, eq }) => and(gte(record.age, 25), eq(record.name, 'John')),
        });
        expect(deletedCount).toBe(1);
        expect(collection.size).toBe(2);
        expect(collection.find('1')).toBeNull(); // John should be deleted
      });
    });

    describe('clear', () => {
      it('should remove all records', () => {
        const collection = new DbCollection<UserAttrs>('users');
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
      const users = new DbCollection<UserAttrs>('users');

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
      const users = new DbCollection<UserAttrs>('users', {
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

  describe('Advanced query options', () => {
    interface ExtendedUserAttrs {
      id: string;
      name: string;
      email: string;
      age: number;
      status: string;
      tags: string[];
      createdAt: Date;
    }

    const collection = new DbCollection<ExtendedUserAttrs>('users');
    collection.insertMany([
      {
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
        age: 25,
        status: 'active',
        tags: ['admin', 'user'],
        createdAt: new Date('2025-01-01'),
      },
      {
        id: '2',
        name: 'Bob',
        email: 'bob@test.com',
        age: 30,
        status: 'active',
        tags: ['user'],
        createdAt: new Date('2025-01-02'),
      },
      {
        id: '3',
        name: 'Charlie',
        email: 'charlie@example.com',
        age: 35,
        status: 'inactive',
        tags: ['user'],
        createdAt: new Date('2025-01-03'),
      },
      {
        id: '4',
        name: 'David',
        email: 'david@test.com',
        age: 28,
        status: 'pending',
        tags: ['guest'],
        createdAt: new Date('2025-01-04'),
      },
      {
        id: '5',
        name: 'Eve',
        email: 'eve@example.com',
        age: 40,
        status: 'active',
        tags: ['admin'],
        createdAt: new Date('2025-01-05'),
      },
    ]);

    describe('Where clause with field operations', () => {
      it('should filter with eq operator', () => {
        const results = collection.findMany({
          where: { status: { eq: 'active' } },
        });
        expect(results).toHaveLength(3);
      });

      it('should filter with ne operator', () => {
        const results = collection.findMany({
          where: { status: { ne: 'active' } },
        });
        expect(results).toHaveLength(2);
      });

      it('should filter with in operator', () => {
        const results = collection.findMany({
          where: { status: { in: ['active', 'pending'] } },
        });
        expect(results).toHaveLength(4);
      });

      it('should filter with range operators', () => {
        const results = collection.findMany({
          where: { age: { gte: 30, lte: 35 } },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Bob', 'Charlie']);
      });

      it('should filter with between operator', () => {
        const results = collection.findMany({
          where: { age: { between: [28, 35] } },
        });
        expect(results).toHaveLength(3);
      });

      it('should filter with string like operator', () => {
        const results = collection.findMany({
          where: { email: { like: '%@example.com' } },
        });
        expect(results).toHaveLength(3);
      });

      it('should filter with string ilike operator', () => {
        const results = collection.findMany({
          where: { email: { ilike: '%@EXAMPLE.COM' } },
        });
        expect(results).toHaveLength(3);
      });

      it('should filter with startsWith operator', () => {
        const results = collection.findMany({
          where: { name: { startsWith: 'A' } },
        });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Alice');
      });

      it('should filter with endsWith operator', () => {
        const results = collection.findMany({
          where: { email: { endsWith: 'test.com' } },
        });
        expect(results).toHaveLength(2);
      });

      it('should filter with contains operator', () => {
        const results = collection.findMany({
          where: { name: { contains: 'li' } },
        });
        expect(results).toHaveLength(2);
      });

      it('should filter array contains', () => {
        const results = collection.findMany({
          where: { tags: { contains: 'admin' } },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Alice', 'Eve']);
      });
    });

    describe('Logical operators', () => {
      it('should combine conditions with AND', () => {
        const results = collection.findMany({
          where: {
            AND: [{ status: 'active' }, { age: { gte: 30 } }],
          },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Bob', 'Eve']);
      });

      it('should combine conditions with OR', () => {
        const results = collection.findMany({
          where: {
            OR: [{ status: 'inactive' }, { age: { lt: 28 } }],
          },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Alice', 'Charlie']);
      });

      it('should negate conditions with NOT', () => {
        const results = collection.findMany({
          where: {
            NOT: { status: 'active' },
          },
        });
        expect(results).toHaveLength(2);
      });

      it('should combine AND, OR, and NOT', () => {
        const results = collection.findMany({
          where: {
            AND: [
              {
                OR: [{ status: 'active' }, { status: 'pending' }],
              },
              { NOT: { age: { lt: 30 } } },
            ],
          },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Bob', 'Eve']);
      });
    });

    describe('Callback where with helpers', () => {
      it('should filter with callback and helpers', () => {
        const results = collection.findMany({
          where: (record, { and, gte, eq }) =>
            and(gte(record.age, 30), eq(record.status, 'active')),
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Bob', 'Eve']);
      });

      it('should use string helpers', () => {
        const results = collection.findMany({
          where: (record, { ilike }) => ilike(record.email, '%@EXAMPLE.COM'),
        });
        expect(results).toHaveLength(3);
      });

      it('should use range helpers', () => {
        const results = collection.findMany({
          where: (record, { between }) => between(record.age, 28, 35),
        });
        expect(results).toHaveLength(3);
      });

      it('should use or helper for multiple conditions', () => {
        const results = collection.findMany({
          where: (record, { or, eq }) =>
            or(eq(record.status, 'inactive'), eq(record.status, 'pending')),
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Charlie', 'David']);
      });

      it('should use not helper to invert condition', () => {
        const results = collection.findMany({
          where: (record, { not, eq }) => not(eq(record.status, 'active')),
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Charlie', 'David']);
      });

      it('should combine logical helpers', () => {
        const results = collection.findMany({
          where: (record, { and, or, gte, eq }) =>
            and(or(eq(record.status, 'active'), eq(record.status, 'pending')), gte(record.age, 30)),
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Bob', 'Eve']);
      });
    });

    describe('Sorting', () => {
      it('should sort by single field ascending', () => {
        const results = collection.findMany({
          orderBy: { age: 'asc' },
        });
        expect(results.map((r) => r.age)).toEqual([25, 28, 30, 35, 40]);
      });

      it('should sort by single field descending', () => {
        const results = collection.findMany({
          orderBy: { age: 'desc' },
        });
        expect(results.map((r) => r.age)).toEqual([40, 35, 30, 28, 25]);
      });

      it('should sort by multiple fields using array', () => {
        const results = collection.findMany({
          orderBy: [
            ['age', 'desc'],
            ['name', 'asc'],
          ],
        });
        expect(results[0].name).toBe('Eve');
        expect(results[results.length - 1].name).toBe('Alice');
      });

      it('should sort with where clause', () => {
        const results = collection.findMany({
          where: { status: 'active' },
          orderBy: { age: 'desc' },
        });
        expect(results).toHaveLength(3);
        expect(results.map((r) => r.age)).toEqual([40, 30, 25]);
      });
    });

    describe('Offset and limit pagination', () => {
      it('should apply limit', () => {
        const results = collection.findMany({
          limit: 2,
        });
        expect(results).toHaveLength(2);
      });

      it('should apply offset', () => {
        const results = collection.findMany({
          orderBy: { id: 'asc' },
          offset: 2,
        });
        expect(results).toHaveLength(3);
        expect(results.map((r) => r.id)).toEqual(['3', '4', '5']);
      });

      it('should apply offset and limit together', () => {
        const results = collection.findMany({
          orderBy: { id: 'asc' },
          offset: 1,
          limit: 2,
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.id)).toEqual(['2', '3']);
      });

      it('should paginate with where and orderBy', () => {
        const results = collection.findMany({
          where: { status: 'active' },
          orderBy: { age: 'asc' },
          offset: 1,
          limit: 1,
        });
        expect(results).toHaveLength(1);
        expect(results[0].age).toBe(30);
      });
    });

    describe('Cursor-based (keyset) pagination', () => {
      it('should apply cursor with single field', () => {
        const results = collection.findMany({
          orderBy: { age: 'asc' },
          cursor: { age: 28 },
        });
        expect(results.map((r) => r.age)).toEqual([30, 35, 40]);
      });

      it('should apply cursor with descending order', () => {
        const results = collection.findMany({
          orderBy: { age: 'desc' },
          cursor: { age: 35 },
        });
        expect(results.map((r) => r.age)).toEqual([30, 28, 25]);
      });

      it('should apply cursor with multiple fields', () => {
        const results = collection.findMany({
          orderBy: [
            ['age', 'desc'],
            ['name', 'asc'],
          ],
          cursor: { age: 30 },
        });
        expect(results.length).toBeGreaterThan(0);
      });

      it('should apply cursor with date field', () => {
        const results = collection.findMany({
          orderBy: { createdAt: 'desc' },
          cursor: { createdAt: new Date('2025-01-03') },
        });
        expect(results.map((r) => r.id)).toEqual(['2', '1']);
      });

      it('should combine cursor with limit', () => {
        const results = collection.findMany({
          orderBy: { age: 'asc' },
          cursor: { age: 25 },
          limit: 2,
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.age)).toEqual([28, 30]);
      });
    });

    describe('find with query options', () => {
      it('should find single record with where clause', () => {
        const result = collection.find({
          where: { email: { ilike: '%@example.com' } },
          orderBy: { age: 'desc' },
        });
        expect(result).toBeDefined();
        expect(result!.age).toBe(40);
      });

      it('should find with complex where and offset', () => {
        const result = collection.find({
          where: { status: 'active' },
          orderBy: { age: 'asc' },
          offset: 1,
        });
        expect(result).toBeDefined();
        expect(result!.age).toBe(30);
      });
    });

    describe('count and exists', () => {
      it('should count records matching where clause', () => {
        const count = collection.count({ status: 'active' });
        expect(count).toBe(3);
      });

      it('should count records with complex where', () => {
        const count = collection.count({
          AND: [{ status: 'active' }, { age: { gte: 30 } }],
        });
        expect(count).toBe(2);
      });

      it('should count all records without where', () => {
        const count = collection.count();
        expect(count).toBe(5);
      });

      it('should check if records exist with where clause', () => {
        expect(collection.exists({ status: 'active' })).toBe(true);
        expect(collection.exists({ status: 'deleted' })).toBe(false);
      });

      it('should check existence with complex where', () => {
        expect(
          collection.exists({
            AND: [{ status: 'active' }, { age: { gt: 100 } }],
          }),
        ).toBe(false);
      });

      it('should check if any records exist without where', () => {
        expect(collection.exists()).toBe(true);
        const emptyCollection = new DbCollection<ExtendedUserAttrs>('empty');
        expect(emptyCollection.exists()).toBe(false);
      });
    });
  });
});
