import type { IdentityManagerConfig, IdType } from '@src/id-manager';
import { MirageError, type LoggerConfig } from '@src/utils';

import Schema, { type SchemaInstance } from './Schema';
import type { SchemaCollections, SchemaConfig } from './types';

/**
 * A fluent builder for creating schema instances.
 *
 * The SchemaBuilder provides a type-safe way to construct Schema instances with
 * configurable collections. It follows the builder pattern, allowing method
 * chaining to progressively configure the schema.
 *
 * You can set a default identity manager configuration at the schema level,
 * which individual collections can override with their own configuration.
 * @template TCollections - The schema collections configuration type
 * @template TIdType - The default ID type for collections (defaults to string)
 * @example
 * ```typescript
 * const appSchema = schema()
 *   .identityManager({ initialCounter: '1' }) // Default for all collections
 *   .collections({
 *     users: userCollection,
 *     posts: postCollection,
 *   })
 *   .build();
 * ```
 */
export default class SchemaBuilder<
  TCollections extends SchemaCollections = SchemaCollections,
  TIdType extends IdType = string,
> {
  private _collections?: TCollections;
  private _identityManagerConfig?: IdentityManagerConfig<TIdType>;
  private _loggingConfig?: LoggerConfig;

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
  ): SchemaBuilder<C, TIdType> {
    // Validate collections is not empty
    if (Object.keys(collections).length === 0) {
      throw new MirageError(
        'Schema must have at least one collection. Provide collection configurations in the collections() method.',
      );
    }

    // Validate collection names don't conflict with reserved Schema properties
    const RESERVED_SCHEMA_PROPS = [
      'db',
      'getCollection',
      'loadSeeds',
      'loadFixtures',
      'logger',
    ];

    for (const name of Object.keys(collections)) {
      if (RESERVED_SCHEMA_PROPS.includes(name)) {
        throw new MirageError(
          `Collection name '${name}' conflicts with existing Schema property or method.\n\n` +
            `The Schema instance has the following built-in properties and methods:\n` +
            `  - schema.db: Database instance\n` +
            `  - schema.logger: Logger instance (if logging enabled)\n` +
            `  - schema.getCollection(): Method to access collections\n` +
            `  - schema.loadSeeds(): Method to load seed data\n` +
            `  - schema.loadFixtures(): Method to load fixture data\n\n` +
            `Please use a different collection name. Reserved names: ${RESERVED_SCHEMA_PROPS.join(', ')}`,
        );
      }

      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
        throw new MirageError(
          `Collection name '${name}' is not a valid JavaScript identifier. Use only letters, numbers, underscores, and dollar signs.`,
        );
      }
    }

    const builder = new SchemaBuilder<C, TIdType>();
    builder._collections = collections;
    builder._identityManagerConfig = this._identityManagerConfig;
    builder._loggingConfig = this._loggingConfig;
    return builder;
  }

  /**
   * Sets the default identity manager configuration for all collections.
   *
   * The identity manager handles ID generation for model instances.
   * Individual collections can override this with their own configuration.
   * The ID type is inferred from the initialCounter value.
   * @template T - The ID type (inferred from initialCounter)
   * @param config - The identity manager configuration
   * @returns A new SchemaBuilder instance with the specified identity manager config
   * @example
   * ```typescript
   * // String IDs (default)
   * const builder = schema()
   *   .identityManager({ initialCounter: '1' })
   *   .collections({ users: userCollection });
   *
   * // Number IDs
   * const builder = schema()
   *   .identityManager({ initialCounter: 1 })
   *   .collections({ users: userCollection });
   *
   * // Custom ID generator
   * const builder = schema()
   *   .identityManager({
   *     initialCounter: 'uuid-1',
   *     idGenerator: (current) => `uuid-${parseInt(current.split('-')[1]) + 1}`
   *   })
   *   .collections({ users: userCollection });
   * ```
   */
  identityManager<T extends IdType>(
    config: IdentityManagerConfig<T>,
  ): SchemaBuilder<TCollections, T> {
    const builder = new SchemaBuilder<TCollections, T>();
    builder._collections = this._collections;
    builder._identityManagerConfig = config;
    builder._loggingConfig = this._loggingConfig;
    return builder;
  }

  /**
   * Sets the logging configuration for this schema.
   *
   * The logging config enables debug output for database operations, validations,
   * and other schema behavior. This is useful for debugging test setup and understanding
   * how the ORM is behaving.
   * @param config - The logging configuration (enabled, level, prefix), or undefined to skip
   * @returns A new SchemaBuilder instance with the specified logging config
   * @example
   * ```typescript
   * const builder = schema()
   *   .logging({ enabled: true, level: 'debug' })
   *   .collections({ users: userCollection });
   *
   * // Conditional logging - ignores undefined
   * const builder = schema()
   *   .logging(process.env.DEBUG ? { enabled: true, level: 'debug' } : undefined)
   *   .collections({ users: userCollection });
   * ```
   */
  logging(
    config: LoggerConfig | undefined,
  ): SchemaBuilder<TCollections, TIdType> {
    const builder = new SchemaBuilder<TCollections, TIdType>();
    builder._collections = this._collections;
    builder._identityManagerConfig = this._identityManagerConfig;
    builder._loggingConfig = config ?? this._loggingConfig;
    return builder;
  }

  /**
   * Builds the final Schema instance with all configured options.
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
   *   .build();
   *
   * // Use the schema
   * const userCollection = appSchema.getCollection('users');
   * const user = appSchema.users.create({ name: 'John' });
   * ```
   */
  build(): SchemaInstance<TCollections> {
    if (!this._collections) {
      throw new MirageError(
        'SchemaBuilder: collections are required. Call .collections() before .build()',
      );
    }

    const config: SchemaConfig<TIdType> = {
      identityManager: this._identityManagerConfig,
      logging: this._loggingConfig,
    };

    return new Schema(
      this._collections,
      config,
    ) as SchemaInstance<TCollections>;
  }
}

/**
 * Creates a new SchemaBuilder instance for building schema configurations.
 *
 * This is the main entry point for creating schemas in the builder-based API.
 * The returned SchemaBuilder can be configured with collections before setting
 * up the final schema instance.
 *
 * Each collection manages its own identity manager - configure them using
 * `collection().identityManager()` when building individual collections.
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
 * // With logging
 * const appSchema = schema()
 *   .logging({ enabled: true, level: 'debug' })
 *   .collections({
 *     users: userCollection,
 *     posts: postCollection,
 *   })
 *   .build();
 * ```
 * @see {@link SchemaBuilder} for available configuration methods
 */
export function schema(): SchemaBuilder {
  return new SchemaBuilder();
}
