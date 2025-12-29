/**
 * Type tests for Database using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import type {
  DbRecord,
  DbRecordInput,
  OrderBy,
  QueryOptions,
  Where,
} from '@src/db';
import { expectTypeOf, test } from 'vitest';

// Test record types
interface UserRecord extends DbRecord<string> {
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}

interface PostRecord extends DbRecord<number> {
  title: string;
  content: string;
  published: boolean;
  authorId: string;
}

test('DbRecord with string ID should work correctly', () => {
  const user: DbRecord<string> = {
    id: 'user-123',
  };

  expectTypeOf(user.id).toEqualTypeOf<string>();
  expectTypeOf(user).toEqualTypeOf<DbRecord<string>>();
});

test('DbRecord with number ID should work correctly', () => {
  const post: DbRecord<number> = {
    id: 42,
  };

  expectTypeOf(post.id).toEqualTypeOf<number>();
  expectTypeOf(post).toEqualTypeOf<DbRecord<number>>();
});

test('DbRecordInput should make all fields optional', () => {
  const input: DbRecordInput<UserRecord> = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    createdAt: new Date(),
  };

  expectTypeOf(input).toEqualTypeOf<DbRecordInput<UserRecord>>();

  // All fields are optional in DbRecordInput (it's Partial)
  const partialInput: DbRecordInput<UserRecord> = {
    name: 'John',
  };

  expectTypeOf(partialInput).toEqualTypeOf<DbRecordInput<UserRecord>>();
});

test('QueryOptions should work with where clause', () => {
  const opts1: QueryOptions<UserRecord> = {
    where: { name: 'John' },
    limit: 10,
  };

  expectTypeOf(opts1).toEqualTypeOf<QueryOptions<UserRecord>>();

  const opts2: QueryOptions<UserRecord> = {
    where: { age: { gt: 18 } },
    offset: 20,
    orderBy: { createdAt: 'desc' },
  };

  expectTypeOf(opts2).toEqualTypeOf<QueryOptions<UserRecord>>();
});

test('Where clause should support various operators', () => {
  const where1: Where<UserRecord> = {
    name: 'John',
  };

  expectTypeOf(where1).toEqualTypeOf<Where<UserRecord>>();

  const where2: Where<UserRecord> = {
    name: { eq: 'John' },
    age: { gt: 18, lt: 65 },
  };

  expectTypeOf(where2).toEqualTypeOf<Where<UserRecord>>();

  const where3: Where<UserRecord> = {
    email: { contains: '@example.com' },
  };

  expectTypeOf(where3).toEqualTypeOf<Where<UserRecord>>();

  const where4: Where<UserRecord> = {
    name: { in: ['John', 'Jane', 'Bob'] },
    age: { gte: 18 },
  };

  expectTypeOf(where4).toEqualTypeOf<Where<UserRecord>>();
});

test('OrderBy configuration should work correctly', () => {
  const orderBy1: OrderBy<UserRecord> = { createdAt: 'desc' };
  expectTypeOf(orderBy1.createdAt).toEqualTypeOf<'asc' | 'desc' | undefined>();

  const orderBy2: OrderBy<UserRecord> = { name: 'asc' };
  expectTypeOf(orderBy2.name).toEqualTypeOf<'asc' | 'desc' | undefined>();

  const orderByArray: OrderBy<UserRecord> = [['createdAt', 'desc'] as const];
  expectTypeOf(orderByArray).toBeArray();
});

test('Complex query with all options should work', () => {
  const complexQuery: QueryOptions<PostRecord> = {
    where: {
      published: true,
      authorId: 'user-123',
      title: { contains: 'TypeScript' },
    },
    orderBy: { id: 'desc' },
    limit: 50,
    offset: 100,
  };

  expectTypeOf(complexQuery).toEqualTypeOf<QueryOptions<PostRecord>>();
});

test('DbRecordInput should allow optional ID', () => {
  const withId: DbRecordInput<UserRecord> = {
    id: 'user-123',
    name: 'John',
  };

  expectTypeOf(withId).toEqualTypeOf<DbRecordInput<UserRecord>>();

  const withoutId: DbRecordInput<UserRecord> = {
    name: 'John',
    email: 'john@example.com',
  };

  expectTypeOf(withoutId).toEqualTypeOf<DbRecordInput<UserRecord>>();
});
