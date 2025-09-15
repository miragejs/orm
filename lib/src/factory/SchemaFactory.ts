import type { ModelAttrs, ModelInstance, ModelTemplate, PartialModelAttrs } from '@src/model';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

import type Factory from './Factory';
import type {
  FactoryAfterCreateHook,
  FactoryTraitNames,
  SchemaAfterCreateHook,
  SchemaFactoryTraits,
} from './types';

/**
 * Schema-aware factory wrapper that provides enhanced afterCreate hooks with schema context
 * @template TSchema - The schema collections type
 * @template TTemplate - The model template
 * @template TFactory - The original factory type
 */
export default class SchemaFactory<
  TSchema extends SchemaCollections,
  TTemplate extends ModelTemplate,
  TFactory extends Factory<TTemplate, any>,
> {
  private schemaAfterCreate?: SchemaAfterCreateHook<TSchema, TTemplate>;
  private schemaTraits: SchemaFactoryTraits<TSchema, TTemplate> = {};

  constructor(
    private originalFactory: TFactory,
    private schema: SchemaInstance<TSchema>,
  ) {}

  /**
   * Get the original factory
   * @returns The original factory instance
   */
  get factory(): TFactory {
    return this.originalFactory;
  }

  /**
   * Set a schema-aware afterCreate hook
   * @param hook - The schema-aware afterCreate hook
   * @returns This instance for chaining
   */
  afterCreate(hook: SchemaAfterCreateHook<TSchema, TTemplate>): this {
    this.schemaAfterCreate = hook;
    return this;
  }

  /**
   * Add schema-aware traits
   * @param traits - The schema-aware traits
   * @returns This instance for chaining
   */
  traits(traits: SchemaFactoryTraits<TSchema, TTemplate>): this {
    this.schemaTraits = { ...this.schemaTraits, ...traits };
    return this;
  }

  /**
   * Build model attributes (delegates to original factory)
   * @param modelId - The model ID
   * @param traitsAndDefaults - Traits and default values
   * @returns The built model attributes
   */
  build(
    modelId: NonNullable<ModelAttrs<TTemplate>['id']>,
    ...traitsAndDefaults: (FactoryTraitNames<TFactory> | PartialModelAttrs<TTemplate>)[]
  ): ModelAttrs<TTemplate> {
    return this.originalFactory.build(modelId, ...(traitsAndDefaults as any));
  }

  /**
   * Process afterCreate hooks with schema context
   * @param model - The model instance
   * @param traitsAndDefaults - Traits and defaults that were applied
   * @returns The model instance
   */
  processAfterCreateHooks(
    model: ModelInstance<TTemplate, TSchema>,
    ...traitsAndDefaults: (FactoryTraitNames<TFactory> | PartialModelAttrs<TTemplate>)[]
  ): ModelInstance<TTemplate, TSchema> {
    const traitNames: string[] = traitsAndDefaults.filter((arg) => typeof arg === 'string');

    // Collect factory hooks (simple model-only hooks)
    const factoryHooks: FactoryAfterCreateHook[] = [];
    if (this.originalFactory.afterCreate) {
      factoryHooks.push(this.originalFactory.afterCreate);
    }
    traitNames.forEach((name) => {
      const trait = this.originalFactory.traits[name];
      if (trait?.afterCreate) {
        factoryHooks.push(trait.afterCreate);
      }
    });

    // Collect schema-aware hooks (model + schema hooks)
    const schemaHooks: SchemaAfterCreateHook<TSchema, TTemplate>[] = [];
    if (this.schemaAfterCreate) {
      schemaHooks.push(this.schemaAfterCreate);
    }
    traitNames.forEach((name) => {
      const schemaTrait = this.schemaTraits[name];
      if (schemaTrait?.afterCreate) {
        schemaHooks.push(schemaTrait.afterCreate);
      }
    });

    // Execute factory hooks (simple model-only hooks)
    factoryHooks.forEach((hook) => {
      hook(model);
    });

    // Execute schema-aware hooks (model + schema hooks)
    schemaHooks.forEach((hook) => {
      hook(model, this.schema);
    });

    return model;
  }
}
