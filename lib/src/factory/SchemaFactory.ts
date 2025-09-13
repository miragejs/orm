import type { ModelAttrs, ModelInstance, ModelToken, PartialModelAttrs } from '@src/model';
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
 * @template TToken - The model token
 * @template TFactory - The original factory type
 */
export default class SchemaFactory<
  TSchema extends SchemaCollections,
  TToken extends ModelToken,
  TFactory extends Factory<TToken, any>,
> {
  private schemaAfterCreate?: SchemaAfterCreateHook<TSchema, TToken>;
  private schemaTraits: SchemaFactoryTraits<TSchema, TToken> = {};

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
  afterCreate(hook: SchemaAfterCreateHook<TSchema, TToken>): this {
    this.schemaAfterCreate = hook;
    return this;
  }

  /**
   * Add schema-aware traits
   * @param traits - The schema-aware traits
   * @returns This instance for chaining
   */
  traits(traits: SchemaFactoryTraits<TSchema, TToken>): this {
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
    modelId: NonNullable<ModelAttrs<TToken>['id']>,
    ...traitsAndDefaults: (FactoryTraitNames<TFactory> | PartialModelAttrs<TToken>)[]
  ): ModelAttrs<TToken> {
    return this.originalFactory.build(modelId, ...(traitsAndDefaults as any));
  }

  /**
   * Process afterCreate hooks with schema context
   * @param model - The model instance
   * @param traitsAndDefaults - Traits and defaults that were applied
   * @returns The model instance
   */
  processAfterCreateHooks(
    model: ModelInstance<TToken, TSchema>,
    ...traitsAndDefaults: (FactoryTraitNames<TFactory> | PartialModelAttrs<TToken>)[]
  ): ModelInstance<TToken, TSchema> {
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
    const schemaHooks: SchemaAfterCreateHook<TSchema, TToken>[] = [];
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
