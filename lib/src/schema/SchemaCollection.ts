import type { DbCollection, DbRecordInput } from '@src/db';
import { SchemaFactory } from '@src/factory';
import type { Factory, FactoryTraitNames } from '@src/factory';
import type { IdentityManager } from '@src/id-manager';
import {
  ModelCollection,
  PartialModelAttrs,
  defineModelClass,
  type ModelAttrs,
  type ModelClass,
  type ModelInstance,
  type ModelRelationships,
  type ModelTemplate,
  type NewModelInstance,
} from '@src/model';

import type { SchemaInstance } from './Schema';
import type { SchemaCollectionConfig, SchemaCollections } from './types';

/**
 * Base schema collection with query functionality.
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TTemplate - The model template type (most important for users)
 * @template TRelationships - The raw relationships configuration for this collection (inferred from config)
 * @template TFactory - The factory type (inferred from config)
 */
abstract class BaseSchemaCollection<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
  TRelationships extends ModelRelationships | undefined = undefined,
  TFactory extends Factory<TTemplate, any> = Factory<TTemplate, any>,
> {
  protected readonly _template: TTemplate;
  protected readonly collectionName: string;
  protected readonly modelClass: ModelClass<TTemplate, TSchema>;

  protected readonly schema: SchemaInstance<TSchema>;
  protected readonly dbCollection: DbCollection<ModelAttrs<TTemplate>>;
  protected readonly factory?: SchemaFactory<TSchema, TTemplate, TFactory>;
  public readonly relationships?: TRelationships;
  protected readonly identityManager?: IdentityManager<ModelAttrs<TTemplate>['id']>;

  constructor(
    schema: SchemaInstance<TSchema>,
    config: {
      model: TTemplate;
      factory?: TFactory;
      identityManager?: IdentityManager<ModelAttrs<TTemplate>['id']>;
      relationships?: TRelationships;
    },
  ) {
    const { model, factory, identityManager, relationships } = config;

    this._template = model;
    this.collectionName = model.collectionName;
    this.modelClass = defineModelClass<TTemplate, TSchema>(model);

    this.schema = schema;
    this.relationships = relationships;
    this.identityManager = identityManager;
    this.dbCollection = this._initializeDbCollection(identityManager);

    // Create schema-aware factory wrapper if factory exists
    if (factory) {
      this.factory = new SchemaFactory(factory, schema);
    }
  }

  /**
   * Get a model by index.
   * @param index - The index of the model to get.
   * @returns The model instance or undefined if not found.
   */
  at(index: number): ModelInstance<TTemplate, TSchema> | undefined {
    const record = this.dbCollection.get(index);
    return record ? this._createModelFromRecord(record) : undefined;
  }

  /**
   * Returns all model instances in the collection.
   * @returns All model instances in the collection.
   */
  all(): ModelCollection<TTemplate, TSchema> {
    const records = this.dbCollection.all();
    const models = records.map((record) => this._createModelFromRecord(record));
    return new ModelCollection(this._template, models);
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
   * Finds a model by id.
   * @param id - The id of the model to find.
   * @returns The model instance or null if not found.
   */
  find(id: ModelAttrs<TTemplate>['id']): ModelInstance<TTemplate, TSchema> | null {
    const record = this.dbCollection.find(id);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds the first model matching the query.
   * @param query - The query to find the model by.
   * @returns The model instance or null if not found.
   */
  findBy(query: DbRecordInput<ModelAttrs<TTemplate>>): ModelInstance<TTemplate, TSchema> | null {
    const record = this.dbCollection.find(query);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(query: DbRecordInput<ModelAttrs<TTemplate>>): ModelCollection<TTemplate, TSchema>;
  /**
   * Finds all models matching the query.
   * @param query - The function to filter models by.
   * @returns All models matching the query.
   */
  where(
    query: (model: ModelInstance<TTemplate, TSchema>) => boolean,
  ): ModelCollection<TTemplate, TSchema>;
  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(
    query:
      | DbRecordInput<ModelAttrs<TTemplate>>
      | ((model: ModelInstance<TTemplate, TSchema>) => boolean),
  ): ModelCollection<TTemplate, TSchema> {
    const records = this.dbCollection.all();

    if (typeof query === 'function') {
      const matchingRecords = records.filter((record) =>
        query(this._createModelFromRecord(record)),
      );
      const models = matchingRecords.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this._template, models);
    } else {
      const matchingRecords = this.dbCollection.findMany(query);
      const models = matchingRecords.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this._template, models);
    }
  }

  /**
   * Deletes a model from the collection.
   * @param id - The id of the model to delete.
   */
  delete(id: ModelAttrs<TTemplate>['id']): void {
    this.dbCollection.delete(id);
  }

  /**
   * Deletes multiple models from the collection.
   * @param ids - The ids of the models to delete.
   */
  deleteMany(ids: ModelAttrs<TTemplate>['id'][]): void {
    this.dbCollection.deleteMany(ids);
  }

  /**
   * Helper to create a model instance from a database record.
   * @param record - The database record to create the model from (must have ID).
   * @returns The model instance.
   */
  protected _createModelFromRecord(
    record: ModelAttrs<TTemplate>,
  ): ModelInstance<TTemplate, TSchema> {
    return new this.modelClass({
      attrs: record as PartialModelAttrs<TTemplate>,
      dbCollection: this.dbCollection,
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
    identityManager?: IdentityManager<ModelAttrs<TTemplate>['id']>,
  ): DbCollection<ModelAttrs<TTemplate>> {
    if (!this.schema.db.hasCollection(this.collectionName)) {
      this.schema.db.createCollection(this.collectionName, {
        identityManager: identityManager,
      });
    }
    return this.schema.db.getCollection(this._template.collectionName) as unknown as DbCollection<
      ModelAttrs<TTemplate>
    >;
  }
}

/**
 * Schema collection for managing models of a specific type
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TTemplate - The model template type (most important for users)
 * @template TRelationships - The raw relationships configuration for this collection (inferred from config)
 * @template TFactory - The factory type (inferred from config)
 */
export default class SchemaCollection<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
  TRelationships extends ModelRelationships | undefined = undefined,
  TFactory extends Factory<TTemplate, any> = Factory<TTemplate, any>,
> extends BaseSchemaCollection<TSchema, TTemplate, TRelationships, TFactory> {
  /**
   * Creates a new model instance (not persisted in the database).
   * @param attrs - The attributes to create the model with. All required attributes must be provided.
   * @returns The new model instance.
   */
  new(attrs?: PartialModelAttrs<TTemplate>): NewModelInstance<TTemplate, TSchema> {
    return new this.modelClass({
      attrs: attrs,
      dbCollection: this.dbCollection,
      relationships: this.relationships,
      schema: this.schema,
    });
  }

  /**
   * Create a new model for the collection.
   * @param traitsAndDefaults - The traits or default values to use for the model.
   * @returns The new model instance.
   */
  create(
    ...traitsAndDefaults: (FactoryTraitNames<TFactory> | PartialModelAttrs<TTemplate>)[]
  ): ModelInstance<TTemplate, TSchema> {
    const defaults =
      traitsAndDefaults.find((arg) => typeof arg !== 'string') ||
      ({} as PartialModelAttrs<TTemplate>);
    const nextId = defaults.id ?? this.dbCollection.nextId;

    if (defaults.id) {
      this.identityManager?.set(defaults.id);
    }

    if (this.factory) {
      const attrs = this.factory.build(nextId, ...traitsAndDefaults);
      const model = this.new(attrs as PartialModelAttrs<TTemplate>).save();
      return this.factory.processAfterCreateHooks(model, ...traitsAndDefaults);
    }

    const model = this.new({ ...defaults, id: nextId }).save();
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
    ...traitsAndDefaults: (FactoryTraitNames<TFactory> | PartialModelAttrs<TTemplate>)[]
  ): ModelCollection<TTemplate, TSchema> {
    const models = Array.from({ length: count }, () => this.create(...traitsAndDefaults));
    return new ModelCollection(this._template, models);
  }

  /**
   * Finds the first model matching the query or creates a new one.
   * @param query - The query to find the model by.
   * @param traitsAndDefaults - The traits or default values to use when creating a new model.
   * @returns The model instance.
   */
  findOrCreateBy(
    query: DbRecordInput<ModelAttrs<TTemplate>>,
    ...traitsAndDefaults: (FactoryTraitNames<TFactory> | PartialModelAttrs<TTemplate>)[]
  ): ModelInstance<TTemplate, TSchema> {
    const existingModel = this.findBy(query);
    if (existingModel) {
      return existingModel;
    }

    const newModel = this.create(...traitsAndDefaults, query as PartialModelAttrs<TTemplate>);
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
): TConfig extends SchemaCollectionConfig<infer TTemplate, infer TRelationships, infer TFactory>
  ? SchemaCollection<TSchema, TTemplate, TRelationships, TFactory>
  : never {
  return new SchemaCollection(schema, config) as any;
}
