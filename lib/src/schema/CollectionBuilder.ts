import type { Factory, ModelTraits } from '@src/factory';
import type { IdentityManager } from '@src/id-manager';
import type { ModelToken, ModelRelationships } from '@src/model';
// import type { Serializer } from '@src/serializer';

import type { SchemaCollectionConfig } from './types';

/**
 * A fluent builder for creating schema collection configurations.
 *
 * The CollectionBuilder provides a type-safe way to construct SchemaCollectionConfig instances
 * with configurable token, factory, relationships, serializer, and identity manager. It follows
 * the builder pattern, allowing method chaining to progressively configure the collection.
 * @template TToken - The model token type
 * @template TRelationships - The model relationships configuration
 * @template TTraits - The factory traits type
 * @template TIdentityManager - The identity manager type
 * @template TSerializer - The serializer type (temporarily disabled)
 * @example
 * ```typescript
 * const userCollection = collection
 *   .token(userToken)
 *   .factory(userFactory)
 *   .relationships({
 *     posts: associations.hasMany(postToken),
 *   })
 *   .identityManager(userIdentityManager)
 *   .build();
 * ```
 */
export default class CollectionBuilder<
  TToken extends ModelToken = never,
  TRelationships extends ModelRelationships | undefined = undefined,
  TTraits extends ModelTraits<TToken, TRelationships> = ModelTraits<TToken, TRelationships>,
  TIdentityManager extends IdentityManager = never,
  // TSerializer extends Serializer<any, any> = never,
> {
  private _token?: TToken;
  private _factory?: Factory<TToken, TRelationships, TTraits>;
  private _relationships?: TRelationships;
  // private _serializer?: TSerializer;
  private _identityManager?: TIdentityManager;

  /**
   * Creates a new CollectionBuilder instance.
   * @private
   */
  constructor() {}

  /**
   * Sets the model token for this collection.
   *
   * The token defines the model type, serialization types, and collection name
   * for this collection configuration.
   * @template T - The model token type
   * @param token - The model token instance
   * @returns A new CollectionBuilder instance with the specified token
   * @example
   * ```typescript
   * const builder = collection.token(userToken);
   * ```
   */
  token<T extends ModelToken>(
    token: T,
  ): CollectionBuilder<T, TRelationships, ModelTraits<T, TRelationships>, TIdentityManager> {
    const builder = new CollectionBuilder<
      T,
      TRelationships,
      ModelTraits<T, TRelationships>,
      TIdentityManager
    >();
    builder._token = token;
    builder._factory = this._factory as any;
    builder._relationships = this._relationships;
    // builder._serializer = this._serializer as any;
    builder._identityManager = this._identityManager;
    return builder;
  }

  /**
   * Sets the factory for creating model instances.
   *
   * The factory provides default attributes and traits for creating new model instances
   * in this collection.
   * @template F - The factory type
   * @param factory - The factory instance
   * @returns A new CollectionBuilder instance with the specified factory
   * @example
   * ```typescript
   * const builder = collection
   *   .token(userToken)
   *   .factory(userFactory);
   * ```
   */
  factory<F extends Factory<TToken, TRelationships, any>>(
    factory: F,
  ): CollectionBuilder<
    TToken,
    TRelationships,
    F extends Factory<TToken, TRelationships, infer TTraits>
      ? TTraits
      : ModelTraits<TToken, TRelationships>,
    TIdentityManager
  > {
    const builder = new CollectionBuilder<
      TToken,
      TRelationships,
      F extends Factory<TToken, TRelationships, infer TTraits>
        ? TTraits
        : ModelTraits<TToken, TRelationships>,
      TIdentityManager
    >();
    builder._token = this._token;
    builder._factory = factory as any;
    builder._relationships = this._relationships;
    // builder._serializer = this._serializer as any;
    builder._identityManager = this._identityManager;
    return builder;
  }

  /**
   * Sets the relationships configuration for this collection.
   *
   * Relationships define how this model relates to other models in the schema,
   * including belongsTo and hasMany associations.
   * @template R - The relationships type
   * @param relationships - The relationships configuration object
   * @returns A new CollectionBuilder instance with the specified relationships
   * @example
   * ```typescript
   * const builder = collection
   *   .token(userToken)
   *   .relationships({
   *     posts: associations.hasMany(postToken),
   *     profile: associations.belongsTo(profileToken),
   *   });
   * ```
   */
  relationships<R extends ModelRelationships>(
    relationships: R,
  ): CollectionBuilder<TToken, R, ModelTraits<TToken, R>, TIdentityManager> {
    const builder = new CollectionBuilder<TToken, R, ModelTraits<TToken, R>, TIdentityManager>();
    builder._token = this._token;
    builder._factory = this._factory as any;
    builder._relationships = relationships;
    // builder._serializer = this._serializer as any;
    builder._identityManager = this._identityManager;
    return builder;
  }

  /**
   * Sets the serializer for this collection.
   * TEMPORARILY DISABLED - Serializer is not ready yet
   *
   * The serializer defines how model instances should be serialized when
   * converting to API responses or other external formats.
   * @template S - The serializer type
   * @param serializer - The serializer instance
   * @returns A new CollectionBuilder instance with the specified serializer
   * @example
   * ```typescript
   * const builder = collection
   *   .token(userToken)
   *   .serializer(userSerializer);
   * ```
   */
  /*
  serializer<S extends Serializer<any, any>>(
    serializer: S,
  ): CollectionBuilder<TToken, TRelationships, TTraits, TIdentityManager, S> {
    const builder = new CollectionBuilder<TToken, TRelationships, TTraits, TIdentityManager, S>();
    builder._token = this._token;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._serializer = serializer;
    builder._identityManager = this._identityManager;
    return builder;
  }
  */

  /**
   * Sets the identity manager for this collection.
   *
   * The identity manager handles ID generation and management for model instances
   * in this collection. If not specified, the schema's global identity manager will be used.
   * @template I - The identity manager type
   * @param identityManager - The identity manager instance
   * @returns A new CollectionBuilder instance with the specified identity manager
   * @example
   * ```typescript
   * const builder = collection
   *   .token(userToken)
   *   .identityManager(new StringIdentityManager());
   * ```
   */
  identityManager<I extends IdentityManager<any>>(
    identityManager: I,
  ): CollectionBuilder<TToken, TRelationships, TTraits, I> {
    const builder = new CollectionBuilder<TToken, TRelationships, TTraits, I>();
    builder._token = this._token;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    // builder._serializer = this._serializer as any;
    builder._identityManager = identityManager;
    return builder;
  }

  /**
   * Creates the final SchemaCollectionConfig with all configured options.
   *
   * This method produces the immutable collection configuration that can be used
   * in schema construction. A token must be set before calling build().
   * @returns The configured SchemaCollectionConfig instance
   * @throws Error if no token has been configured
   * @example
   * ```typescript
   * const userCollection = collection
   *   .token(userToken)
   *   .factory(userFactory)
   *   .build();
   * ```
   */
  build(): SchemaCollectionConfig<TToken, TRelationships, TTraits> {
    if (!this._token) {
      throw new Error('CollectionBuilder: token is required. Call .token() before .build()');
    }

    return {
      model: this._token,
      factory: this._factory,
      relationships: this._relationships,
      identityManager: this._identityManager as any,
    };
  }
}

/**
 * Creates a new CollectionBuilder instance for building collection configurations.
 *
 * This is the main entry point for creating collection configurations in the builder-based
 * schema API. The returned CollectionBuilder can be configured with token, factory,
 * relationships, and identity manager before building the final configuration.
 * @returns A new CollectionBuilder instance ready for configuration
 * @example
 * ```typescript
 * // Basic collection configuration
 * const userCollection = collection
 *   .token(userToken)
 *   .build();
 *
 * // Full collection configuration
 * const userCollection = collection
 *   .token(userToken)
 *   .factory(userFactory)
 *   .relationships({
 *     posts: associations.hasMany(postToken),
 *   })
 *   .identityManager(userIdentityManager)
 *   .build();
 * ```
 * @see {@link CollectionBuilder} for available configuration methods
 */
export function collection(): CollectionBuilder {
  return new CollectionBuilder();
}
