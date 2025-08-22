import type { DbCollection, DbRecordInput } from '@src/db';
import type { Factory, TraitMap, TraitName } from '@src/factory';
import type { IdentityManager } from '@src/id-manager';
import {
  ModelCollection,
  PartialModelAttrs,
  defineModel,
  type ModelAttrs,
  type ModelClass,
  type ModelInstance,
  type ModelToken,
  type NewModelAttrs,
  type NewModelInstance,
} from '@src/model';

import Schema from './Schema';
import type { SchemaCollectionConfig } from './types';

/**
 * Create a schema collection.
 * @param schema - The schema instance
 * @param config - The collection configuration
 * @param config.model - The model token (required)
 * @param config.factory - The factory instance (optional)
 * @param config.identityManager - The identity manager (optional)
 * @returns A schema collection
 */
export function createSchemaCollection<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
>(
  schema: Schema<any>,
  config: SchemaCollectionConfig<TToken, TTraits>,
): SchemaCollection<TToken, TTraits> {
  return new SchemaCollection(schema, config.model, config.factory, config.identityManager);
}

/**
 * Base schema collection with query functionality.
 * @template TToken - The model token type
 * @template TTraits - The factory traits type (if factory is present)
 */
abstract class BaseSchemaCollection<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
> {
  protected readonly token: TToken;
  protected readonly collectionName: string;
  protected readonly modelClass: ModelClass<TToken>;

  protected readonly schema: Schema<Record<string, SchemaCollectionConfig<TToken, TTraits>>>;
  protected readonly dbCollection: DbCollection<ModelAttrs<TToken>>;
  protected readonly factory?: Factory<TToken, TTraits>;
  protected readonly identityManager?: IdentityManager<ModelAttrs<TToken>['id']>;

  constructor(
    schema: Schema<Record<string, SchemaCollectionConfig<TToken, TTraits>>>,
    token: TToken,
    factory?: Factory<TToken, TTraits>,
    identityManager?: IdentityManager<ModelAttrs<TToken>['id']>,
  ) {
    this.token = token;
    this.collectionName = token.collectionName;
    this.modelClass = defineModel(this.token);

    this.schema = schema;
    this.schema.db.createCollection(this.collectionName, {
      identityManager: identityManager,
    });
    this.dbCollection = this.schema.db.getCollection(this.collectionName);

    this.factory = factory;
    this.identityManager = identityManager;
  }

  /**
   * Returns all model instances in the collection.
   * @returns All model instances in the collection.
   */
  all(): ModelCollection<TToken> {
    const records = this.dbCollection.records;
    const models = records.map((record) => this._createModelFromRecord(record));
    return new ModelCollection(this.token, models);
  }

  /**
   * Finds a model by id.
   * @param id - The id of the model to find.
   * @returns The model instance or null if not found.
   */
  find(id: ModelAttrs<TToken>['id']): ModelInstance<TToken> | null {
    if (id == null) return null;
    const record = this.dbCollection.find(id as NonNullable<ModelAttrs<TToken>['id']>);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds the first model matching the query.
   * @param query - The query to find the model by.
   * @returns The model instance or null if not found.
   */
  findBy(query: DbRecordInput<ModelAttrs<TToken>>): ModelInstance<TToken> | null {
    const record = this.dbCollection.findBy(query);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Returns the first model in the collection.
   * @returns The first model in the collection or null if the collection is empty.
   */
  first(): ModelInstance<TToken> | null {
    const records = this.dbCollection.records;
    return records.length > 0 ? this._createModelFromRecord(records[0]) : null;
  }

  /**
   * Returns the last model in the collection.
   * @returns The last model in the collection or null if the collection is empty.
   */
  last(): ModelInstance<TToken> | null {
    const records = this.dbCollection.records;
    return records.length > 0 ? this._createModelFromRecord(records[records.length - 1]) : null;
  }

  /**
   * Creates a new model instance (not persisted in the database).
   * @param attrs - The attributes to create the model with. All required attributes must be provided.
   * @returns The new model instance.
   */
  new(attrs: PartialModelAttrs<TToken>): NewModelInstance<TToken> {
    return new this.modelClass({
      attrs: attrs,
      collection: this.dbCollection,
    });
  }

  /**
   * Removes a model from the collection.
   * @param id - The id of the model to remove.
   */
  remove(id: NonNullable<ModelAttrs<TToken>['id']>): void {
    if (id == null) return;
    this.dbCollection.remove(id);
  }

  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(query: DbRecordInput<ModelAttrs<TToken>>): ModelCollection<TToken>;
  /**
   * Finds all models matching the query.
   * @param query - The function to filter models by.
   * @returns All models matching the query.
   */
  where(query: (model: ModelInstance<TToken>) => boolean): ModelCollection<TToken>;
  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(
    query: DbRecordInput<ModelAttrs<TToken>> | ((model: ModelInstance<TToken>) => boolean),
  ): ModelCollection<TToken> {
    const records = this.dbCollection.records;

    if (typeof query === 'function') {
      const matchingRecords = records.filter((record) =>
        query(this._createModelFromRecord(record)),
      );
      const models = matchingRecords.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this.token, models);
    } else {
      const matchingRecords = this.dbCollection.where(query);
      const models = matchingRecords.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this.token, models);
    }
  }

  /**
   * Helper to create a model instance from a database record.
   * @param record - The database record to create the model from (must have ID).
   * @returns The model instance.
   */
  protected _createModelFromRecord(record: ModelAttrs<TToken>): ModelInstance<TToken> {
    return new this.modelClass({
      attrs: record as NewModelAttrs<TToken>,
      collection: this.dbCollection,
    }) as ModelInstance<TToken>;
  }
}

/**
 * Schema collection for managing models of a specific type
 * @template TToken - The model token type
 * @template TTraits - The factory traits type (if factory is present)
 */
export default class SchemaCollection<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
> extends BaseSchemaCollection<TToken, TTraits> {
  /**
   * Create a new model for the collection.
   * @param traitsAndDefaults - The traits or default values to use for the model.
   * @returns The new model instance.
   */
  create(
    ...traitsAndDefaults: (TraitName<TTraits> | PartialModelAttrs<TToken>)[]
  ): ModelInstance<TToken> {
    if (this.factory) {
      const attrs = this.factory.build(this.dbCollection.nextId, ...traitsAndDefaults);
      const model = this.new(attrs).save();

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
  ): ModelCollection<TToken> {
    const models = Array.from({ length: count }, () => this.create(...traitsAndDefaults));
    return new ModelCollection(this.token, models);
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
  ): ModelInstance<TToken> {
    const existingModel = this.findBy(query);
    if (existingModel) {
      return existingModel;
    }

    const newModel = this.create(...traitsAndDefaults);
    newModel.update(query as PartialModelAttrs<TToken>);

    return newModel as ModelInstance<TToken>;
  }
}
