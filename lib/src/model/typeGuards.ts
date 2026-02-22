import type { SchemaCollections } from '@src/schema';

import type ModelCollection from './ModelCollection';
import type { ModelInstance, ModelTemplate } from './types';

/**
 * Type guard to check if a value is a model instance
 * @param value - The value to check
 * @returns True if the value is a model instance
 */
export function isModelInstance<TSchema extends SchemaCollections>(
  value: unknown,
): value is ModelInstance<ModelTemplate, TSchema> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'id' in value &&
    'modelName' in value
  );
}

/**
 * Type guard to check if a value is an array of model instances
 * @param value - The value to check
 * @returns True if the value is an array of model instances
 */
export function isModelInstanceArray<TSchema extends SchemaCollections>(
  value: unknown,
): value is ModelInstance<ModelTemplate, TSchema>[] {
  return (
    Array.isArray(value) &&
    value.every((item) => isModelInstance<TSchema>(item))
  );
}

/**
 * Type guard to check if a value is a model collection
 * @param value - The value to check
 * @returns True if the value is a model collection
 */
export function isModelCollection<TSchema extends SchemaCollections>(
  value: unknown,
): value is ModelCollection<ModelTemplate, TSchema> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'models' in value &&
    Array.isArray((value as { models: unknown }).models)
  );
}

/**
 * Type guard to check if a value is an array (of any type)
 * @param value - The value to check
 * @returns True if the value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
