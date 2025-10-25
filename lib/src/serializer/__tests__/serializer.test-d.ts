/**
 * Type tests for Serializer using Vitest
 *
 * These tests verify TypeScript types using Vitest's expectTypeOf.
 * Run: pnpm test:types
 */

import { model } from '@src/model';
import type { DataSerializerOptions, SerializerOptions } from '@src/serializer';
import { expectTypeOf, test } from 'vitest';

// Test models
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<{
    id: string;
    name: string;
    email: string;
    age: number;
  }>()
  .create();

const postModel = model()
  .name('post')
  .collection('posts')
  .attrs<{
    id: number;
    title: string;
    content: string;
    published: boolean;
  }>()
  .create();

test('SerializerOptions should accept complete configuration', () => {
  const options: SerializerOptions<typeof userModel> = {
    attrs: ['id', 'name', 'email'],
    root: true,
    embed: false,
  };

  expectTypeOf(options).toMatchTypeOf<SerializerOptions<typeof userModel>>();
});

test('DataSerializerOptions should work with attrs', () => {
  const options: DataSerializerOptions<typeof userModel> = {
    attrs: ['id', 'name', 'email'],
  };

  expectTypeOf(options).toEqualTypeOf<DataSerializerOptions<typeof userModel>>();
});

test('DataSerializerOptions should work with include for relationships', () => {
  const options: DataSerializerOptions<typeof postModel> = {
    attrs: ['id', 'title', 'content'],
    include: ['author', 'comments'],
  };

  expectTypeOf(options).toEqualTypeOf<DataSerializerOptions<typeof postModel>>();
});

test('SerializerOptions should work with partial attrs', () => {
  const options: SerializerOptions<typeof userModel> = {
    attrs: ['id', 'name'],
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<typeof userModel>>();
});

test('SerializerOptions should work with root and embed options', () => {
  const options: SerializerOptions<typeof postModel> = {
    root: 'data',
    embed: true,
  };

  expectTypeOf(options).toEqualTypeOf<SerializerOptions<typeof postModel>>();
});
