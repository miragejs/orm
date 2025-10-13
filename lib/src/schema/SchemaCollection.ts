import type { DbCollection, DbRecordInput } from '@src/db';
import type { Factory, FactoryTraitNames, ModelTraits } from '@src/factory';
import type { IdentityManager } from '@src/id-manager';
import {
  Model,
  ModelCollection,
  ModelCreateAttrs,
  ModelId,
  PartialModelAttrs,
  type ModelAttrs,
  type ModelClass,
  type ModelConfig,
  type ModelInstance,
  type ModelRelationships,
  type ModelTemplate,
  type NewModelInstance,
  type RelationshipsByTemplate,
} from '@src/model';

import type { SchemaInstance } from './Schema';
import type { CollectionCreateInput, SchemaCollectionConfig, SchemaCollections } from './types';

/**
 * Base schema collection with query functionality.
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TTemplate - The model template type (most important for users)
 * @template TRelationships - The raw relationships configuration for this collection (inferred from config)
 * @template TFactory - The factory type (inferred from config)
 * @template TSerializer - The serializer type (inferred from config)
 */
abstract class BaseSchemaCollection<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
  TRelationships extends ModelRelationships = {},
  TFactory extends
    | Factory<TTemplate, TSchema, ModelTraits<TSchema, TTemplate>>
    | undefined = undefined,
  TSerializer = undefined,
> {
  readonly modelName: string;
  readonly collectionName: string;
  protected readonly Model: ModelClass<TTemplate, TSchema, TSerializer>;

  protected readonly _template: TTemplate;
  protected readonly _schema: SchemaInstance<TSchema>;
  protected readonly _dbCollection: DbCollection<ModelAttrs<TTemplate, TSchema>>;
  protected readonly _identityManager: IdentityManager<ModelAttrs<TTemplate, TSchema>['id']>;

  protected readonly _factory?: TFactory;
  protected readonly _relationships?: TRelationships;
  protected readonly _serializer?: TSerializer;

  constructor(
    schema: SchemaInstance<TSchema>,
    config: {
      factory?: TFactory;
      identityManager?: IdentityManager<ModelId<TTemplate>>;
      model: TTemplate;
      relationships?: TRelationships;
      serializer?: TSerializer;
    },
  ) {
    const {
      factory,
      identityManager,
      model,
      relationships = {} as TRelationships,
      serializer,
    } = config;

    this.modelName = model.modelName;
    this.collectionName = model.collectionName;
    this.Model = Model.define<TTemplate, TSchema, TSerializer>(model);

    this._template = model;
    this._schema = schema;
    this._dbCollection = this._initializeDbCollection(identityManager);
    this._identityManager = this._dbCollection.identityManager;

    this._relationships = relationships;
    this._factory = factory;
    this._serializer = serializer;
  }

  get relationships(): TRelationships | undefined {
    return this._relationships;
  }

  get serializer(): TSerializer | undefined {
    return this._serializer;
  }

  /**
   * Get a model by index.
   * @param index - The index of the model to get.
   * @returns The model instance or undefined if not found.
   */
  at(index: number): ModelInstance<TTemplate, TSchema, TSerializer> | undefined {
    const record = this._dbCollection.at(index);
    return record ? this._createModelFromRecord(record) : undefined;
  }

  /**
   * Returns all model instances in the collection.
   * @returns All model instances in the collection.
   */
  all(): ModelCollection<TTemplate, TSchema, TSerializer> {
    const records = this._dbCollection.all();
    const models = records.map((record) => this._createModelFromRecord(record));
    return new ModelCollection(this._template, models, this._serializer);
  }

  /**
   * Returns the first model in the collection.
   * @returns The first model in the collection or null if the collection is empty.
   */
  first(): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    const record = this._dbCollection.first();
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Returns the last model in the collection.
   * @returns The last model in the collection or null if the collection is empty.
   */
  last(): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    const record = this._dbCollection.last();
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds a model by id.
   * @param id - The id of the model to find.
   * @returns The model instance or null if not found.
   */
  find(
    id: ModelAttrs<TTemplate, TSchema>['id'],
  ): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    const record = this._dbCollection.find(id);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds the first model matching the query.
   * @param query - The query to find the model by.
   * @returns The model instance or null if not found.
   */
  findBy(
    query: DbRecordInput<ModelAttrs<TTemplate, TSchema>>,
  ): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    const record = this._dbCollection.find(query);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(
    query: DbRecordInput<ModelAttrs<TTemplate, TSchema>>,
  ): ModelCollection<TTemplate, TSchema, TSerializer>;
  /**
   * Finds all models matching the query.
   * @param query - The function to filter models by.
   * @returns All models matching the query.
   */
  where(
    query: (model: ModelInstance<TTemplate, TSchema, TSerializer>) => boolean,
  ): ModelCollection<TTemplate, TSchema, TSerializer>;
  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(
    query:
      | DbRecordInput<ModelAttrs<TTemplate, TSchema>>
      | ((model: ModelInstance<TTemplate, TSchema, TSerializer>) => boolean),
  ): ModelCollection<TTemplate, TSchema, TSerializer> {
    const records = this._dbCollection.all();

    if (typeof query === 'function') {
      const matchingRecords = records.filter((record) =>
        query(this._createModelFromRecord(record)),
      );
      const models = matchingRecords.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this._template, models, this._serializer);
    } else {
      const matchingRecords = this._dbCollection.findMany(query);
      const models = matchingRecords.map((record) => this._createModelFromRecord(record));
      return new ModelCollection(this._template, models, this._serializer);
    }
  }

  /**
   * Deletes a model from the collection.
   * @param id - The id of the model to delete.
   */
  delete(id: ModelAttrs<TTemplate, TSchema>['id']): void {
    this._dbCollection.delete(id);
  }

  /**
   * Deletes multiple models from the collection.
   * @param ids - The ids of the models to delete.
   */
  deleteMany(ids: ModelAttrs<TTemplate, TSchema>['id'][]): void {
    this._dbCollection.deleteMany(ids);
  }

  // -- PRIVATE METHODS --

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
      relationships: this._relationships as unknown as RelationshipsByTemplate<TTemplate, TSchema>,
      schema: this._schema,
      serializer: this._serializer,
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
    return this._schema.db.getCollection(this._template.collectionName) as unknown as DbCollection<
      ModelAttrs<TTemplate, TSchema>
    >;
  }
}

/**
 * Schema collection for managing models of a specific type
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TTemplate - The model template type (most important for users)
 * @template TRelationships - The raw relationships configuration for this collection (inferred from config)
 * @template TFactory - The factory type (inferred from config)
 * @template TSerializer - The serializer type (inferred from config)
 */
export default class SchemaCollection<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
  TRelationships extends ModelRelationships = {},
  TFactory extends
    | Factory<TTemplate, TSchema, ModelTraits<TSchema, TTemplate>>
    | undefined = undefined,
  TSerializer = undefined,
> extends BaseSchemaCollection<TSchema, TTemplate, TRelationships, TFactory, TSerializer> {
  /**
   * Creates a new model instance (not persisted in the database).
   * @param attrs - The attributes to create the model with. All required attributes must be provided.
   * @returns The new model instance.
   */
  new(
    attrs: ModelCreateAttrs<TTemplate, TSchema>,
  ): NewModelInstance<TTemplate, TSchema, TSerializer> {
    return new this.Model({
      attrs: attrs,
      relationships: this._relationships,
      schema: this._schema,
      serializer: this._serializer,
    } as unknown as ModelConfig<
      TTemplate,
      TSchema,
      RelationshipsByTemplate<TTemplate, TSchema>,
      TSerializer
    >);
  }

  /**
   * Create a new model for the collection.
   * @param traitsAndDefaults - The traits or default values to use for the model.
   * @returns The new model instance.
   */
  create(
    ...traitsAndDefaults: (
      | FactoryTraitNames<TFactory>
      | CollectionCreateInput<TTemplate, TSchema>
    )[]
  ): ModelInstance<TTemplate, TSchema, TSerializer> {
    // Extract traits and defaults
    const traits: FactoryTraitNames<TFactory>[] = [];
    let defaults: CollectionCreateInput<TTemplate, TSchema> = {};

    traitsAndDefaults.forEach((arg) => {
      if (typeof arg === 'string') {
        traits.push(arg);
      } else {
        defaults = { ...defaults, ...arg };
      }
    });

    // Separate regular attributes from relationship values
    const { modelAttrs, relationshipUpdates } = Model._processAttrs<TTemplate, TSchema>(
      defaults,
      this._relationships as unknown as RelationshipsByTemplate<TTemplate, TSchema>,
    );

    const nextId = modelAttrs.id ?? this._dbCollection.nextId;

    // Cache the id if provided
    if (modelAttrs.id) {
      this._identityManager?.set(modelAttrs.id as ModelAttrs<TTemplate, TSchema>['id']);
    }

    if (this._factory) {
      // Build factory attrs with only regular attributes (no relationships)
      const factoryAttrs = this._factory.build(
        nextId,
        ...traits,
        modelAttrs as PartialModelAttrs<TTemplate, TSchema>,
      ) as ModelAttrs<TTemplate, TSchema>;

      // Skip associations for relationships that the user provided
      const userProvidedRelationshipKeys = Object.keys(relationshipUpdates);

      // Process associations to get relationship values (including from traits)
      const associationValues = this._factory.processAssociations(
        this._schema,
        userProvidedRelationshipKeys,
        traitsAndDefaults as (
          | FactoryTraitNames<TFactory>
          | PartialModelAttrs<TTemplate, TSchema>
        )[],
      );

      // Merge: user defaults override associations, associations override factory attrs
      const completeAttrs = {
        ...factoryAttrs,
        ...associationValues,
        ...relationshipUpdates, // User-provided relationships have highest priority
      } as ModelCreateAttrs<TTemplate, TSchema>;

      const model = this.new(completeAttrs).save();
      return this._factory.processAfterCreateHooks(
        this._schema,
        model as any,
        ...(traitsAndDefaults as (
          | FactoryTraitNames<TFactory>
          | PartialModelAttrs<TTemplate, TSchema>
        )[]),
      ) as ModelInstance<TTemplate, TSchema, TSerializer>;
    }

    // No factory - merge modelAttrs with relationship values
    const attrs = { ...modelAttrs, ...relationshipUpdates, id: nextId } as ModelCreateAttrs<
      TTemplate,
      TSchema
    >;
    const model = this.new(attrs).save();

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
    ...traitsAndDefaults: (
      | FactoryTraitNames<TFactory>
      | CollectionCreateInput<TTemplate, TSchema>
    )[]
  ): ModelCollection<TTemplate, TSchema, TSerializer> {
    const models = Array.from({ length: count }, () => this.create(...traitsAndDefaults));
    return new ModelCollection(this._template, models, this._serializer);
  }

  /**
   * Finds the first model matching the query or creates a new one.
   * @param query - The query to find the model by.
   * @param traitsAndDefaults - The traits or default values to use when creating a new model.
   * @returns The model instance.
   */
  findOrCreateBy(
    query: DbRecordInput<ModelAttrs<TTemplate, TSchema>>,
    ...traitsAndDefaults: (
      | FactoryTraitNames<TFactory>
      | CollectionCreateInput<TTemplate, TSchema>
    )[]
  ): ModelInstance<TTemplate, TSchema, TSerializer> {
    const existingModel = this.findBy(query);
    if (existingModel) {
      return existingModel;
    }

    const newModel = this.create(
      ...traitsAndDefaults,
      query as CollectionCreateInput<TTemplate, TSchema>,
    );
    return newModel;
  }

  /**
   * Finds or creates a specific number of models matching the query.
   * @param count - The number of models to find or create.
   * @param query - The query to find the models by (object or predicate function).
   * @param traitsAndDefaults - The traits or default values to use when creating new models.
   * @returns A collection of models.
   */
  findManyOrCreateBy(
    count: number,
    query:
      | DbRecordInput<ModelAttrs<TTemplate, TSchema>>
      | ((model: ModelInstance<TTemplate, TSchema, TSerializer>) => boolean),
    ...traitsAndDefaults: (
      | FactoryTraitNames<TFactory>
      | CollectionCreateInput<TTemplate, TSchema>
    )[]
  ): ModelCollection<TTemplate, TSchema, TSerializer> {
    // Find existing models matching the query
    const existingModels =
      typeof query === 'function'
        ? this.where(query)
        : this.where(query as DbRecordInput<ModelAttrs<TTemplate, TSchema>>);

    // If we have enough models, return the requested count
    if (existingModels.length >= count) {
      return new ModelCollection(
        this._template,
        existingModels.models.slice(0, count),
        this._serializer,
      );
    }

    // Calculate how many more models we need to create
    const needed = count - existingModels.length;

    // Create the remaining models
    // If query is an object, include it in the creation attributes
    const queryAttrs =
      typeof query === 'function' ? {} : (query as CollectionCreateInput<TTemplate, TSchema>);

    const newModels = Array.from({ length: needed }, () =>
      this.create(...traitsAndDefaults, queryAttrs),
    );

    // Combine existing and new models
    return new ModelCollection(
      this._template,
      [...existingModels.models, ...newModels],
      this._serializer,
    );
  }
}

/**
 * Create a schema collection with relationship support.
 * @param schema - The schema instance
 * @param config - The collection configuration
 * @returns A schema collection with inferred types
 */
export function createCollection<
  TSchema extends SchemaCollections,
  TConfig extends SchemaCollectionConfig<any, any, any, any>,
>(
  schema: SchemaInstance<TSchema>,
  config: TConfig,
): TConfig extends SchemaCollectionConfig<
  infer TTemplate,
  infer TRelationships,
  infer TFactory,
  infer TSerializer
>
  ? SchemaCollection<
      TSchema,
      TTemplate,
      TRelationships extends ModelRelationships ? TRelationships : {},
      TFactory,
      TSerializer
    >
  : never {
  return new SchemaCollection(schema, config) as any;
}
