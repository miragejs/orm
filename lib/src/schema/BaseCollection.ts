import type {
  DbCollection,
  DbRecordInput,
  PaginatedResult,
  QueryOptions,
  WhereHelperFns,
} from '@src/db';
import { Factory } from '@src/factory';
import { IdentityManager, type IdentityManagerConfig } from '@src/id-manager';
import {
  Model,
  ModelCollection,
  ModelCreateAttrs,
  ModelIdFor,
  type SerializedCollectionFor,
  type SerializedModelFor,
  type ModelAttrs,
  type ModelClass,
  type ModelConfig,
  type ModelInstance,
  type ModelRelationships,
  type ModelTemplate,
  type RelationshipsByTemplate,
} from '@src/model';
import { Serializer, type SerializerOptions } from '@src/serializer';
import type { Logger } from '@src/utils';

import type { SchemaInstance } from './Schema';
import type { FixtureConfig, SchemaCollections, Seeds } from './types';

/**
 * Base collection class with query functionality.
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TTemplate - The model template type (most important for users)
 * @template TRelationships - The raw relationships configuration for this collection (inferred from config)
 * @template TFactory - The factory type (inferred from config)
 * @template TSerializer - The serializer type (inferred from config)
 */
export abstract class BaseCollection<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
  TRelationships extends ModelRelationships = {},
  TFactory extends Factory<TTemplate, string, TSchema> = Factory<
    TTemplate,
    string,
    TSchema
  >,
> {
  readonly template: TTemplate;
  readonly modelName: string;
  readonly collectionName: string;

  public readonly Model: ModelClass<TTemplate, TSchema>;
  public readonly dbCollection: DbCollection<ModelAttrs<TTemplate, TSchema>>;
  public readonly identityManager: IdentityManager<
    ModelAttrs<TTemplate, TSchema>['id']
  >;
  public readonly relationships?: TRelationships;
  public readonly serializer?: Serializer<
    TTemplate,
    TSchema,
    SerializedModelFor<TTemplate>,
    SerializedCollectionFor<TTemplate>
  >;

  protected readonly _schema: SchemaInstance<TSchema>;
  protected readonly _factory: TFactory;
  protected readonly _fixtures?: FixtureConfig<TTemplate, TRelationships>;
  protected readonly _seeds?: Seeds<TSchema>;
  protected readonly _logger?: Logger;

  /**
   * Track which seed scenarios have been loaded to prevent duplicate data.
   * Maps scenario IDs to the number of times they've been loaded.
   * @protected
   */
  protected _loadedSeeds: Map<string, number> = new Map();

  constructor(
    schema: SchemaInstance<TSchema>,
    config: {
      model: TTemplate;
      factory?: TFactory;
      relationships?: TRelationships;
      fixtures?: FixtureConfig<TTemplate, TRelationships>;
      seeds?: Seeds<TSchema>;
      serializer?:
        | SerializerOptions<TTemplate, TSchema>
        | Serializer<TTemplate, TSchema>;
      identityManager?:
        | IdentityManagerConfig<ModelIdFor<TTemplate>>
        | IdentityManager<ModelIdFor<TTemplate>>;
    },
  ) {
    const {
      factory,
      identityManager,
      model,
      relationships = {} as TRelationships,
      serializer,
      seeds,
      fixtures,
    } = config;

    this.template = model;
    this.modelName = model.modelName;
    this.collectionName = model.collectionName;
    this.relationships = relationships;

    // Resolve serializer: use instance directly or create from config
    this.serializer = this._resolveSerializer(model, serializer);

    this._schema = schema;
    this._logger = schema.logger;
    this._factory = factory ?? (new Factory(model) as TFactory);
    this._fixtures = fixtures;
    this._seeds = seeds;

    this.Model = Model.define<TTemplate, TSchema>(model);

    // Resolve identity manager: use instance directly or create from config
    const resolvedIdentityManager =
      this._resolveIdentityManager(identityManager);
    this.dbCollection = this._initializeDbCollection(resolvedIdentityManager);
    this.identityManager = this.dbCollection.identityManager;

    this._logger?.debug(`Collection '${this.collectionName}' initialized`, {
      modelName: this.modelName,
      hasFactory: !!factory,
      hasRelationships:
        !!relationships && Object.keys(relationships).length > 0,
      hasSeeds: !!seeds,
      hasFixtures: !!fixtures,
    });
  }

  /**
   * Get a model by index.
   * @param index - The index of the model to get.
   * @returns The model instance or undefined if not found.
   */
  at(index: number): ModelInstance<TTemplate, TSchema> | undefined {
    const record = this.dbCollection.at(index);
    return record ? this._createModelFromRecord(record) : undefined;
  }

  /**
   * Returns all model instances in the collection.
   * @returns All model instances in the collection.
   */
  all(): ModelCollection<TTemplate, TSchema> {
    const records = this.dbCollection.all();
    const models = records.map((record) => this._createModelFromRecord(record));
    return new ModelCollection(this.template, models, this.serializer);
  }

  /**
   * Returns the first model in the collection.
   * @returns The first model in the collection or null if the collection is empty.
   */
  first(): ModelInstance<TTemplate, TSchema> | null {
    const record = this.dbCollection.first();
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Returns the last model in the collection.
   * @returns The last model in the collection or null if the collection is empty.
   */
  last(): ModelInstance<TTemplate, TSchema> | null {
    const record = this.dbCollection.last();
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds a model by ID, predicate object, or query options.
   * @param input - The ID, predicate object, or query options to find by.
   * @returns The model instance or null if not found.
   * @example
   * ```typescript
   * // Find by ID
   * collection.find('1');
   *
   * // Find by predicate object
   * collection.find({ email: 'user@example.com' });
   *
   * // Find with query options
   * collection.find({ where: { age: { gte: 18 } }, orderBy: { name: 'asc' } });
   * ```
   */
  find(
    input:
      | ModelAttrs<TTemplate, TSchema>['id']
      | DbRecordInput<ModelAttrs<TTemplate, TSchema>>
      | QueryOptions<ModelAttrs<TTemplate, TSchema>>,
  ): ModelInstance<TTemplate, TSchema> | null {
    // Handle QueryOptions with callback where clause
    if (
      typeof input === 'object' &&
      'where' in input &&
      typeof input.where === 'function'
    ) {
      const queryOptions = this._convertQueryOptionsCallback(input);
      const record = this.dbCollection.find(queryOptions);
      return record ? this._createModelFromRecord(record) : null;
    }

    const record = this.dbCollection.find(input);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds multiple models by IDs, predicate object, or query options.
   * @param input - The array of IDs, predicate object, or query options to find by.
   * @returns A collection of matching model instances. When using QueryOptions,
   *          the collection includes metadata with the original query and total count.
   * @example
   * ```typescript
   * // Find by IDs
   * collection.findMany(['1', '2', '3']);
   *
   * // Find by predicate object
   * collection.findMany({ status: 'active' });
   *
   * // Find with query options (includes meta with total)
   * const result = collection.findMany({
   *   where: { age: { gte: 18 } },
   *   orderBy: { name: 'asc' },
   *   limit: 10
   * });
   * result.meta?.total; // Total matching records before pagination
   *
   * // Find with callback where clause
   * collection.findMany({
   *   where: (model) => model.age >= 18 && model.status === 'active'
   * });
   * ```
   */
  findMany(
    input:
      | ModelAttrs<TTemplate, TSchema>['id'][]
      | DbRecordInput<ModelAttrs<TTemplate, TSchema>>
      | QueryOptions<ModelAttrs<TTemplate, TSchema>>,
  ): ModelCollection<TTemplate, TSchema> {
    // Handle array of IDs - returns array from DbCollection
    if (Array.isArray(input)) {
      const records = this.dbCollection.findMany(input);
      const models = records.map((record) =>
        this._createModelFromRecord(record),
      );
      return new ModelCollection(this.template, models, this.serializer);
    }

    // Check if it's QueryOptions (has where, orderBy, cursor, offset, or limit)
    const hasQueryKeys =
      typeof input === 'object' &&
      ('where' in input ||
        'orderBy' in input ||
        'cursor' in input ||
        'offset' in input ||
        'limit' in input);

    if (hasQueryKeys) {
      // Handle QueryOptions with callback where clause
      const queryOptions =
        typeof input.where === 'function'
          ? this._convertQueryOptionsCallback(
              input as QueryOptions<ModelAttrs<TTemplate, TSchema>>,
            )
          : (input as QueryOptions<ModelAttrs<TTemplate, TSchema>>);
      const result = this.dbCollection.findMany(
        queryOptions,
      ) as PaginatedResult<ModelAttrs<TTemplate, TSchema>>;
      const models = result.records.map((record) =>
        this._createModelFromRecord(record),
      );

      return new ModelCollection(this.template, models, this.serializer, {
        query: queryOptions,
        total: result.total,
      });
    }

    // Handle predicate object - returns array from DbCollection
    const records = this.dbCollection.findMany(
      input as DbRecordInput<ModelAttrs<TTemplate, TSchema>>,
    );
    const models = records.map((record) => this._createModelFromRecord(record));
    return new ModelCollection(this.template, models, this.serializer);
  }

  /**
   * Deletes a model from the collection.
   * @param id - The id of the model to delete.
   */
  delete(id: ModelAttrs<TTemplate, TSchema>['id']): void {
    this.dbCollection.delete(id);
  }

  /**
   * Deletes multiple models by IDs, predicate object, or query options.
   * @param input - The array of IDs, predicate object, or query options to delete by.
   * @returns The number of records that were deleted.
   * @example
   * ```typescript
   * // Delete by IDs
   * collection.deleteMany(['1', '2', '3']);
   *
   * // Delete by predicate object
   * collection.deleteMany({ status: 'inactive' });
   *
   * // Delete with query options
   * collection.deleteMany({
   *   where: { age: { lt: 18 } },
   *   limit: 10
   * });
   * ```
   */
  deleteMany(
    input:
      | ModelAttrs<TTemplate, TSchema>['id'][]
      | DbRecordInput<ModelAttrs<TTemplate, TSchema>>
      | QueryOptions<ModelAttrs<TTemplate, TSchema>>,
  ): number {
    // Handle QueryOptions with callback where clause
    if (
      typeof input === 'object' &&
      'where' in input &&
      typeof input.where === 'function'
    ) {
      const queryOptions = this._convertQueryOptionsCallback(input);
      return this.dbCollection.deleteMany(queryOptions);
    }

    return this.dbCollection.deleteMany(input);
  }

  // -- PRIVATE METHODS --

  /**
   * Converts QueryOptions with a callback where clause to work with models instead of raw records.
   * @param options - The query options with a callback where clause
   * @returns Query options with converted where clause
   */
  private _convertQueryOptionsCallback(
    options: QueryOptions<ModelAttrs<TTemplate, TSchema>>,
  ): QueryOptions<ModelAttrs<TTemplate, TSchema>> {
    if (!options.where || typeof options.where !== 'function') {
      return options;
    }

    const modelWhereCallback = options.where as (
      model: ModelInstance<TTemplate, TSchema>,
      helpers: WhereHelperFns<ModelAttrs<TTemplate, TSchema>>,
    ) => boolean;

    // Convert to a callback that works with records
    const recordWhereCallback = (
      record: ModelAttrs<TTemplate, TSchema>,
      helpers: WhereHelperFns<ModelAttrs<TTemplate, TSchema>>,
    ): boolean => {
      const model = this._createModelFromRecord(record);
      return modelWhereCallback(model, helpers);
    };

    return {
      ...options,
      where: recordWhereCallback,
    };
  }

  /**
   * Helper to create a model instance from a database record.
   * @param record - The database record to create the model from (must have ID).
   * @returns The model instance.
   */
  protected _createModelFromRecord(
    record: ModelAttrs<TTemplate, TSchema>,
  ): ModelInstance<TTemplate, TSchema> {
    return new this.Model({
      attrs: record as ModelCreateAttrs<TTemplate, TSchema>,
      relationships: this.relationships as unknown as RelationshipsByTemplate<
        TTemplate,
        TSchema
      >,
      schema: this._schema,
      serializer: this.serializer,
    } as unknown as ModelConfig<
      TTemplate,
      TSchema,
      RelationshipsByTemplate<TTemplate, TSchema>
    >) as ModelInstance<TTemplate, TSchema>;
  }

  /**
   * Resolve serializer from config or instance.
   * If a Serializer instance is provided, use it directly.
   * If a config object is provided, create a new Serializer instance.
   * @param model - The model template
   * @param serializer - The serializer config or instance
   * @returns The resolved Serializer instance or undefined
   * @private
   */
  private _resolveSerializer(
    model: TTemplate,
    serializer?:
      | SerializerOptions<TTemplate, TSchema>
      | Serializer<TTemplate, TSchema>,
  ):
    | Serializer<
        TTemplate,
        TSchema,
        SerializedModelFor<TTemplate>,
        SerializedCollectionFor<TTemplate>
      >
    | undefined {
    if (!serializer) {
      return undefined;
    }

    if (serializer instanceof Serializer) {
      return serializer;
    }

    // It's a config object, create a new Serializer instance
    return new Serializer(model, serializer);
  }

  /**
   * Resolve identity manager from config or instance.
   * If an IdentityManager instance is provided, use it directly.
   * If a config object is provided, create a new IdentityManager instance.
   * @param identityManager - The identity manager config or instance
   * @returns The resolved IdentityManager instance or undefined
   * @private
   */
  private _resolveIdentityManager(
    identityManager?:
      | IdentityManagerConfig<ModelIdFor<TTemplate>>
      | IdentityManager<ModelIdFor<TTemplate>>,
  ): IdentityManager<ModelIdFor<TTemplate>> | undefined {
    if (!identityManager) {
      return undefined;
    }

    if (identityManager instanceof IdentityManager) {
      return identityManager;
    }

    // It's a config object, create a new IdentityManager instance
    return new IdentityManager(identityManager);
  }

  /**
   * Initialize and create the database collection if needed
   * @param identityManager - The identity manager instance for the collection
   * @returns The database collection instance
   * @private
   */
  private _initializeDbCollection(
    identityManager?: IdentityManager<ModelIdFor<TTemplate>>,
  ): DbCollection<ModelAttrs<TTemplate, TSchema>> {
    if (!this._schema.db.hasCollection(this.collectionName)) {
      this._schema.db.createCollection(this.collectionName, {
        identityManager,
      });
    }
    return this._schema.db.getCollection(
      this.template.collectionName,
    ) as unknown as DbCollection<ModelAttrs<TTemplate, TSchema>>;
  }
}
