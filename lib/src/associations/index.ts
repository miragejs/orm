export { default as belongsTo } from './belongsTo';
export { default as hasMany } from './hasMany';
export type * from './types';

// Import the individual functions
import belongsToFn from './belongsTo';
import hasManyFn from './hasMany';

/**
 * Association helpers for building relationships in schema configurations.
 *
 * These functions provide a convenient way to define model relationships
 * when using both the builder-based and traditional schema configuration.
 */
export const associations = {
  /**
   * Creates a belongsTo relationship configuration.
   *
   * Use this when the current model contains a foreign key pointing to another model.
   * @template TTarget - The target model token type
   * @template TForeign - The foreign key field name
   * @param targetToken - The token of the model this relationship points to
   * @param options - Optional configuration for the relationship
   * @param options.foreignKey - The foreign key field name
   * @returns A belongsTo relationship configuration
   * @example
   * ```typescript
   * // Post belongs to User (Post has authorId field)
   * const postRelationships = {
   *   author: associations.belongsTo(userToken, { foreignKey: 'authorId' }),
   * };
   * ```
   */
  belongsTo: belongsToFn,

  /**
   * Creates a hasMany relationship configuration.
   *
   * Use this when the current model can have multiple related models,
   * typically stored as an array of foreign keys.
   * @template TTarget - The target model token type
   * @template TForeign - The foreign key array field name
   * @param targetToken - The token of the model this relationship points to
   * @param options - Optional configuration for the relationship
   * @param options.foreignKey - The foreign key array field name
   * @returns A hasMany relationship configuration
   * @example
   * ```typescript
   * // User has many Posts (User has postIds array field)
   * const userRelationships = {
   *   posts: associations.hasMany(postToken, { foreignKey: 'postIds' }),
   * };
   * ```
   */
  hasMany: hasManyFn,
} as const;
