import type { DbCollection, DbRecordInput } from '@src/db';
import type { Factory, ModelTraits, TraitName } from '@src/factory';
import type { IdentityManager } from '@src/id-manager';
import {
  ModelCollection,
  PartialModelAttrs,
  defineModel,
  type ModelAttrs,
  type ModelClass,
  type ModelInstance,
  type ModelRelationships,
  type ModelToken,
  type NewModelAttrs,
  type NewModelInstance,
} from '@src/model';

import type { SchemaInstance } from './Schema';
import type { SchemaCollectionConfig, SchemaCollections } from './types';

/**
 * Base schema collection with query functionality.
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TToken - The model token type (most important for users)
 * @template TRelationships - The raw relationships configuration for this collection (inferred from config)
 * @template TTraits - The factory traits type (inferred from config)
 */
abstract class BaseSchemaCollection<
  TSchema extends SchemaCollections = SchemaCollections,
  TToken extends ModelToken = ModelToken,
  TRelationships extends ModelRelationships | undefined = undefined,
  TTraits extends ModelTraits<TToken, TRelationships> = ModelTraits<TToken, TRelationships>,
> {
  protected readonly token: TToken;
  protected readonly collectionName: string;
  protected readonly modelClass: ModelClass<TToken, TSchema>;

  protected readonly schema: SchemaInstance<TSchema>;
  protected readonly dbCollection: DbCollection<ModelAttrs<TToken>>;
  protected readonly factory?: Factory<TToken, TRelationships, TTraits>;
  public readonly relationships?: TRelationships;
  protected readonly identityManager?: IdentityManager<ModelAttrs<TToken>['id']>;

  constructor(
    schema: SchemaInstance<TSchema>,
    config: {
      model: TToken;
      factory?: Factory<TToken, TRelationships, TTraits>;
      identityManager?: IdentityManager<ModelAttrs<TToken>['id']>;
      relationships?: TRelationships;
    },
  ) {
    const { model, factory, identityManager, relationships } = config;

    this.token = model;
    this.collectionName = model.collectionName;
    this.modelClass = defineModel<TToken, TSchema>(model);

    this.schema = schema;
    this.factory = factory;
    this.relationships = relationships;
    this.identityManager = identityManager;
    this.dbCollection = this._initializeDbCollection(identityManager);
  }

  /**
   * Get a model by index.
   * @param index - The index of the model to get.
   * @returns The model instance or undefined if not found.
   */
  at(index: number): ModelInstance<TToken, TSchema> | undefined {
    const record = this.dbCollection.get(index);
    return record ? this._createModelFromRecord(record) : undefined;
  }

  /**
   * Returns all model instances in the collection.
   * @returns All model instances in the collection.
   */
  all(): ModelCollection<TToken, TSchema> {
    const records = this.dbCollection.all();
    const models = records.map((record) => this._createModelFromRecord(record));
    return new ModelCollection(this.token, models);
  }

  /**
   * Returns the first model in the collection.
   * @returns The first model in the collection or null if the collection is empty.
   */
  first(): ModelInstance<TToken, TSchema> | null {
    const record = this.dbCollection.first();
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Returns the last model in the collection.
   * @returns The last model in the collection or null if the collection is empty.
   */
  last(): ModelInstance<TToken, TSchema> | null {
    const record = this.dbCollection.last();
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds a model by id.
   * @param id - The id of the model to find.
   * @returns The model instance or null if not found.
   */
  find(id: ModelAttrs<TToken>['id']): ModelInstance<TToken, TSchema> | null {
    const record = this.dbCollection.find(id);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds the first model matching the query.
   * @param query - The query to find the model by.
   * @returns The model instance or null if not found.
   */
  findBy(query: DbRecordInput<ModelAttrs<TToken>>): ModelInstance<TToken, TSchema> | null {
    const record = this.dbCollection.find(query);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(query: DbRecordInput<ModelAttrs<TToken>>): ModelCollection<TToken, TSchema>;
  /**
   * Finds all models matching the query.
   * @param query - The function to filter models by.
   * @returns All models matching the query.
   */
  where(
    query: (model: ModelInstance<TToken, TSchema>) => boolean,
  ): ModelCollection<TToken, TSchema>;
  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(
    query: DbRecordInput<ModelAttrs<TToken>> | ((model: ModelInstance<TToken, TSchema>) => boolean),
  ): ModelCollection<TToken, TSchema> {
    const records = this.dbCollection.all();

    if (typeof query === 'function') {
      const matchingRecords = records.filter((record) =>
        query(this._createModelFromRecord(record)),
      );
      const models = matchingRecords.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this.token, models);
    } else {
      const matchingRecords = this.dbCollection.findMany(query);
      const models = matchingRecords.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this.token, models);
    }
  }

  /**
   * Deletes a model from the collection.
   * @param id - The id of the model to delete.
   */
  delete(id: ModelAttrs<TToken>['id']): void {
    this.dbCollection.delete(id);
  }

  /**
   * Deletes multiple models from the collection.
   * @param ids - The ids of the models to delete.
   */
  deleteMany(ids: ModelAttrs<TToken>['id'][]): void {
    this.dbCollection.deleteMany(ids);
  }

  /**
   * Helper to create a model instance from a database record.
   * @param record - The database record to create the model from (must have ID).
   * @returns The model instance.
   */
  protected _createModelFromRecord(record: ModelAttrs<TToken>): ModelInstance<TToken, TSchema> {
    return new this.modelClass({
      attrs: record as NewModelAttrs<TToken>,
      collection: this.dbCollection,
      relationships: this.relationships,
      schema: this.schema,
    }).save();
  }

  /**
   * Initialize and create the database collection if needed
   * @param identityManager - The identity manager to use for the collection
   * @returns The database collection instance
   * @private
   */
  private _initializeDbCollection(
    identityManager?: IdentityManager<ModelAttrs<TToken>['id']>,
  ): DbCollection<ModelAttrs<TToken>> {
    if (!this.schema.db.hasCollection(this.collectionName)) {
      this.schema.db.createCollection(this.collectionName, {
        identityManager: identityManager,
      });
    }
    return this.schema.db.getCollection(this.token.collectionName) as unknown as DbCollection<
      ModelAttrs<TToken>
    >;
  }
}

/**
 * Schema collection for managing models of a specific type
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TToken - The model token type (most important for users)
 * @template TRelationships - The raw relationships configuration for this collection (inferred from config)
 * @template TTraits - The factory traits type (inferred from config)
 */
export default class SchemaCollection<
  TSchema extends SchemaCollections = SchemaCollections,
  TToken extends ModelToken = ModelToken,
  TRelationships extends ModelRelationships | undefined = undefined,
  TTraits extends ModelTraits<TToken, TRelationships> = ModelTraits<TToken, TRelationships>,
> extends BaseSchemaCollection<TSchema, TToken, TRelationships, TTraits> {
  /**
   * Create a new model for the collection.
   * @param traitsAndDefaults - The traits or default values to use for the model.
   * @returns The new model instance.
   */
  create(
    ...traitsAndDefaults: (TraitName<TTraits> | PartialModelAttrs<TToken>)[]
  ): ModelInstance<TToken, TSchema> {
    if (this.factory) {
      const attrs = this.factory.build(this.dbCollection.nextId, ...traitsAndDefaults);
      const model = this.new(attrs as PartialModelAttrs<TToken>).save();
      this.factory.processAfterCreateHooks(model, ...traitsAndDefaults);
      return model;
    }

    const defaults =
      traitsAndDefaults.find((arg) => typeof arg !== 'string') || ({} as PartialModelAttrs<TToken>);
    const model = this.new({
      ...defaults,
      id: this.dbCollection.nextId,
    }).save();

    return model;
  }

  /**
   * Create a list of models for the collection.
   * @param count - The number of models to create.
   * @param traitsAndDefaults - The traits or default values to use for the models.
   * @returns A list of model instances.
   */
  createList(
    count: number,
    ...traitsAndDefaults: (TraitName<TTraits> | PartialModelAttrs<TToken>)[]
  ): ModelCollection<TToken, TSchema> {
    const models = Array.from({ length: count }, () => this.create(...traitsAndDefaults));
    return new ModelCollection(this.token, models);
  }

  /**
   * Creates a new model instance (not persisted in the database).
   * @param attrs - The attributes to create the model with. All required attributes must be provided.
   * @returns The new model instance.
   */
  new(attrs?: PartialModelAttrs<TToken>): NewModelInstance<TToken, TSchema> {
    return new this.modelClass({
      attrs: attrs,
      collection: this.dbCollection,
      relationships: this.relationships,
      schema: this.schema,
    });
  }

  /**
   * Finds the first model matching the query or creates a new one.
   * @param query - The query to find the model by.
   * @param traitsAndDefaults - The traits or default values to use when creating a new model.
   * @returns The model instance.
   */
  findOrCreateBy(
    query: DbRecordInput<ModelAttrs<TToken>>,
    ...traitsAndDefaults: (TraitName<TTraits> | PartialModelAttrs<TToken>)[]
  ): ModelInstance<TToken, TSchema> {
    const existingModel = this.findBy(query);
    if (existingModel) {
      return existingModel;
    }

    const newModel = this.create(query as PartialModelAttrs<TToken>, ...traitsAndDefaults);
    return newModel;
  }
}

/**
 * Create a schema collection with relationship support.
 * @param schema - The schema instance
 * @param config - The collection configuration
 * @returns A schema collection with inferred types
 */
export function createSchemaCollection<
  TSchema extends SchemaCollections,
  TConfig extends SchemaCollectionConfig<any, any, any>,
>(
  schema: SchemaInstance<TSchema>,
  config: TConfig,
): TConfig extends SchemaCollectionConfig<infer TToken, infer TRelationships, infer TTraits>
  ? SchemaCollection<TSchema, TToken, TRelationships, TTraits>
  : never {
  return new SchemaCollection(schema, config) as any;
}
