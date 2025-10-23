import type { Factory, ModelTraits } from '@src/factory';
import type { IdentityManager, StringIdentityManager } from '@src/id-manager';
import type { ModelTemplate, ModelRelationships } from '@src/model';
import { Serializer, type SerializerOptions } from '@src/serializer';
import { MirageError } from '@src/utils';

import type {
  CollectionConfig,
  FixtureConfig,
  FixtureLoadStrategy,
  FixtureRecord,
  SchemaCollections,
  Seeds,
} from './types';

/**
 * A fluent builder for creating schema collection configurations.
 *
 * The CollectionBuilder provides a type-safe way to construct CollectionConfig instances
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
  TTemplate extends ModelTemplate = ModelTemplate,
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
  private _serializerConfig?: SerializerOptions<TTemplate>;
  private _serializerInstance?: TSerializer;
  private _seeds?: Seeds<TSchema>;
  private _fixtures?: FixtureConfig<TTemplate, TRelationships>;

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
  ): CollectionBuilder<
    T,
    TSchema,
    TRelationships,
    TFactory extends undefined ? undefined : Factory<T, TSchema, ModelTraits<TSchema, T>>,
    TIdentityManager,
    TSerializer
  > {
    // Validate model template structure
    if (!template || typeof template !== 'object') {
      throw new MirageError(
        'Invalid model template. Expected a ModelTemplate object created with model().name(...).collection(...).create().',
      );
    }
    if (!template.modelName) {
      throw new MirageError(
        'Model template is missing modelName property. Ensure you called .name() when building the model.',
      );
    }
    if (!template.collectionName) {
      throw new MirageError(
        'Model template is missing collectionName property. Ensure you called .collection() when building the model.',
      );
    }

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
    builder._serializerConfig = this._serializerConfig as any;
    builder._serializerInstance = this._serializerInstance;
    builder._identityManager = this._identityManager;
    builder._seeds = this._seeds;
    builder._fixtures = this._fixtures as any;
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
    builder._serializerConfig = this._serializerConfig;
    builder._serializerInstance = this._serializerInstance;
    builder._seeds = this._seeds;
    builder._fixtures = this._fixtures;
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
    // Validate relationships configuration
    if (!relationships || typeof relationships !== 'object') {
      throw new MirageError(
        'Invalid relationships configuration. Expected an object with relationship definitions.',
      );
    }

    const SUPPORTED_RELATIONSHIP_TYPES = ['hasMany', 'belongsTo'];

    for (const [key, relationship] of Object.entries(relationships)) {
      if (!relationship || typeof relationship !== 'object') {
        throw new MirageError(
          `Invalid relationship '${key}'. Expected a relationship object created with hasMany() or belongsTo().`,
        );
      }

      if (!relationship.type) {
        throw new MirageError(
          `Relationship '${key}' is missing type property. Use hasMany() or belongsTo() to create relationships.`,
        );
      }

      if (!SUPPORTED_RELATIONSHIP_TYPES.includes(relationship.type)) {
        throw new MirageError(
          `Relationship '${key}' has unsupported type '${relationship.type}'.\n\n` +
            `Supported relationship types:\n` +
            `  - hasMany: One-to-many relationship (e.g., user.posts)\n` +
            `  - belongsTo: Many-to-one relationship (e.g., post.author)\n\n` +
            `Use hasMany() or belongsTo() helpers to create relationships.`,
        );
      }

      // Validate model reference exists
      if (!relationship.targetModel) {
        throw new MirageError(
          `Relationship '${key}' is missing model reference. Ensure the relationship was created with hasMany(model) or belongsTo(model).`,
        );
      }
    }

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
    builder._serializerConfig = this._serializerConfig;
    builder._serializerInstance = this._serializerInstance;
    builder._seeds = this._seeds;
    builder._fixtures = this._fixtures as any;
    return builder;
  }

  /**
   * Sets the serializer configuration or instance for this collection.
   *
   * Accepts either a configuration object (attrs, root, embed, include) or a custom
   * serializer instance. The config will be merged with global schema config if present.
   * @param configOrSerializer - The serializer configuration object or instance
   * @returns A new CollectionBuilder instance with the specified serializer
   * @example
   * ```typescript
   * // With config
   * const builder = collection()
   *   .model(UserModel)
   *   .serializer({ attrs: ['id', 'name'], root: true });
   *
   * // With custom serializer instance
   * const builder = collection()
   *   .model(UserModel)
   *   .serializer(new CustomUserSerializer(userModel));
   * ```
   */
  serializer(
    configOrSerializer: SerializerOptions<TTemplate> | any,
  ): CollectionBuilder<TTemplate, TSchema, TRelationships, TFactory, TIdentityManager, any>;

  /**
   * Sets the serializer configuration or instance for this collection.
   * @param configOrSerializer - The serializer configuration object or instance
   * @returns A new CollectionBuilder instance with the specified serializer
   */
  serializer(
    configOrSerializer: any,
  ): CollectionBuilder<TTemplate, TSchema, TRelationships, TFactory, TIdentityManager, any> {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      TFactory,
      TIdentityManager,
      any
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._seeds = this._seeds;
    builder._fixtures = this._fixtures;

    // Determine if it's a config object or a serializer instance
    if (configOrSerializer instanceof Serializer) {
      builder._serializerInstance = configOrSerializer;
    } else {
      builder._serializerConfig = configOrSerializer;
    }

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
    builder._serializerConfig = this._serializerConfig;
    builder._serializerInstance = this._serializerInstance;
    builder._seeds = this._seeds;
    builder._fixtures = this._fixtures;
    return builder;
  }

  /**
   * Sets the seeds configuration for this collection.
   *
   * Seeds can be either a function or an object with named seed scenarios.
   * The function/methods receive the schema instance as a parameter.
   * @param seeds - A seed function or object with named seed scenarios
   * @returns A new CollectionBuilder instance with the specified seeds
   * @example
   * ```typescript
   * // With function
   * const builder = collection()
   *   .model(UserModel)
   *   .seeds((schema) => {
   *     schema.users.create({ name: 'John' });
   *   });
   *
   * // With named scenarios
   * const builder = collection()
   *   .model(UserModel)
   *   .seeds({
   *     userForm: (schema) => {
   *       schema.users.create({ name: 'John' });
   *     },
   *     userPosts: (schema) => {
   *       const user = schema.users.create({ name: 'John' });
   *       schema.posts.create({ title: 'Post 1', authorId: user.id });
   *     },
   *   });
   * ```
   */
  seeds(
    seeds: Seeds<TSchema>,
  ): CollectionBuilder<
    TTemplate,
    TSchema,
    TRelationships,
    TFactory,
    TIdentityManager,
    TSerializer
  > {
    // Validate that 'default' is not used as a scenario name
    if (typeof seeds === 'object' && !Array.isArray(seeds) && 'default' in seeds) {
      throw new MirageError(
        "The 'default' scenario name is reserved. Please use a different name for your seed scenario.",
      );
    }

    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      TFactory,
      TIdentityManager,
      TSerializer
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._serializerConfig = this._serializerConfig;
    builder._serializerInstance = this._serializerInstance;
    builder._seeds = seeds;
    builder._fixtures = this._fixtures;
    return builder;
  }

  /**
   * Sets the fixtures configuration for this collection.
   *
   * Fixtures are static data records that can be loaded into the collection.
   * @param records - Array of fixture records to load
   * @param options - Configuration options for loading fixtures
   * @param options.strategy - The strategy to use for loading fixtures (default: 'manual')
   * @returns A new CollectionBuilder instance with the specified fixtures
   * @example
   * ```typescript
   * // Manual loading (default)
   * const builder = collection()
   *   .model(UserModel)
   *   .fixtures([
   *     { id: '1', name: 'John', email: 'john@example.com' },
   *     { id: '2', name: 'Jane', email: 'jane@example.com' },
   *   ]);
   *
   * // Auto-load fixtures during schema setup
   * const builder = collection()
   *   .model(UserModel)
   *   .fixtures(
   *     [
   *       { id: '1', name: 'John', email: 'john@example.com' },
   *       { id: '2', name: 'Jane', email: 'jane@example.com' },
   *     ],
   *     { strategy: 'auto' }
   *   );
   * ```
   */
  fixtures(
    records: FixtureRecord<TTemplate, TRelationships>[],
    options?: { strategy?: FixtureLoadStrategy },
  ): CollectionBuilder<
    TTemplate,
    TSchema,
    TRelationships,
    TFactory,
    TIdentityManager,
    TSerializer
  > {
    // Validate fixtures
    if (!Array.isArray(records)) {
      throw new MirageError(
        'Fixtures must be an array of records. Pass an array of fixture objects with model attributes.',
      );
    }

    // Validate each fixture record has an id
    records.forEach((record, index) => {
      if (!record || typeof record !== 'object') {
        throw new MirageError(
          `Fixture at index ${index} is invalid. Expected an object with model attributes.`,
        );
      }
      if (record.id === undefined || record.id === null) {
        throw new MirageError(
          `Fixture at index ${index} is missing required 'id' property. All fixtures must have explicit IDs.`,
        );
      }
    });

    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      TFactory,
      TIdentityManager,
      TSerializer
    >();

    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._serializerConfig = this._serializerConfig;
    builder._serializerInstance = this._serializerInstance;
    builder._seeds = this._seeds;
    builder._fixtures = {
      records,
      strategy: options?.strategy ?? 'manual',
    };

    return builder;
  }

  /**
   * Creates the final schema collection configuration.
   * @returns The schema collection configuration
   */
  create(): CollectionConfig<TTemplate, TRelationships, TFactory, TSerializer, TSchema> {
    if (!this._template) {
      throw new MirageError(
        'Model template must be set before creating collection. Call .model() first.',
      );
    }

    return {
      model: this._template,
      relationships: this._relationships,
      factory: this._factory,
      identityManager: this._identityManager,
      serializerConfig: this._serializerConfig,
      serializerInstance: this._serializerInstance,
      seeds: this._seeds,
      fixtures: this._fixtures,
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
