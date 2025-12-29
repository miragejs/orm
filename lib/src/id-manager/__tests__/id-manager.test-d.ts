/**
 * Type tests for Identity Manager using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import type {
  IdGenerator,
  IdType,
  IdentityManagerConfig,
} from '@src/id-manager';
import { expectTypeOf, test } from 'vitest';

test('IdType should be string or number', () => {
  expectTypeOf<IdType>().toEqualTypeOf<string | number>();

  // Test assignability
  const stringId: IdType = 'string-id';
  const numberId: IdType = 123;
  expectTypeOf(stringId).toBeString();
  expectTypeOf(numberId).toBeNumber();
});

test('IdGenerator with string should work correctly', () => {
  const genString: IdGenerator<string> = (currentId) => `id_${Date.now()}`;
  const genUuid: IdGenerator<string> = (currentId) => crypto.randomUUID();

  expectTypeOf(genString('id_0')).toEqualTypeOf<string>();
  expectTypeOf(genUuid('id_0')).toEqualTypeOf<string>();
});

test('IdGenerator with number should work correctly', () => {
  const genNumber: IdGenerator<number> = (currentId) => Date.now();
  const genRandom: IdGenerator<number> = (currentId) =>
    Math.floor(Math.random() * 1000000);

  expectTypeOf(genNumber(1)).toEqualTypeOf<number>();
  expectTypeOf(genRandom(1)).toEqualTypeOf<number>();
});

test('IdentityManagerConfig with string generator should be properly typed', () => {
  const config: IdentityManagerConfig<string> = {
    initialCounter: '0',
    idGenerator: (currentId) => crypto.randomUUID(),
  };

  expectTypeOf(config.initialCounter).toBeString();
  expectTypeOf(config).toHaveProperty('idGenerator');
});

test('IdentityManagerConfig with number generator should be properly typed', () => {
  const config: IdentityManagerConfig<number> = {
    initialCounter: 0,
    idGenerator: (currentId) => Math.floor(Math.random() * 1000000),
  };

  expectTypeOf(config.initialCounter).toBeNumber();
  expectTypeOf(config).toHaveProperty('idGenerator');
});

test('IdGenerator should error on wrong return type', () => {
  // @ts-expect-error - should error because return type doesn't match
  const wrongStringGen: IdGenerator<string> = (currentId) => 123;

  // @ts-expect-error - should error because return type doesn't match
  const wrongNumberGen: IdGenerator<number> = (currentId) => 'string-id';
});

test('IdentityManagerConfig should error on type mismatches', () => {
  const wrongConfig1: IdentityManagerConfig<number> = {
    initialCounter: 0,
    // @ts-expect-error - idGenerator returns wrong type
    idGenerator: (currentId) => 'string-id',
  };

  const wrongConfig2: IdentityManagerConfig<string> = {
    // @ts-expect-error - initialCounter has wrong type
    initialCounter: 0,
    idGenerator: (currentId) => 'string-id',
  };
});
