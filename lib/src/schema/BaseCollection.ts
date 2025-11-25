import type { DbCollection, DbRecordInput, QueryOptions, WhereHelperFns } from '@src/db';
import { Factory } from '@src/factory';
import type { IdentityManager } from '@src/id-manager';
import {
  Model,
  ModelCollection,
  ModelCreateAttrs,
  ModelId,
  type ModelAttrs,
  type ModelClass,
  type ModelConfig,
  type ModelInstance,
  type ModelRelationships,
  type ModelTemplate,
  type RelationshipsByTemplate,
} from '@src/model';
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
  TFactory extends Factory<TTemplate, string, TSchema> = Factory<TTemplate, string, TSchema>,
  TSerializer = undefined,
> {
  readonly template: TTemplate;
  readonly modelName: string;
  readonly collectionName: string;

  public readonly Model: ModelClass<TTemplate, TSchema, TSerializer>;
  public readonly dbCollection: DbCollection<ModelAttrs<TTemplate, TSchema>>;
  public readonly identityManager: IdentityManager<ModelAttrs<TTemplate, TSchema>['id']>;
  public readonly relationships?: TRelationships;
  public readonly serializer?: TSerializer;

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
      serializer?: TSerializer;
      identityManager?: IdentityManager<ModelId<TTemplate>>;
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
    this.serializer = serializer;

    this._schema = schema;
    this._logger = schema.logger;
    this._factory = factory ?? (new Factory(model) as TFactory);
    this._fixtures = fixtures;
    this._seeds = seeds;

    this.Model = Model.define<TTemplate, TSchema, TSerializer>(model);
    this.dbCollection = this._initializeDbCollection(identityManager);
    this.identityManager = this.dbCollection.identityManager;

    this._logger?.debug(`Collection '${this.collectionName}' initialized`, {
      modelName: this.modelName,
      hasFactory: !!factory,
      hasRelationships: !!relationships && Object.keys(relationships).length > 0,
      hasSeeds: !!seeds,
      hasFixtures: !!fixtures,
    });
  }

  /**
   * Get a model by index.
   * @param index - The index of the model to get.
   * @returns The model instance or undefined if not found.
   */
  at(index: number): ModelInstance<TTemplate, TSchema, TSerializer> | undefined {
    const record = this.dbCollection.at(index);
    return record ? this._createModelFromRecord(record) : undefined;
  }

  /**
   * Returns all model instances in the collection.
   * @returns All model instances in the collection.
   */
  all(): ModelCollection<TTemplate, TSchema, TSerializer> {
    this._logger?.debug(`Query '${this.collectionName}': all()`, {
      operation: 'all',
    });

    const records = this.dbCollection.all();
    this._logger?.debug(`Query '${this.collectionName}' returned ${records.length} records`);

    const models = records.map((record) => this._createModelFromRecord(record));
    return new ModelCollection(this.template, models, this.serializer);
  }

  /**
   * Returns the first model in the collection.
   * @returns The first model in the collection or null if the collection is empty.
   */
  first(): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    this._logger?.debug(`Query '${this.collectionName}': first()`);

    const record = this.dbCollection.first();
    if (record) {
      this._logger?.debug(`Query '${this.collectionName}' found record`, { id: record.id });
    }
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Returns the last model in the collection.
   * @returns The last model in the collection or null if the collection is empty.
   */
  last(): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    this._logger?.debug(`Query '${this.collectionName}': last()`);

    const record = this.dbCollection.last();
    if (record) {
      this._logger?.debug(`Query '${this.collectionName}' found record`, { id: record.id });
    }
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
  ): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    this._logger?.debug(`Find in '${this.collectionName}'`, {
      query: typeof input === 'object' && 'where' in input ? 'QueryOptions' : input,
    });

    // Handle QueryOptions with callback where clause
    if (typeof input === 'object' && 'where' in input && typeof input.where === 'function') {
      const queryOptions = this._convertQueryOptionsCallback(input);
      const record = this.dbCollection.find(queryOptions);
      if (record) {
        this._logger?.debug(`Find in '${this.collectionName}' found record`, { id: record.id });
      }
      return record ? this._createModelFromRecord(record) : null;
    }

    const record = this.dbCollection.find(input);
    if (record) {
      this._logger?.debug(`Find in '${this.collectionName}' found record`, { id: record.id });
    }
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds multiple models by IDs, predicate object, or query options.
   * @param input - The array of IDs, predicate object, or query options to find by.
   * @returns A collection of matching model instances.
   * @example
   * ```typescript
   * // Find by IDs
   * collection.findMany(['1', '2', '3']);
   *
   * // Find by predicate object
   * collection.findMany({ status: 'active' });
   *
   * // Find with query options
   * collection.findMany({
   *   where: { age: { gte: 18 } },
   *   orderBy: { name: 'asc' },
   *   limit: 10
   * });
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
  ): ModelCollection<TTemplate, TSchema, TSerializer> {
    this._logger?.debug(`Query '${this.collectionName}': findMany`, {
      query: Array.isArray(input)
        ? `${input.length} IDs`
        : typeof input === 'object' && 'where' in input
          ? 'QueryOptions'
          : input,
    });

    // Handle QueryOptions with callback where clause
    if (typeof input === 'object' && 'where' in input && typeof input.where === 'function') {
      const queryOptions = this._convertQueryOptionsCallback(input);
      const records = this.dbCollection.findMany(queryOptions);

      this._logger?.debug(`Query '${this.collectionName}' returned ${records.length} records`);

      const models = records.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this.template, models, this.serializer);
    }

    const records = this.dbCollection.findMany(input);
    this._logger?.debug(`Query '${this.collectionName}' returned ${records.length} records`);

    const models = records.map((record) => this._createModelFromRecord(record));
    return new ModelCollection(this.template, models, this.serializer);
  }

  /**
   * Deletes a model from the collection.
   * @param id - The id of the model to delete.
   */
  delete(id: ModelAttrs<TTemplate, TSchema>['id']): void {
    this._logger?.debug(`Delete from '${this.collectionName}'`, { id });
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
    this._logger?.debug(`Delete many from '${this.collectionName}'`, {
      query: Array.isArray(input) ? `${input.length} IDs` : input,
    });

    // Handle QueryOptions with callback where clause
    if (typeof input === 'object' && 'where' in input && typeof input.where === 'function') {
      const queryOptions = this._convertQueryOptionsCallback(input);
      const count = this.dbCollection.deleteMany(queryOptions);

      this._logger?.debug(`Deleted ${count} records from '${this.collectionName}'`);

      return count;
    }

    const count = this.dbCollection.deleteMany(input);
    this._logger?.debug(`Deleted ${count} records from '${this.collectionName}'`);
    return count;
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
      model: ModelInstance<TTemplate, TSchema, TSerializer>,
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
  ): ModelInstance<TTemplate, TSchema, TSerializer> {
    return new this.Model({
      attrs: record as ModelCreateAttrs<TTemplate, TSchema>,
      relationships: this.relationships as unknown as RelationshipsByTemplate<TTemplate, TSchema>,
      schema: this._schema,
      serializer: this.serializer,
    } as unknown as ModelConfig<
      TTemplate,
      TSchema,
      RelationshipsByTemplate<TTemplate, TSchema>,
      TSerializer
    >) as ModelInstance<TTemplate, TSchema, TSerializer>;
  }

  /**
   * Initialize and create the database collection if needed
   * @param identityManager - The identity manager to use for the collection
   * @returns The database collection instance
   * @private
   */
  private _initializeDbCollection(
    identityManager?: IdentityManager<ModelId<TTemplate>>,
  ): DbCollection<ModelAttrs<TTemplate, TSchema>> {
    if (!this._schema.db.hasCollection(this.collectionName)) {
      this._schema.db.createCollection(this.collectionName, {
        identityManager: identityManager,
      });
    }
    return this._schema.db.getCollection(this.template.collectionName) as unknown as DbCollection<
      ModelAttrs<TTemplate, TSchema>
    >;
  }
}
