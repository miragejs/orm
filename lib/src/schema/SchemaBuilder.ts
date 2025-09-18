import type { IdentityManager, StringIdentityManager } from '@src/id-manager';

import Schema, { type SchemaInstance } from './Schema';
import type { SchemaCollections, SchemaConfig } from './types';

/**
 * A fluent builder for creating schema instances.
 *
 * The SchemaBuilder provides a type-safe way to construct Schema instances with
 * configurable collections, identity manager, and serializer. It follows the builder
 * pattern, allowing method chaining to progressively configure the schema.
 * @template TCollections - The schema collections configuration type
 * @template TIdentityManager - The global identity manager type
 * @example
 * ```typescript
 * const appSchema = schema()
 *   .collections({
 *     users: userCollection,
 *     posts: postCollection,
 *   })
 *   .identityManager(appIdentityManager)
 *   .build();
 * ```
 */
export default class SchemaBuilder<
  TCollections extends SchemaCollections = SchemaCollections,
  TIdentityManager extends IdentityManager<any> = StringIdentityManager,
> {
  private _collections?: TCollections;
  private _identityManager?: TIdentityManager;

  /**
   * Creates a new SchemaBuilder instance.
   * @private
   */
  constructor() {}

  /**
   * Sets the collections configuration for this schema.
   *
   * Collections define the models, factories, relationships, and other configuration
   * for each collection in the schema. Each collection is keyed by its collection name.
   * @template C - The collections configuration type
   * @param collections - The collections configuration object
   * @returns A new SchemaBuilder instance with the specified collections
   * @example
   * ```typescript
   * const builder = schema().collections({
   *   users: userCollection,
   *   posts: postCollection,
   *   comments: commentCollection,
   * });
   * ```
   */
  collections<C extends SchemaCollections>(collections: C): SchemaBuilder<C, TIdentityManager> {
    const builder = new SchemaBuilder<C, TIdentityManager>();
    builder._collections = collections;
    builder._identityManager = this._identityManager;
    return builder;
  }

  /**
   * Sets the global identity manager for this schema.
   *
   * The identity manager handles ID generation and management for model instances
   * across all collections in the schema. Individual collections can override this
   * with their own identity managers.
   * @template I - The identity manager type
   * @param identityManager - The identity manager instance
   * @returns A new SchemaBuilder instance with the specified identity manager
   * @example
   * ```typescript
   * const builder = schema()
   *   .collections({ users: userCollection })
   *   .identityManager(new StringIdentityManager());
   * ```
   */
  identityManager<I extends IdentityManager<any>>(
    identityManager: I,
  ): SchemaBuilder<TCollections, I> {
    const builder = new SchemaBuilder<TCollections, I>();
    builder._collections = this._collections;
    builder._identityManager = identityManager;
    return builder;
  }

  /**
   * Sets the global serializer for this schema.
   * TEMPORARILY DISABLED - Serializer is not ready yet
   *
   * The serializer defines how model instances should be serialized when
   * converting to API responses or other external formats. Individual collections
   * can override this with their own serializers.
   * @template S - The serializer type
   * @param serializer - The serializer instance
   * @returns A new SchemaBuilder instance with the specified serializer
   * @example
   * ```typescript
   * const builder = schema()
   *   .collections({ users: userCollection })
   *   .serializer(appSerializer);
   * ```
   */
  /*
  serializer<S extends Serializer<any, any>>(
    serializer: S,
  ): SchemaBuilder<TCollections, TIdentityManager, S> {
    const builder = new SchemaBuilder<TCollections, TIdentityManager, S>();
    builder._collections = this._collections;
    builder._identityManager = this._identityManager;
    builder._serializer = serializer;
    return builder;
  }
  */

  /**
   * Creates the final Schema instance with all configured options.
   *
   * This method produces the complete schema instance that can be used throughout
   * your application. Collections must be set before calling build().
   * @returns The configured Schema instance with collection accessors
   * @throws Error if no collections have been configured
   * @example
   * ```typescript
   * const appSchema = schema()
   *   .collections({
   *     users: userCollection,
   *     posts: postCollection,
   *   })
   *   .identityManager(appIdentityManager)
   *   .build();
   *
   * // Use the schema
   * const userCollection = appSchema.getCollection('users');
   * const user = appSchema.users.create({ name: 'John' });
   * ```
   */
  build(): SchemaInstance<TCollections, SchemaConfig<TIdentityManager>> {
    if (!this._collections) {
      throw new Error(
        'SchemaBuilder: collections are required. Call .collections() before .build()',
      );
    }

    const config: SchemaConfig<TIdentityManager> = {
      identityManager: this._identityManager,
    };

    return new Schema(this._collections, config) as SchemaInstance<
      TCollections,
      SchemaConfig<TIdentityManager>
    >;
  }
}

/**
 * Creates a new SchemaBuilder instance for building schema configurations.
 *
 * This is the main entry point for creating schemas in the builder-based API.
 * The returned SchemaBuilder can be configured with collections and identity manager
 * before building the final schema instance.
 * @returns A new SchemaBuilder instance ready for configuration
 * @example
 * ```typescript
 * // Basic schema creation
 * const appSchema = schema()
 *   .collections({
 *     users: userCollection,
 *   })
 *   .build();
 *
 * // Full schema configuration
 * const appSchema = schema()
 *   .collections({
 *     users: userCollection,
 *     posts: postCollection,
 *   })
 *   .identityManager(new StringIdentityManager())
 *   .build();
 * ```
 * @see {@link SchemaBuilder} for available configuration methods
 */
export function schema(): SchemaBuilder {
  return new SchemaBuilder();
}
