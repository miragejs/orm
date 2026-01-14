import type { DbRecordInput, NewDbRecord, QueryOptions } from '@src/db';
import { Factory, FactoryTraitNames } from '@src/factory';
import {
  ModelCollection,
  ModelCreateAttrs,
  ModelNewAttrs,
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
import type { CollectionConfig, SchemaCollections } from './types';

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
  TFactory extends Factory<TTemplate, string, TSchema> = Factory<
    TTemplate,
    string,
    TSchema
  >,
> extends BaseCollection<TSchema, TTemplate, TRelationships, TFactory> {
  /**
   * Creates a new model instance (not persisted in the database).
   * @param attrs - The attributes to create the model with. All required attributes must be provided.
   * @returns The new model instance.
   */
  new(
    attrs: ModelNewAttrs<TTemplate, TSchema>,
  ): NewModelInstance<TTemplate, TSchema> {
    return new this.Model({
      attrs: attrs,
      relationships: this.relationships,
      schema: this._schema,
      serializer: this.serializer,
    } as unknown as ModelConfig<
      TTemplate,
      TSchema,
      RelationshipsByTemplate<TTemplate, TSchema>
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
      | ModelCreateAttrs<TTemplate, TSchema>
    )[]
  ): ModelInstance<TTemplate, TSchema> {
    this._logger?.debug(`Creating model for '${this.collectionName}'`, {
      collection: this.collectionName,
      traitsAndDefaults,
    });

    // Build attributes using factory
    const attrs = this._factory.build(
      this._schema,
      ...traitsAndDefaults,
    ) as ModelNewAttrs<TTemplate, TSchema>;
    this._logger?.info(`Created model for '${this.collectionName}'`, {
      id: attrs.id,
      attrs,
    });

    // Create and save model
    const model = this.new(attrs).save();
    this._logger?.debug(`Saved model for '${this.collectionName}'`, {
      id: model.id,
      attrs,
    });

    // Run afterCreate hooks
    this._factory.runAfterCreateHooks(
      this._schema,
      model,
      ...(traitsAndDefaults as (
        | FactoryTraitNames<TFactory>
        | PartialModelAttrs<TTemplate, TSchema>
      )[]),
    );

    return model;
  }

  /**
   * Create multiple models with the same attributes.
   * @param count - The number of models to create.
   * @param traitsAndDefaults - The traits or default values to use for all models.
   * @returns A collection of model instances.
   */
  createMany(
    count: number,
    ...traitsAndDefaults: (
      | FactoryTraitNames<TFactory>
      | ModelCreateAttrs<TTemplate, TSchema>
    )[]
  ): ModelCollection<TTemplate, TSchema>;

  /**
   * Create multiple models with different attributes.
   * @param models - An array of traits/attributes for each model to create.
   * @returns A collection of model instances.
   */
  createMany(
    models: (
      | FactoryTraitNames<TFactory>
      | ModelCreateAttrs<TTemplate, TSchema>
    )[][],
  ): ModelCollection<TTemplate, TSchema>;

  /**
   * Implementation signature for createMany overloads.
   * @internal
   * @param countOrModels - Either a count or an array of model attributes.
   * @param traitsAndDefaults - Optional traits and defaults (used with count).
   * @returns A collection of model instances.
   */
  createMany(
    countOrModels:
      | number
      | (
          | FactoryTraitNames<TFactory>
          | ModelCreateAttrs<TTemplate, TSchema>
        )[][],
    ...traitsAndDefaults: (
      | FactoryTraitNames<TFactory>
      | ModelCreateAttrs<TTemplate, TSchema>
    )[]
  ): ModelCollection<TTemplate, TSchema> {
    let models: ModelInstance<TTemplate, TSchema>[];

    if (typeof countOrModels === 'number') {
      // Original behavior: create N models with same traits
      models = Array.from({ length: countOrModels }, () =>
        this.create(...traitsAndDefaults),
      );
    } else {
      // New behavior: create models with individual traits
      models = countOrModels.map((modelTraitsAndDefaults) =>
        this.create(...modelTraitsAndDefaults),
      );
    }

    return new ModelCollection(this.template, models, this.serializer);
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
      | ModelCreateAttrs<TTemplate, TSchema>
    )[]
  ): ModelInstance<TTemplate, TSchema> {
    const existingModel = this.find(query);
    if (existingModel) {
      return existingModel;
    }

    const newModel = this.create(
      ...traitsAndDefaults,
      query as ModelCreateAttrs<TTemplate, TSchema>,
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
      | ((model: ModelInstance<TTemplate, TSchema>) => boolean),
    ...traitsAndDefaults: (
      | FactoryTraitNames<TFactory>
      | ModelCreateAttrs<TTemplate, TSchema>
    )[]
  ): ModelCollection<TTemplate, TSchema> {
    // Find existing models matching the query
    const existingModels =
      typeof query === 'function'
        ? this.findMany({ where: query } as unknown as QueryOptions<
            ModelAttrs<TTemplate, TSchema>
          >)
        : this.findMany(query as DbRecordInput<ModelAttrs<TTemplate, TSchema>>);

    // If we have enough models, return the requested count
    if (existingModels.length >= count) {
      return new ModelCollection(
        this.template,
        existingModels.models.slice(0, count),
        this.serializer,
      );
    }

    // Calculate how many more models we need to create
    const needed = count - existingModels.length;

    // Create the remaining models
    // If query is an object, include it in the creation attributes
    const queryAttrs = typeof query === 'function' ? {} : query;

    const newModels = Array.from({ length: needed }, () =>
      this.create(
        ...traitsAndDefaults,
        queryAttrs as ModelCreateAttrs<TTemplate, TSchema>,
      ),
    );

    // Combine existing and new models
    return new ModelCollection(
      this.template,
      [...existingModels.models, ...newModels],
      this.serializer,
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
      this._logger?.debug(`No seeds configured for '${this.collectionName}'`);
      return;
    }

    // Check if collection is empty and reset seed tracking if it is
    if (this.dbCollection.isEmpty && this._loadedSeeds.size > 0) {
      this._logger?.debug(`Seed tracking reset for '${this.collectionName}'`);
      this._loadedSeeds.clear();
    }

    // Normalize seeds to always be an object
    const seedScenarios: Record<
      string,
      (schema: SchemaInstance<TSchema>) => void | Promise<void>
    > =
      typeof this._seeds === 'function'
        ? { default: this._seeds }
        : this._seeds;

    // If no scenarioId provided, run all scenarios
    if (!scenarioId) {
      this._logger?.info(`Loading seeds for '${this.collectionName}'`, {
        scenarios: Object.keys(seedScenarios),
      });
      for (const name in seedScenarios) {
        // Check if this scenario has already been loaded
        if (this._loadedSeeds.has(name)) {
          this._logger?.warn(
            `Seed scenario '${name}' for '${this.collectionName}' has already been loaded, skipping`,
            {
              loadCount: this._loadedSeeds.get(name),
            },
          );
          continue;
        }

        const seedFn = seedScenarios[name];
        this._logger?.debug(
          `Loading seed scenario '${name}' for '${this.collectionName}'`,
        );
        await seedFn(this._schema);

        // Track that this scenario has been loaded
        this._loadedSeeds.set(name, (this._loadedSeeds.get(name) || 0) + 1);
      }
      this._logger?.info(`Seeds loaded for '${this.collectionName}'`);
      return;
    }

    // If scenarioId provided, run only that scenario
    if (!(scenarioId in seedScenarios)) {
      const availableScenarios = Object.keys(seedScenarios).join(', ');
      this._logger?.error(`Seed scenario '${scenarioId}' not found`, {
        collection: this.collectionName,
        requested: scenarioId,
        available: Object.keys(seedScenarios),
      });
      throw new MirageError(
        `Seed scenario '${scenarioId}' does not exist in collection '${this.collectionName}'. ` +
          `Available scenarios: ${availableScenarios}`,
      );
    }

    // Check if this scenario has already been loaded
    if (this._loadedSeeds.has(scenarioId)) {
      this._logger?.warn(
        `Seed scenario '${scenarioId}' for '${this.collectionName}' has already been loaded, skipping`,
        {
          loadCount: this._loadedSeeds.get(scenarioId),
        },
      );
      return;
    }

    this._logger?.info(
      `Loading seed scenario '${scenarioId}' for '${this.collectionName}'`,
    );
    await seedScenarios[scenarioId](this._schema);

    // Track that this scenario has been loaded
    this._loadedSeeds.set(
      scenarioId,
      (this._loadedSeeds.get(scenarioId) || 0) + 1,
    );

    this._logger?.info(
      `Seed scenario '${scenarioId}' loaded for '${this.collectionName}'`,
    );
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
      this._logger?.debug(
        `No fixtures configured for '${this.collectionName}'`,
      );
      return;
    }

    this._logger?.info(`Loading fixtures for '${this.collectionName}'`, {
      count: this._fixtures.records.length,
    });

    // Check for ID conflicts with existing records
    const fixtureIds = this._fixtures.records.map((r) => r.id);
    const existingIds = this.dbCollection.all().map((r) => r.id);
    const conflicts = fixtureIds.filter((id) => existingIds.includes(id));

    if (conflicts.length > 0) {
      this._logger?.error('Fixture loading failed: ID conflicts detected', {
        collection: this.collectionName,
        conflicts,
      });
      throw new MirageError(
        `Cannot load fixtures for '${this.collectionName}': ID conflicts detected. ` +
          `The following fixture IDs already exist in the database: ${conflicts.join(', ')}. ` +
          `Clear the database with db.emptyData() before loading fixtures, or use different IDs.`,
      );
    }

    // Insert all fixture records into the database at once
    // Fixtures are typed as FixtureAttrs which includes all model attributes
    // The type assertion bridges FixtureAttrs (all attrs including id) with
    // NewDbRecord (Omit<Record, 'id'> & { id?: id }), which are structurally compatible
    this.dbCollection.insertMany(
      this._fixtures.records as NewDbRecord<ModelAttrs<TTemplate, TSchema>>[],
    );

    this._logger?.info(`Fixtures loaded for '${this.collectionName}'`, {
      count: this._fixtures.records.length,
    });
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
  TTemplate extends ModelTemplate,
  TRelationships extends ModelRelationships,
  TFactory extends Factory<TTemplate, any, any>,
>(
  schema: SchemaInstance<TSchema>,
  config: CollectionConfig<TTemplate, TRelationships, TFactory, TSchema>,
): Collection<
  TSchema,
  TTemplate,
  TRelationships,
  TFactory extends Factory<TTemplate, any, any>
    ? TFactory
    : Factory<TTemplate, string, TSchema>
> {
  // Type assertion needed: Factory function with complex conditional return type
  // TypeScript can't verify generic parameters match the conditional type structure
  return new Collection(schema, config) as Collection<
    TSchema,
    TTemplate,
    TRelationships,
    TFactory extends Factory<TTemplate, any, any>
      ? TFactory
      : Factory<TTemplate, string, TSchema>
  >;
}
