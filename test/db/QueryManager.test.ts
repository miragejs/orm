import { QueryManager } from '@src/db';

// Define a test record interface
interface UserRecord {
  id: string;
  name: string;
  email: string;
  age: number;
  status: string;
  tags: string[];
  createdAt: Date;
  active: boolean;
}

describe('QueryManager', () => {
  // Create a new query manager instance
  const queryManager = new QueryManager<UserRecord>();

  // Create test records
  const records: UserRecord[] = [
    {
      id: '1',
      name: 'Alice',
      email: 'alice@example.com',
      age: 25,
      status: 'active',
      tags: ['admin', 'user'],
      createdAt: new Date('2025-01-01'),
      active: true,
    },
    {
      id: '2',
      name: 'Bob',
      email: 'bob@test.com',
      age: 30,
      status: 'active',
      tags: ['user'],
      createdAt: new Date('2025-01-02'),
      active: true,
    },
    {
      id: '3',
      name: 'Charlie',
      email: 'charlie@example.com',
      age: 35,
      status: 'inactive',
      tags: ['user', 'guest'],
      createdAt: new Date('2025-01-03'),
      active: false,
    },
    {
      id: '4',
      name: 'David',
      email: 'david@test.com',
      age: 28,
      status: 'pending',
      tags: ['guest'],
      createdAt: new Date('2025-01-04'),
      active: true,
    },
    {
      id: '5',
      name: 'Eve',
      email: 'eve@example.com',
      age: 40,
      status: 'active',
      tags: ['admin'],
      createdAt: new Date('2025-01-05'),
      active: true,
    },
  ];

  describe('Basic filtering', () => {
    describe('Equality operations', () => {
      it('should filter with eq operator', () => {
        const results = queryManager.query(records, {
          where: { name: { eq: 'Alice' } },
        });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Alice');
      });

      it('should filter with ne operator', () => {
        const results = queryManager.query(records, {
          where: { status: { ne: 'active' } },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.status)).toEqual(['inactive', 'pending']);
      });

      it('should filter with in operator', () => {
        const results = queryManager.query(records, {
          where: { status: { in: ['active', 'pending'] } },
        });
        expect(results).toHaveLength(4);
      });

      it('should filter with nin operator', () => {
        const results = queryManager.query(records, {
          where: { status: { nin: ['active'] } },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.status)).toEqual(['inactive', 'pending']);
      });

      it('should filter with isNull true', () => {
        const recordsWithNull: Partial<UserRecord>[] = [
          ...records,
          { id: '6', name: 'Frank', age: undefined, status: 'active' },
        ];
        const results = queryManager.query(recordsWithNull as UserRecord[], {
          where: { age: { isNull: true } },
        });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Frank');
      });

      it('should filter with isNull false', () => {
        const results = queryManager.query(records, {
          where: { age: { isNull: false } },
        });
        expect(results).toHaveLength(5);
      });

      it('should filter with direct value (shorthand equality)', () => {
        const results = queryManager.query(records, {
          where: { status: 'active' },
        });
        expect(results).toHaveLength(3);
      });
    });

    describe('Range operations', () => {
      it('should filter with lt operator', () => {
        const results = queryManager.query(records, {
          where: { age: { lt: 30 } },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.age)).toEqual([25, 28]);
      });

      it('should filter with lte operator', () => {
        const results = queryManager.query(records, {
          where: { age: { lte: 30 } },
        });
        expect(results).toHaveLength(3);
      });

      it('should filter with gt operator', () => {
        const results = queryManager.query(records, {
          where: { age: { gt: 30 } },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.age)).toEqual([35, 40]);
      });

      it('should filter with gte operator', () => {
        const results = queryManager.query(records, {
          where: { age: { gte: 30 } },
        });
        expect(results).toHaveLength(3);
      });

      it('should filter with between operator', () => {
        const results = queryManager.query(records, {
          where: { age: { between: [28, 35] } },
        });
        expect(results).toHaveLength(3);
        expect(results.map((r) => r.age)).toEqual([30, 35, 28]);
      });

      it('should filter dates with range operators', () => {
        const results = queryManager.query(records, {
          where: { createdAt: { gte: new Date('2025-01-03') } },
        });
        expect(results).toHaveLength(3);
      });
    });

    describe('String operations', () => {
      it('should filter with like operator (% wildcards)', () => {
        const results = queryManager.query(records, {
          where: { email: { like: '%@example.com' } },
        });
        expect(results).toHaveLength(3);
      });

      it('should filter with ilike operator (case-insensitive)', () => {
        const results = queryManager.query(records, {
          where: { email: { ilike: '%@EXAMPLE.COM' } },
        });
        expect(results).toHaveLength(3);
      });

      it('should filter with startsWith operator', () => {
        const results = queryManager.query(records, {
          where: { name: { startsWith: 'A' } },
        });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Alice');
      });

      it('should filter with endsWith operator', () => {
        const results = queryManager.query(records, {
          where: { email: { endsWith: 'test.com' } },
        });
        expect(results).toHaveLength(2);
      });

      it('should filter with contains operator', () => {
        const results = queryManager.query(records, {
          where: { name: { contains: 'li' } },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Alice', 'Charlie']);
      });
    });

    describe('Array operations', () => {
      it('should filter array contains single element', () => {
        const results = queryManager.query(records, {
          where: { tags: { contains: 'admin' } },
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.name)).toEqual(['Alice', 'Eve']);
      });

      it('should filter array contains multiple elements', () => {
        const results = queryManager.query(records, {
          where: { tags: { contains: ['admin', 'user'] } },
        });
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Alice');
      });

      it('should filter array length with range ops', () => {
        const results = queryManager.query(records, {
          where: { tags: { length: { gte: 2 } } },
        });
        expect(results).toHaveLength(2);
      });
    });
  });

  describe('Logical operators', () => {
    it('should combine conditions with AND', () => {
      const results = queryManager.query(records, {
        where: {
          AND: [{ status: 'active' }, { age: { gte: 30 } }],
        },
      });
      // Bob (30, active) and Eve (40, active) match both conditions
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(['Bob', 'Eve']);
    });

    it('should combine conditions with OR', () => {
      const results = queryManager.query(records, {
        where: {
          OR: [{ status: 'inactive' }, { age: { lt: 28 } }],
        },
      });
      // Alice (25) matches age < 28, Charlie (inactive) matches status
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(['Alice', 'Charlie']);
    });

    it('should negate conditions with NOT', () => {
      const results = queryManager.query(records, {
        where: {
          NOT: { status: 'active' },
        },
      });
      // Charlie (inactive) and David (pending) are not active
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.status)).toEqual(['inactive', 'pending']);
    });

    it('should combine AND, OR, and NOT', () => {
      const results = queryManager.query(records, {
        where: {
          AND: [
            {
              OR: [{ status: 'active' }, { status: 'pending' }],
            },
            { NOT: { age: { lt: 30 } } },
          ],
        },
      });
      // Bob (30, active) and Eve (40, active) are active/pending AND age >= 30
      // David (28, pending) is pending but age < 30, so excluded
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(['Bob', 'Eve']);
    });

    it('should handle nested logical operators', () => {
      const results = queryManager.query(records, {
        where: {
          OR: [
            {
              AND: [{ status: 'active' }, { age: { lt: 30 } }],
            },
            { status: 'pending' },
          ],
        },
      });
      // Alice (25, active) matches first condition: active AND age < 30
      // David (28, pending) matches second condition: pending
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(['Alice', 'David']);
    });
  });

  describe('Callback where', () => {
    it('should filter with callback predicate', () => {
      const results = queryManager.query(records, {
        where: (record) => record.age > 30,
      });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.age)).toEqual([35, 40]);
    });

    it('should provide helper functions in callback', () => {
      const results = queryManager.query(records, {
        where: (record, { and, gte, eq }) => and(gte(record.age, 30), eq(record.status, 'active')),
      });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(['Bob', 'Eve']);
    });

    it('should use string helpers in callback', () => {
      const results = queryManager.query(records, {
        where: (record, { ilike }) => ilike(record.email, '%@EXAMPLE.COM'),
      });
      expect(results).toHaveLength(3);
    });

    it('should use range helpers in callback', () => {
      const results = queryManager.query(records, {
        where: (record, { between }) => between(record.age, 28, 35),
      });
      expect(results).toHaveLength(3);
    });

    it('should use null check helpers in callback', () => {
      const recordsWithNull: Partial<UserRecord>[] = [
        ...records,
        { id: '6', name: 'Frank', status: 'active' },
      ];
      const results = queryManager.query(recordsWithNull as UserRecord[], {
        where: (record, { isNull }) => isNull(record.age),
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Frank');
    });

    it('should use or helper for multiple conditions', () => {
      const results = queryManager.query(records, {
        where: (record, { or, eq }) =>
          or(eq(record.status, 'inactive'), eq(record.status, 'pending')),
      });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(['Charlie', 'David']);
    });

    it('should use not helper to invert condition', () => {
      const results = queryManager.query(records, {
        where: (record, { not, eq }) => not(eq(record.status, 'active')),
      });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toEqual(['Charlie', 'David']);
    });

    it('should combine logical helpers (and, or, not)', () => {
      const results = queryManager.query(records, {
        where: (record, { and, or, not, gte, eq }) =>
          and(
            or(eq(record.status, 'active'), eq(record.status, 'pending')),
            not(gte(record.age, 40)),
          ),
      });
      // Alice (25, active), Bob (30, active), David (28, pending)
      expect(results).toHaveLength(3);
      expect(results.map((r) => r.name)).toEqual(['Alice', 'Bob', 'David']);
    });
  });

  describe('Sorting', () => {
    it('should sort by single field ascending', () => {
      const results = queryManager.query(records, {
        orderBy: { age: 'asc' },
      });
      expect(results.map((r) => r.age)).toEqual([25, 28, 30, 35, 40]);
    });

    it('should sort by single field descending', () => {
      const results = queryManager.query(records, {
        orderBy: { age: 'desc' },
      });
      expect(results.map((r) => r.age)).toEqual([40, 35, 30, 28, 25]);
    });

    it('should sort by multiple fields using object', () => {
      const recordsWithDuplicates: Partial<UserRecord>[] = [
        { id: '1', name: 'Alice', age: 30, status: 'active' },
        { id: '2', name: 'Bob', age: 30, status: 'inactive' },
        { id: '3', name: 'Charlie', age: 25, status: 'active' },
      ];
      const results = queryManager.query(recordsWithDuplicates as UserRecord[], {
        orderBy: { age: 'desc', name: 'asc' },
      });
      expect(results.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should sort by multiple fields using array (tuple)', () => {
      const recordsWithDuplicates: Partial<UserRecord>[] = [
        { id: '1', name: 'Alice', age: 30, status: 'active' },
        { id: '2', name: 'Bob', age: 30, status: 'inactive' },
        { id: '3', name: 'Charlie', age: 25, status: 'active' },
      ];
      const results = queryManager.query(recordsWithDuplicates as UserRecord[], {
        orderBy: [
          ['age', 'desc'],
          ['name', 'asc'],
        ],
      });
      expect(results.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should sort dates correctly', () => {
      const results = queryManager.query(records, {
        orderBy: { createdAt: 'desc' },
      });
      expect(results.map((r) => r.id)).toEqual(['5', '4', '3', '2', '1']);
    });

    it('should handle null values in sorting (nulls last)', () => {
      const recordsWithNull: Partial<UserRecord>[] = [
        { id: '1', name: 'Alice', age: 30 },
        { id: '2', name: 'Bob', age: undefined },
        { id: '3', name: 'Charlie', age: 25 },
      ];
      const results = queryManager.query(recordsWithNull as UserRecord[], {
        orderBy: { age: 'asc' },
      });
      expect(results.map((r) => r.id)).toEqual(['3', '1', '2']);
    });
  });

  describe('Pagination', () => {
    describe('Offset and limit', () => {
      it('should apply limit', () => {
        const results = queryManager.query(records, {
          limit: 2,
        });
        expect(results).toHaveLength(2);
      });

      it('should apply offset', () => {
        const results = queryManager.query(records, {
          orderBy: { id: 'asc' },
          offset: 2,
        });
        expect(results).toHaveLength(3);
        expect(results.map((r) => r.id)).toEqual(['3', '4', '5']);
      });

      it('should apply offset and limit together', () => {
        const results = queryManager.query(records, {
          orderBy: { id: 'asc' },
          offset: 1,
          limit: 2,
        });
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.id)).toEqual(['2', '3']);
      });

      it('should handle offset beyond records length', () => {
        const results = queryManager.query(records, {
          offset: 10,
        });
        expect(results).toHaveLength(0);
      });

      it('should handle limit larger than remaining records', () => {
        const results = queryManager.query(records, {
          offset: 3,
          limit: 10,
        });
        expect(results).toHaveLength(2);
      });
    });

    describe('Cursor-based (keyset) pagination', () => {
      it('should apply cursor with single field ascending', () => {
        const results = queryManager.query(records, {
          orderBy: { age: 'asc' },
          cursor: { age: 28 },
        });
        expect(results.map((r) => r.age)).toEqual([30, 35, 40]);
      });

      it('should apply cursor with single field descending', () => {
        const results = queryManager.query(records, {
          orderBy: { age: 'desc' },
          cursor: { age: 35 },
        });
        expect(results.map((r) => r.age)).toEqual([30, 28, 25]);
      });

      it('should apply cursor with multiple fields', () => {
        const recordsWithDuplicates: Partial<UserRecord>[] = [
          { id: '1', name: 'Alice', age: 30, createdAt: new Date('2025-01-01') },
          { id: '2', name: 'Bob', age: 30, createdAt: new Date('2025-01-02') },
          { id: '3', name: 'Charlie', age: 30, createdAt: new Date('2025-01-03') },
          { id: '4', name: 'David', age: 25, createdAt: new Date('2025-01-04') },
        ];
        const results = queryManager.query(recordsWithDuplicates as UserRecord[], {
          orderBy: [
            ['age', 'desc'],
            ['createdAt', 'asc'],
          ],
          cursor: { age: 30, createdAt: new Date('2025-01-02') },
        });
        expect(results.map((r) => r.name)).toEqual(['Charlie', 'David']);
      });

      it('should apply cursor with dates', () => {
        const results = queryManager.query(records, {
          orderBy: { createdAt: 'desc' },
          cursor: { createdAt: new Date('2025-01-03') },
        });
        expect(results.map((r) => r.id)).toEqual(['2', '1']);
      });

      it('should exclude record at cursor position (cursor is exclusive)', () => {
        const results = queryManager.query(records, {
          orderBy: { age: 'asc' },
          cursor: { age: 30 },
        });
        expect(results.map((r) => r.age)).not.toContain(30);
      });

      it('should handle partial cursor (only some orderBy fields)', () => {
        const results = queryManager.query(records, {
          orderBy: [
            ['age', 'desc'],
            ['name', 'asc'],
          ],
          cursor: { age: 30 },
        });
        expect(results.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Combined operations', () => {
    it('should combine filtering, sorting, and pagination', () => {
      const results = queryManager.query(records, {
        where: { status: 'active' },
        orderBy: { age: 'desc' },
        offset: 1,
        limit: 1,
      });
      expect(results).toHaveLength(1);
      expect(results[0].age).toBe(30);
    });

    it('should combine complex where, sorting, and cursor', () => {
      const results = queryManager.query(records, {
        where: {
          OR: [{ status: 'active' }, { status: 'pending' }],
        },
        orderBy: { age: 'asc' },
        cursor: { age: 28 },
        limit: 2,
      });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.age)).toEqual([30, 40]);
    });

    it('should handle all options together', () => {
      const results = queryManager.query(records, {
        where: {
          AND: [{ active: true }, { age: { gte: 25 } }],
        },
        orderBy: [
          ['age', 'asc'],
          ['id', 'asc'],
        ],
        offset: 1,
        limit: 2,
      });
      expect(results).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty records array', () => {
      const results = queryManager.query([], {
        where: { status: 'active' },
      });
      expect(results).toEqual([]);
    });

    it('should handle empty where clause', () => {
      const results = queryManager.query(records, {
        where: {},
      });
      expect(results).toHaveLength(5);
    });

    it('should handle no options', () => {
      const results = queryManager.query(records, {});
      expect(results).toHaveLength(5);
    });

    it('should handle complex field operations combined', () => {
      const results = queryManager.query(records, {
        where: {
          age: {
            gte: 25,
            lte: 35,
            ne: 30,
          },
        },
      });
      expect(results.map((r) => r.age)).toEqual([25, 35, 28]);
    });

    it('should handle limit of 0', () => {
      const results = queryManager.query(records, {
        limit: 0,
      });
      expect(results).toEqual([]);
    });

    it('should handle negative offset (treated as 0)', () => {
      const results = queryManager.query(records, {
        offset: -5,
      });
      expect(results).toHaveLength(5);
    });
  });
});
