import type { Factory } from '@src/factory';
import type { IdentityManager } from '@src/id-manager';
import type { ModelTemplate, ModelRelationships } from '@src/model';
// import type { Serializer } from '@src/serializer';

import type { SchemaCollectionConfig } from './types';

/**
 * A fluent builder for creating schema collection configurations.
 *
 * The CollectionBuilder provides a type-safe way to construct SchemaCollectionConfig instances
 * with configurable model template, factory, relationships, serializer, and identity manager. It follows
 * the builder pattern, allowing method chaining to progressively configure the collection.
 * @template TTemplate - The model template type
 * @template TRelationships - The model relationships configuration
 * @template TFactory - The factory type
 * @template TIdentityManager - The identity manager type
 * @template TSerializer - The serializer type (temporarily disabled)
 * @example
 * ```typescript
 * const userCollection = collection
 *   .model(userTemplate)
 *   .factory(userFactory)
 *   .relationships({
 *     posts: associations.hasMany(postTemplate),
 *   })
 *   .identityManager(userIdentityManager)
 *   .build();
 * ```
 */
export default class CollectionBuilder<
  TTemplate extends ModelTemplate = never,
  TRelationships extends ModelRelationships | undefined = undefined,
  TFactory extends Factory<TTemplate, any> = Factory<TTemplate, any>,
  TIdentityManager extends IdentityManager = never,
  // TSerializer extends Serializer<any, any> = never,
> {
  private _template?: TTemplate;
  private _factory?: TFactory;
  private _relationships?: TRelationships;
  // private _serializer?: TSerializer;
  private _identityManager?: TIdentityManager;

  /**
   * Creates a new CollectionBuilder instance.
   * @private
   */
  constructor() {}

  /**
   * Sets the model template for this collection.
   *
   * The template defines the model type, and collection name
   * for this collection configuration.
   * @template T - The model template type
   * @param template - The model template instance
   * @returns A new CollectionBuilder instance with the specified template
   * @example
   * ```typescript
   * const builder = collection.model(userTemplate);
   * ```
   */
  model<T extends ModelTemplate>(
    template: T,
  ): CollectionBuilder<T, TRelationships, Factory<T, any>, TIdentityManager> {
    const builder = new CollectionBuilder<T, TRelationships, Factory<T, any>, TIdentityManager>();
    builder._template = template;
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
   *   .model(userTemplate)
   *   .factory(userFactory);
   * ```
   */
  factory<F extends Factory<TTemplate, any>>(
    factory: F,
  ): CollectionBuilder<TTemplate, TRelationships, F, TIdentityManager> {
    const builder = new CollectionBuilder<TTemplate, TRelationships, F, TIdentityManager>();
    builder._template = this._template;
    builder._factory = factory;
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
   *   .model(userTemplate)
   *   .relationships({
   *     posts: associations.hasMany(postTemplate),
   *     profile: associations.belongsTo(profileTemplate),
   *   });
   * ```
   */
  relationships<R extends ModelRelationships>(
    relationships: R,
  ): CollectionBuilder<TTemplate, R, Factory<TTemplate, any>, TIdentityManager> {
    const builder = new CollectionBuilder<TTemplate, R, Factory<TTemplate, any>, TIdentityManager>();
    builder._template = this._template;
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
   *   .model(userTemplate)
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
   *   .model(userTemplate)
   *   .identityManager(new StringIdentityManager());
   * ```
   */
  identityManager<I extends IdentityManager<any>>(
    identityManager: I,
  ): CollectionBuilder<TTemplate, TRelationships, TFactory, I> {
    const builder = new CollectionBuilder<TTemplate, TRelationships, TFactory, I>();
    builder._template = this._template;
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
   * in schema construction. A template must be set before calling build().
   * @returns The configured SchemaCollectionConfig instance
   * @throws Error if no template has been configured
   * @example
   * ```typescript
   * const userCollection = collection
   *   .model(userTemplate)
   *   .factory(userFactory)
   *   .build();
   * ```
   */
  build(): SchemaCollectionConfig<TTemplate, TRelationships, TFactory> {
    if (!this._template) {
      throw new Error('CollectionBuilder: template is required. Call .model() before .build()');
    }

    return {
      model: this._template,
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
 * schema API. The returned CollectionBuilder can be configured with model template, factory,
 * relationships, and identity manager before building the final configuration.
 * @returns A new CollectionBuilder instance ready for configuration
 * @example
 * ```typescript
 * // Basic collection configuration
 * const userCollection = collection
 *   .model(userTemplate)
 *   .build();
 *
 * // Full collection configuration
 * const userCollection = collection
 *   .model(userTemplate)
 *   .factory(userFactory)
 *   .relationships({
 *     posts: associations.hasMany(postTemplate),
 *   })
 *   .identityManager(userIdentityManager)
 *   .build();
 * ```
 * @see {@link CollectionBuilder} for available configuration methods
 */
export function collection(): CollectionBuilder {
  return new CollectionBuilder();
}
