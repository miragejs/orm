import type { SchemaCollectionConfig, CollectionModule, ComposeCollections } from './types';

/**
 * Creates a collection module with the specified name and configuration
 * @param name - The name of the collection
 * @param config - The collection configuration
 * @returns A collection module object with the collection name as key
 * @example
 * ```typescript
 * const usersCollection = createCollection('users', {
 *   model: UserToken,
 *   factory: userFactory,
 *   identityManager: new StringIdentityManager(),
 * });
 * // Returns: { users: { model: UserToken, factory: userFactory, ... } }
 * ```
 */
export function createCollection<
  TName extends string,
  TConfig extends SchemaCollectionConfig<any, any, any>,
>(name: TName, config: TConfig): CollectionModule<TName, TConfig> {
  return {
    [name]: config,
  } as CollectionModule<TName, TConfig>;
}

/**
 * Composes multiple collection modules into a single collections object
 * @param collections - Array of collection modules to compose
 * @returns A single object containing all collections
 * @example
 * ```typescript
 * const usersCollection = createCollection('users', { ... });
 * const postsCollection = createCollection('posts', { ... });
 * const collections = composeCollections([usersCollection, postsCollection]);
 * // Returns: { users: { ... }, posts: { ... } }
 * const schema = setupSchema(collections, { identityManager: new StringIdentityManager() });
 * ```
 */
export function composeCollections<T extends readonly CollectionModule[]>(
  collections: T,
): ComposeCollections<T> {
  const composed = {} as any;

  for (const collection of collections) {
    Object.assign(composed, collection);
  }

  return composed as ComposeCollections<T>;
}
