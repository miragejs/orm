import type { Factory, ModelTraits } from '@src/factory';
import type { IdentityManager, StringIdentityManager } from '@src/id-manager';
import type { ModelTemplate, ModelRelationships } from '@src/model';
import { MirageError } from '@src/utils';

import type { SchemaCollectionConfig, SchemaCollections } from './types';

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
 * @example
 * ```typescript
 * const userCollection = collection(UserModel)
 *   .relationships({
 *     posts: associations.hasMany(PostModel),
 *   })
 *   .factory(userFactory)
 *   .identityManager(userIdentityManager)
 *   .create();
 * ```
 */
export default class CollectionBuilder<
  TTemplate extends ModelTemplate<any, any, any> = ModelTemplate<any, any, any>,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = {},
  TFactory extends
    | Factory<TTemplate, TSchema, ModelTraits<TSchema, TTemplate>>
    | undefined = undefined,
  TIdentityManager extends IdentityManager = StringIdentityManager,
  TSerializer = undefined,
> {
  private _template?: TTemplate;
  private _factory?: TFactory;
  private _relationships?: TRelationships;
  private _identityManager?: TIdentityManager;
  private _serializer?: TSerializer;

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
  model<T extends ModelTemplate<any, any, any>>(
    template: T,
  ): CollectionBuilder<
    T,
    TSchema,
    TRelationships,
    TFactory extends undefined ? undefined : Factory<T, TSchema, ModelTraits<TSchema, T>>,
    TIdentityManager,
    TSerializer
  > {
    const builder = new CollectionBuilder<
      T,
      TSchema,
      TRelationships,
      TFactory extends undefined ? undefined : Factory<T, TSchema, ModelTraits<TSchema, T>>,
      TIdentityManager,
      TSerializer
    >();
    builder._template = template;
    // Preserve factory if it exists, casting it to the new template type
    // This allows for flexibility in the builder pattern while maintaining type safety at build time
    builder._factory = this._factory as any;
    builder._relationships = this._relationships;
    builder._serializer = this._serializer;
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
   * const builder = collection(UserModel).factory(userFactory);
   * ```
   */
  factory<F extends Factory<any, any, any>>(
    factory: F,
  ): CollectionBuilder<TTemplate, TSchema, TRelationships, F, TIdentityManager, TSerializer> {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      F,
      TIdentityManager,
      TSerializer
    >();
    builder._template = this._template;
    builder._factory = factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._serializer = this._serializer;
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
   * const builder = collection(UserModel)
   *   .relationships({
   *     posts: associations.hasMany(PostModel),
   *     profile: associations.belongsTo(profileTemplate),
   *   });
   * ```
   */
  relationships<R extends ModelRelationships>(
    relationships: R,
  ): CollectionBuilder<TTemplate, TSchema, R, TFactory, TIdentityManager, TSerializer> {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      R,
      TFactory,
      TIdentityManager,
      TSerializer
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = relationships;
    builder._identityManager = this._identityManager;
    builder._serializer = this._serializer;
    return builder;
  }

  /**
   * Sets the serializer for this collection.
   *
   * The serializer defines how model instances should be serialized when
   * converting to API responses or other external formats.
   * @template S - The serializer type
   * @param serializer - The serializer instance
   * @returns A new CollectionBuilder instance with the specified serializer
   * @example
   * ```typescript
   * const builder = collection()
   *   .model(UserModel)
   *   .serializer(userSerializer);
   * ```
   */
  serializer<S>(
    serializer: S,
  ): CollectionBuilder<TTemplate, TSchema, TRelationships, TFactory, TIdentityManager, S> {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      TFactory,
      TIdentityManager,
      S
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._serializer = serializer;
    return builder;
  }

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
   *   .model(UserModel)
   *   .identityManager(new StringIdentityManager());
   * ```
   */
  identityManager<I extends IdentityManager<any>>(
    identityManager: I,
  ): CollectionBuilder<TTemplate, TSchema, TRelationships, TFactory, I, TSerializer> {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      TFactory,
      I,
      TSerializer
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = identityManager;
    builder._serializer = this._serializer;
    return builder;
  }

  /**
   * Creates the final schema collection configuration.
   * @returns The schema collection configuration
   */
  create(): SchemaCollectionConfig<TTemplate, TRelationships, TFactory, TSerializer> {
    if (!this._template) {
      throw new MirageError(
        'Model template must be set before creating collection. Call .model() first.',
      );
    }

    return {
      model: this._template,
      relationships: this._relationships,
      factory: this._factory,
      serializer: this._serializer,
      identityManager: this._identityManager,
    };
  }
}

/**
 * Creates a new CollectionBuilder instance for building collection configurations.
 * @template TSchema - The schema collections type (optional)
 * @returns A new CollectionBuilder instance ready for model specification
 * @example
 * ```typescript
 * // Schema-typed collection
 * const userCollection = collection<TestSchema>()
 *   .model(UserModel)
 *   .factory(userFactory)
 *   .create();
 *
 * // Schema-less collection
 * const userCollection = collection()
 *   .model(UserModel)
 *   .create();
 * ```
 */
export function collection<
  TSchema extends SchemaCollections = SchemaCollections,
>(): CollectionBuilder<ModelTemplate, TSchema, {}, undefined, StringIdentityManager, undefined> {
  return new CollectionBuilder<
    ModelTemplate,
    TSchema,
    {},
    undefined,
    StringIdentityManager,
    undefined
  >();
}
