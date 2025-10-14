import type { IdentityManager, StringIdentityManager } from '@src/id-manager';
import type { GlobalSerializerConfig } from '@src/serializer';

import Schema, { type SchemaInstance } from './Schema';
import type { SchemaCollections, SchemaConfig } from './types';

/**
 * A fluent builder for creating schema instances.
 *
 * The SchemaBuilder provides a type-safe way to construct Schema instances with
 * configurable collections, identity manager, and global serializer. It follows the builder
 * pattern, allowing method chaining to progressively configure the schema.
 * @template TCollections - The schema collections configuration type
 * @template TIdentityManager - The global identity manager type
 * @template TGlobalConfig - The global serializer configuration type
 * @example
 * ```typescript
 * const appSchema = schema()
 *   .collections({
 *     users: userCollection,
 *     posts: postCollection,
 *   })
 *   .serializer({ root: true })
 *   .identityManager(appIdentityManager)
 *   .build();
 * ```
 */
export default class SchemaBuilder<
  TCollections extends SchemaCollections = SchemaCollections,
  TIdentityManager extends IdentityManager<any> = StringIdentityManager,
  TGlobalConfig extends GlobalSerializerConfig | undefined = undefined,
> {
  private _collections?: TCollections;
  private _identityManager?: TIdentityManager;
  private _globalSerializerConfig?: GlobalSerializerConfig;

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
  collections<C extends SchemaCollections>(
    collections: C,
  ): SchemaBuilder<C, TIdentityManager, TGlobalConfig> {
    const builder = new SchemaBuilder<C, TIdentityManager, TGlobalConfig>();
    builder._collections = collections;
    builder._identityManager = this._identityManager;
    builder._globalSerializerConfig = this._globalSerializerConfig;
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
  ): SchemaBuilder<TCollections, I, TGlobalConfig> {
    const builder = new SchemaBuilder<TCollections, I, TGlobalConfig>();
    builder._collections = this._collections;
    builder._identityManager = identityManager;
    builder._globalSerializerConfig = this._globalSerializerConfig;
    return builder;
  }

  /**
   * Sets the global serializer configuration for this schema.
   *
   * The global serializer config defines structural serialization options (root, embed)
   * that apply to all collections by default. Individual collections can override
   * these settings or provide model-specific configuration (attrs, include).
   * @template TConfig - The global serializer configuration type
   * @param config - The global serializer configuration (only root and embed)
   * @returns A new SchemaBuilder instance with the specified global serializer config
   * @example
   * ```typescript
   * const builder = schema()
   *   .serializer({ root: true, embed: false })
   *   .collections({ users: userCollection });
   * ```
   */
  serializer<TConfig extends GlobalSerializerConfig>(
    config: TConfig,
  ): SchemaBuilder<TCollections, TIdentityManager, TConfig> {
    const builder = new SchemaBuilder<TCollections, TIdentityManager, TConfig>();
    builder._collections = this._collections;
    builder._identityManager = this._identityManager;
    builder._globalSerializerConfig = config;
    return builder;
  }

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
   *   .serializer({ root: true })
   *   .identityManager(appIdentityManager)
   *   .build();
   *
   * // Use the schema
   * const userCollection = appSchema.getCollection('users');
   * const user = appSchema.users.create({ name: 'John' });
   * ```
   */
  build(): SchemaInstance<TCollections, SchemaConfig<TIdentityManager, TGlobalConfig>> {
    if (!this._collections) {
      throw new Error(
        'SchemaBuilder: collections are required. Call .collections() before .build()',
      );
    }

    const config = {
      identityManager: this._identityManager,
      globalSerializerConfig: this._globalSerializerConfig,
    } as SchemaConfig<TIdentityManager, TGlobalConfig>;

    return new Schema(this._collections, config) as SchemaInstance<
      TCollections,
      SchemaConfig<TIdentityManager, TGlobalConfig>
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
