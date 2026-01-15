import type { Factory } from '@src/factory';
import type { IdentityManagerConfig } from '@src/id-manager';
import type { ModelIdFor, ModelRelationships, ModelTemplate } from '@src/model';
import { Serializer, type SerializerConfig } from '@src/serializer';
import { MirageError } from '@src/utils';

import type {
  CollectionConfig,
  FixtureConfig,
  FixtureLoadStrategy,
  FixtureAttrs,
  SchemaCollections,
  Seeds,
} from './types';

const SUPPORTED_RELATIONSHIP_TYPES = ['hasMany', 'belongsTo'];

/**
 * A fluent builder for creating schema collection configurations.
 *
 * The CollectionBuilder provides a type-safe way to construct CollectionConfig instances
 * with configurable model template, factory, relationships, serializer, and identity manager. It follows
 * the builder pattern, allowing method chaining to progressively configure the collection.
 * @template TTemplate - The model template type
 * @template TSchema - The schema collections type
 * @template TRelationships - The model relationships configuration
 * @template TFactory - The factory type
 * @template TSerializer - The serializer type
 * @example
 * ```typescript
 * const userCollection = collection(UserModel)
 *   .relationships({
 *     posts: relations.hasMany(PostModel),
 *   })
 *   .factory(userFactory)
 *   .identityManager({ initialCounter: '1' })
 *   .build();
 * ```
 */
export default class CollectionBuilder<
  TTemplate extends ModelTemplate = ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = {},
  TFactory extends Factory<TTemplate, any, any> = Factory<
    TTemplate,
    string,
    SchemaCollections
  >,
  TSerializer extends Serializer<any, any, any, any> = Serializer<
    ModelTemplate,
    TSchema
  >,
> {
  private _factory?: TFactory;
  private _fixtures?: FixtureConfig<TTemplate, TRelationships>;
  private _identityManager?: IdentityManagerConfig<ModelIdFor<TTemplate>>;
  private _relationships?: TRelationships;
  private _seeds?: Seeds<TSchema>;
  private _serializer?: SerializerConfig<TTemplate, TSchema> | TSerializer;
  private _template?: TTemplate;

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
    Factory<T, any, any>,
    Serializer<T, TSchema>
  > {
    // Validate model template structure
    if (!template || typeof template !== 'object') {
      throw new MirageError(
        'Invalid model template. Expected a ModelTemplate object created with model().name(...).collection(...).build().',
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
      Factory<T, any, any>,
      Serializer<T, TSchema>
    >();
    builder._template = template;
    // Preserve factory if it exists, casting it to the new template type
    // This allows for flexibility in the builder pattern while maintaining type safety at build time
    builder._factory = this._factory as unknown as typeof builder._factory;
    builder._relationships = this._relationships;
    builder._serializer = this
      ._serializer as unknown as typeof builder._serializer;
    builder._identityManager = this
      ._identityManager as unknown as typeof builder._identityManager;
    builder._seeds = this._seeds;
    builder._fixtures = this._fixtures as unknown as typeof builder._fixtures;
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
  ): CollectionBuilder<TTemplate, TSchema, TRelationships, F, TSerializer> {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      F,
      TSerializer
    >();
    builder._template = this._template;
    builder._factory = factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._serializer = this._serializer;
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
   *     posts: relations.hasMany(PostModel),
   *     profile: relations.belongsTo(profileTemplate),
   *   });
   * ```
   */
  relationships<R extends ModelRelationships>(
    relationships: R,
  ): CollectionBuilder<TTemplate, TSchema, R, TFactory, TSerializer> {
    // Validate relationships configuration
    if (!relationships || typeof relationships !== 'object') {
      throw new MirageError(
        'Invalid relationships configuration. Expected an object with relationship definitions.',
      );
    }

    for (const key in relationships) {
      const relationship = relationships[key];
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
      TSerializer
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = relationships;
    builder._identityManager = this._identityManager;
    builder._serializer = this._serializer;
    builder._seeds = this._seeds;
    builder._fixtures = this._fixtures as typeof builder._fixtures;
    return builder;
  }

  /**
   * Sets the serializer configuration or instance for this collection.
   *
   * Accepts either a configuration object (attrs, root, embed, include) or a custom
   * serializer instance. The config will be merged with global schema config if present.
   * @template S - The serializer type (inferred from the instance passed)
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
  serializer<
    S extends Serializer<TTemplate, TSchema> = Serializer<TTemplate, TSchema>,
  >(
    configOrSerializer: SerializerConfig<TTemplate, TSchema> | S,
  ): CollectionBuilder<TTemplate, TSchema, TRelationships, TFactory, S> {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      TFactory,
      S
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._seeds = this._seeds;
    builder._fixtures = this._fixtures;
    builder._serializer = configOrSerializer;

    return builder;
  }

  /**
   * Sets the identity manager configuration for this collection.
   *
   * The identity manager handles ID generation and management for model instances
   * in this collection. If not specified, the schema's default identity manager config
   * will be used, or string IDs starting from "1" as the ultimate default.
   *
   * The ID type is inferred from the initialCounter value. The config's ID type
   * must be compatible with the model template's ID type.
   * @param config - The identity manager configuration
   * @returns A new CollectionBuilder instance with the specified identity manager config
   * @example
   * ```typescript
   * // String IDs (default)
   * const builder = collection()
   *   .model(UserModel)
   *   .identityManager({ initialCounter: '1' });
   *
   * // Number IDs
   * const builder = collection()
   *   .model(UserModel)
   *   .identityManager({ initialCounter: 1 });
   *
   * // Custom generator
   * const builder = collection()
   *   .model(UserModel)
   *   .identityManager({
   *     initialCounter: 'uuid-1',
   *     idGenerator: (current) => `uuid-${parseInt(current.split('-')[1]) + 1}`
   *   });
   * ```
   */
  identityManager(
    config: IdentityManagerConfig<ModelIdFor<TTemplate>>,
  ): CollectionBuilder<
    TTemplate,
    TSchema,
    TRelationships,
    TFactory,
    TSerializer
  > {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      TFactory,
      TSerializer
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = config;
    builder._serializer = this._serializer;
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
    TSerializer
  > {
    const builder = new CollectionBuilder<
      TTemplate,
      TSchema,
      TRelationships,
      TFactory,
      TSerializer
    >();
    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._serializer = this._serializer;
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
    records: FixtureAttrs<TTemplate, TRelationships>[],
    options?: { strategy?: FixtureLoadStrategy },
  ): CollectionBuilder<
    TTemplate,
    TSchema,
    TRelationships,
    TFactory,
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
      TSerializer
    >();

    builder._template = this._template;
    builder._factory = this._factory;
    builder._relationships = this._relationships;
    builder._identityManager = this._identityManager;
    builder._serializer = this._serializer;
    builder._seeds = this._seeds;
    builder._fixtures = {
      records,
      strategy: options?.strategy ?? 'manual',
    };

    return builder;
  }

  /**
   * Builds the final schema collection configuration.
   * @returns The schema collection configuration
   */
  build(): CollectionConfig<
    TTemplate,
    TRelationships,
    TFactory,
    TSchema,
    TSerializer
  > {
    if (!this._template) {
      throw new MirageError(
        'Model template must be set before building collection. Call .model() first.',
      );
    }

    return {
      model: this._template,
      relationships: this._relationships,
      factory: this._factory,
      identityManager: this._identityManager,
      serializer: this._serializer,
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
 *   .build();
 *
 * // Schema-less collection
 * const userCollection = collection()
 *   .model(UserModel)
 *   .build();
 * ```
 */
export function collection<
  TSchema extends SchemaCollections = SchemaCollections,
>(): CollectionBuilder<
  ModelTemplate,
  TSchema,
  {},
  Factory<ModelTemplate, string, SchemaCollections>,
  Serializer<ModelTemplate, TSchema>
> {
  return new CollectionBuilder<
    ModelTemplate,
    TSchema,
    {},
    Factory<ModelTemplate, string, SchemaCollections>,
    Serializer<ModelTemplate, TSchema>
  >();
}
