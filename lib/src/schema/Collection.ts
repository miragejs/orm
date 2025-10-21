import type { DbRecordInput, NewDbRecord, QueryOptions } from '@src/db';
import type { Factory, FactoryTraitNames, ModelTraits } from '@src/factory';
import {
  Model,
  ModelCollection,
  ModelCreateAttrs,
  PartialModelAttrs,
  type ModelAttrs,
  type ModelConfig,
  type ModelInstance,
  type ModelRelationships,
  type ModelTemplate,
  type NewModelInstance,
  type RelationshipsByTemplate,
} from '@src/model';
import { MirageError } from '@src/utils';

import { BaseCollection } from './BaseCollection';
import type { SchemaInstance } from './Schema';
import type { CollectionConfig, CollectionCreateInput, SchemaCollections } from './types';

/**
 * Collection for managing models of a specific type
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TTemplate - The model template type (most important for users)
 * @template TRelationships - The raw relationships configuration for this collection (inferred from config)
 * @template TFactory - The factory type (inferred from config)
 * @template TSerializer - The serializer type (inferred from config)
 */
export default class Collection<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
  TRelationships extends ModelRelationships = {},
  TFactory extends
    | Factory<TTemplate, TSchema, ModelTraits<TSchema, TTemplate>>
    | undefined = undefined,
  TSerializer = undefined,
> extends BaseCollection<TSchema, TTemplate, TRelationships, TFactory, TSerializer> {
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
    const existingModel = this.find(query);
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
        ? this.findMany({ where: query } as unknown as QueryOptions<ModelAttrs<TTemplate, TSchema>>)
        : this.findMany(query as DbRecordInput<ModelAttrs<TTemplate, TSchema>>);

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

  /**
   * Load seeds for this collection.
   * If scenarioId is not provided, all seeds will be loaded (or 'default' if seeds is a function).
   * If scenarioId is provided, only that specific seed scenario will be loaded.
   * @param scenarioId - Optional scenario ID to load a specific seed
   * @throws {MirageError} If the specified scenarioId does not exist
   * @example
   * ```typescript
   * // Load all seeds
   * collection.loadSeeds();
   *
   * // Load specific scenario
   * collection.loadSeeds('userForm');
   * ```
   */
  async loadSeeds(scenarioId?: string): Promise<void> {
    if (!this._seeds) {
      return;
    }

    // Normalize seeds to always be an object
    const seedScenarios: Record<string, (schema: SchemaInstance<TSchema>) => void | Promise<void>> =
      typeof this._seeds === 'function' ? { default: this._seeds } : this._seeds;

    // If no scenarioId provided, run all scenarios
    if (!scenarioId) {
      for (const seedFn of Object.values(seedScenarios)) {
        await seedFn(this._schema);
      }
      return;
    }

    // If scenarioId provided, run only that scenario
    if (!(scenarioId in seedScenarios)) {
      const availableScenarios = Object.keys(seedScenarios).join(', ');
      throw new MirageError(
        `Seed scenario '${scenarioId}' does not exist in collection '${this.collectionName}'. ` +
          `Available scenarios: ${availableScenarios}`,
      );
    }

    await seedScenarios[scenarioId](this._schema);
  }

  /**
   * Load fixtures for this collection.
   * Fixtures are static data records that will be inserted into the collection.
   * This method will insert all fixture records into the database.
   * @example
   * ```typescript
   * // Load all fixtures
   * await collection.loadFixtures();
   * ```
   */
  async loadFixtures(): Promise<void> {
    if (!this._fixtures || !this._fixtures.records.length) {
      return;
    }

    // Check for ID conflicts with existing records
    const fixtureIds = this._fixtures.records.map((r) => r.id);
    const existingIds = this._dbCollection.all().map((r) => r.id);
    const conflicts = fixtureIds.filter((id) => existingIds.includes(id));

    if (conflicts.length > 0) {
      throw new MirageError(
        `Cannot load fixtures for '${this.collectionName}': ID conflicts detected. ` +
          `The following fixture IDs already exist in the database: ${conflicts.join(', ')}. ` +
          `Clear the database with db.emptyData() before loading fixtures, or use different IDs.`,
      );
    }

    // Insert all fixture records into the database at once
    // Fixtures are typed as FixtureRecord which includes all model attributes
    // The type assertion bridges FixtureRecord (all attrs including id) with
    // NewDbRecord (Omit<Record, 'id'> & { id?: id }), which are structurally compatible
    this._dbCollection.insertMany(
      this._fixtures.records as NewDbRecord<ModelAttrs<TTemplate, TSchema>>[],
    );
  }
}

/**
 * Create a collection with relationship support.
 * @param schema - The schema instance
 * @param config - The collection configuration
 * @returns A collection with inferred types
 */
export function createCollection<
  TSchema extends SchemaCollections,
  TConfig extends CollectionConfig<any, any, any, any, any>,
>(
  schema: SchemaInstance<TSchema>,
  config: TConfig,
): TConfig extends CollectionConfig<
  infer TTemplate,
  infer TRelationships,
  infer TFactory,
  infer TSerializer,
  any
>
  ? Collection<
      TSchema,
      TTemplate,
      TRelationships extends ModelRelationships ? TRelationships : {},
      TFactory,
      TSerializer
    >
  : never {
  return new Collection(schema, config) as any;
}
