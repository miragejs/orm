import { type FactoryAssociations } from '@src/associations';
import {
  Model,
  type ModelAttrs,
  type ModelCreateAttrs,
  type ModelIdFor,
  type ModelInstance,
  type ModelTemplate,
  type PartialModelAttrs,
  type RelationshipsByTemplate,
} from '@src/model';
import type {
  Collection,
  SchemaCollections,
  SchemaInstance,
} from '@src/schema';
import { MirageError } from '@src/utils';

import AssociationsManager from './AssociationsManager';
import type {
  FactoryAttrs,
  FactoryAfterCreateHook,
  ModelTraits,
  TraitDefinition,
} from './types';

// TODO: Review types to make them more precise
/**
 * Factory that builds model attributes with optional schema support.
 * @template TTemplate - The model template (inferred from constructor)
 * @template TTraits - The factory trait names as string union (e.g., 'admin' | 'manager')
 * @template TSchema - The schema collections type (optional, defaults to SchemaCollections)
 */
export default class Factory<
  TTemplate extends ModelTemplate = ModelTemplate,
  TTraits extends string = string,
  TSchema extends SchemaCollections = SchemaCollections,
> {
  readonly template: TTemplate;
  readonly attributes: FactoryAttrs<TTemplate>;
  readonly traits: ModelTraits<TTraits, TTemplate, TSchema>;
  readonly associations?: FactoryAssociations<TTemplate, TSchema>;
  readonly afterCreate?: FactoryAfterCreateHook<TSchema, TTemplate>;

  private readonly _associationsManager: AssociationsManager<
    TTemplate,
    TSchema
  >;

  constructor(
    template: TTemplate,
    attributes: FactoryAttrs<TTemplate> = {} as FactoryAttrs<TTemplate>,
    traits: ModelTraits<TTraits, TTemplate, TSchema> = {} as ModelTraits<
      TTraits,
      TTemplate,
      TSchema
    >,
    associations?: FactoryAssociations<TTemplate, TSchema>,
    afterCreate?: FactoryAfterCreateHook<TSchema, TTemplate>,
  ) {
    this.template = template;
    this.attributes = attributes;
    this.traits = traits;
    this.associations = associations;
    this.afterCreate = afterCreate;

    // Create manager for processing associations
    this._associationsManager = new AssociationsManager<TTemplate, TSchema>();
  }

  /**
   * Build model attributes with factory attributes, associations, and traits.
   * @param schema - The schema instance to get collection and create related models
   * @param traitsAndDefaults - The trait names and/or default attribute values
   * @returns Model attributes ready for creation
   */
  build(
    schema: SchemaInstance<TSchema>,
    ...traitsAndDefaults: (TTraits | PartialModelAttrs<TTemplate, TSchema>)[]
  ): ModelCreateAttrs<TTemplate, TSchema> {
    // 1. Get collection from schema using template's collectionName
    const collection = schema[
      this.template.collectionName as keyof TSchema
    ] as unknown as Collection<
      TSchema,
      TTemplate,
      RelationshipsByTemplate<TTemplate, TSchema>
    >;

    // 2. Extract defaults and process attributes
    const { defaults, traitNames } = this._processTraitsAndDefaults(
      ...traitsAndDefaults,
    );

    // 3. Extract model attributes and relationship updates
    const { modelAttrs, relationshipUpdates } = Model.processAttrs<
      TTemplate,
      TSchema
    >(defaults, collection.relationships);

    // 4. Evaluate and get ID
    const nextId = modelAttrs.id ?? collection.dbCollection.nextId;

    // 5. Cache ID if provided
    if (modelAttrs.id) {
      collection.identityManager?.set(modelAttrs.id);
    }

    // 6. Evaluate factory attributes (resolve functions)
    const evaluatedAttrs = this._processAttributes(
      nextId,
      modelAttrs as PartialModelAttrs<TTemplate, TSchema>,
      traitNames,
    );

    // 7. Get associations that need processing (merge traits + factory, filter user-provided)
    const associations = this._getAssociations(traitNames, relationshipUpdates);

    // 8. Process the filtered associations
    const relationshipValues = this._associationsManager.processAssociations(
      schema,
      associations,
    );

    // 10. Merge: associations override factory attrs, but user-provided relationship values take precedence
    const mergedAttrs = {
      ...evaluatedAttrs,
      ...relationshipValues,
    } as ModelCreateAttrs<TTemplate, TSchema>;

    return mergedAttrs;
  }

  /**
   * Run the afterCreate hook and the trait hooks.
   * This method is intended to be called internally by schema collections.
   * @param schema - The schema instance.
   * @param model - The model to process.
   * @param traitsAndDefaults - The traits and defaults that were applied.
   * @returns The processed model.
   */
  runAfterCreateHooks(
    schema: SchemaInstance<TSchema>,
    model: ModelInstance<TTemplate, TSchema>,
    ...traitsAndDefaults: (TTraits | PartialModelAttrs<TTemplate, TSchema>)[]
  ): ModelInstance<TTemplate, TSchema> {
    const traitNames: TTraits[] = traitsAndDefaults.filter(
      (arg) => typeof arg === 'string',
    ) as TTraits[];
    const hooks: FactoryAfterCreateHook<TSchema, TTemplate>[] = [];

    if (this.afterCreate) {
      hooks.push(this.afterCreate);
    }

    traitNames.forEach((name) => {
      const trait = this.traits?.[name];

      if (trait) {
        const { afterCreate } = trait as TraitDefinition<TTemplate, TSchema>;

        if (afterCreate) {
          hooks.push(afterCreate);
        }
      }
    });

    // Execute hooks with the properly typed model instance and schema
    hooks.forEach((hook) => {
      (
        hook as (
          model: ModelInstance<TTemplate, TSchema>,
          schema: SchemaInstance<TSchema>,
        ) => void
      )(model, schema);
    });

    return model;
  }

  // -- PRIVATE METHODS --

  /**
   * Process traits and defaults from mixed arguments
   * @param traitsAndDefaults - The traits and defaults to process
   * @returns An object containing the trait names and defaults
   * @private
   */
  private _processTraitsAndDefaults(
    ...traitsAndDefaults: (TTraits | PartialModelAttrs<TTemplate, TSchema>)[]
  ): {
    defaults: PartialModelAttrs<TTemplate, TSchema>;
    traitNames: TTraits[];
  } {
    return traitsAndDefaults.reduce<{
      defaults: PartialModelAttrs<TTemplate, TSchema>;
      traitNames: TTraits[];
    }>(
      (acc, arg) => {
        if (typeof arg === 'string') {
          acc.traitNames.push(arg);
        } else {
          acc.defaults = { ...acc.defaults, ...arg };
        }
        return acc;
      },
      { defaults: {} as PartialModelAttrs<TTemplate, TSchema>, traitNames: [] },
    );
  }

  private _collectTraitAttributes(
    traitNames: string[],
  ): PartialModelAttrs<TTemplate> {
    return traitNames.reduce((traitAttributes, name) => {
      const trait = this.traits?.[name as TTraits];

      if (trait) {
        const { afterCreate: _, ...extension } = trait as TraitDefinition<
          TTemplate,
          TSchema
        >;
        return { ...traitAttributes, ...extension };
      }

      return traitAttributes;
    }, {} as PartialModelAttrs<TTemplate>);
  }

  private _evaluateAttributes(
    modelId: ModelIdFor<TTemplate>,
    attributes: FactoryAttrs<TTemplate>,
  ): FactoryAttrs<TTemplate> {
    const modelName = this.template.modelName;

    const result: Record<string, unknown> = { ...attributes };
    const processing = new Set<string>();

    /**
     * Create a context with defined attributes to evaluate dynamic attributes and prevent circular dependencies.
     * @param attrs - The attributes to create the context with.
     * @returns The proxy with the attributes.
     */
    const createContext = (attrs: Record<string, unknown>) =>
      new Proxy(attrs, {
        get(target, targetKey: string) {
          let targetValue = target[targetKey];

          if (processing.has(targetKey)) {
            throw new MirageError(
              `Circular dependency detected in ${modelName} factory: ${Array.from(processing).join(' -> ')} -> ${targetKey}`,
            );
          }

          if (targetKey in target && typeof targetValue === 'function') {
            processing.add(targetKey);
            targetValue = targetValue.call(createContext(attrs), modelId);
          }

          attrs[targetKey] = targetValue;
          return targetValue;
        },
        set(target, targetKey: string, value) {
          target[targetKey] = value;
          return true;
        },
      });

    for (const key in result) {
      const value = result[key];

      if (typeof value === 'function') {
        processing.add(key);
        result[key] = value.call(createContext(result), modelId);
        processing.clear();
      }
    }

    return result as FactoryAttrs<TTemplate>;
  }

  /**
   * Process factory attributes with the given model ID and trait names or default values.
   * This is a lower-level method for attribute evaluation without model instance creation.
   * For creating model instances, use `build()` instead.
   * @param modelId - The ID of the model to build.
   * @param defaults - The defaults to apply.
   * @param traitNames - The traits to apply.
   * @returns The evaluated model attributes
   */
  _processAttributes(
    modelId: ModelIdFor<TTemplate>,
    defaults: PartialModelAttrs<TTemplate, TSchema>,
    traitNames: TTraits[],
  ): ModelAttrs<TTemplate, TSchema> {
    const traitAttrs = this._collectTraitAttributes(traitNames);
    const evaluatedAtts = this._evaluateAttributes(modelId, {
      ...this.attributes, // factory attributes
      ...defaults, // user defaults override base attributes
      ...traitAttrs, // trait attributes override base and user defaults
    });

    // Merge evaluated attributes and the autogenerated id
    return { ...evaluatedAtts, id: modelId } as ModelAttrs<TTemplate, TSchema>;
  }

  /**
   * Check if a value is an association object
   * @param value - The value to check
   * @returns True if the value is an association
   */
  private _isAssociation(value: any): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      'model' in value &&
      ['create', 'createMany', 'link', 'linkMany'].includes(value.type)
    );
  }

  /**
   * Get associations that need processing by:
   * 1. Extracting associations from traits
   * 2. Merging with factory associations (factory takes precedence)
   * 3. Filtering out associations where user provided values
   * @param traitNames - The trait names to extract associations from
   * @param relationshipUpdates - Relationship updates from user (contains FK values for relationships that were provided)
   * @returns Filtered associations ready to be processed
   */
  private _getAssociations(
    traitNames: TTraits[],
    relationshipUpdates: Record<string, any>,
  ): FactoryAssociations<TTemplate, TSchema> {
    const associations: Record<string, any> = {};

    // 1. Extract associations from traits
    for (const name of traitNames) {
      const trait = this.traits?.[name as TTraits];

      if (trait) {
        const typedTrait = trait as TraitDefinition<TTemplate, TSchema>;

        for (const key in typedTrait) {
          const value =
            typedTrait[key as keyof TraitDefinition<TTemplate, TSchema>];

          if (this._isAssociation(value)) {
            associations[key] = value;
          }
        }
      }
    }

    // 2. Merge with factory associations (factory takes precedence)
    Object.assign(associations, this.associations || {});

    // 3. Filter out associations where user provided values
    const filtered: FactoryAssociations<TTemplate, TSchema> = {};

    for (const relationshipName in associations) {
      // Skip if user provided a value for this relationship (model instance or FK)
      // relationshipUpdates contains entries like { author: '123' } or { posts: ['1', '2'] }
      if (!(relationshipName in relationshipUpdates)) {
        filtered[
          relationshipName as keyof FactoryAssociations<TTemplate, TSchema>
        ] = associations[relationshipName];
      }
    }

    return filtered;
  }
}
