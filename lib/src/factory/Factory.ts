import { type FactoryAssociations } from '@src/associations';
import {
  Model,
  type ModelAttrs,
  type ModelCreateAttrs,
  type ModelId,
  type ModelInstance,
  type ModelTemplate,
  type PartialModelAttrs,
  type RelationshipsByTemplate,
} from '@src/model';
import type { ModelCollection, RelatedModelAttrs } from '@src/model';
import type { Collection, SchemaCollections, SchemaInstance } from '@src/schema';
import { MirageError } from '@src/utils';

import AssociationsManager from './AssociationsManager';
import type { FactoryAttrs, FactoryAfterCreateHook, ModelTraits, TraitDefinition } from './types';

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

  private readonly _associationsManager: AssociationsManager<TTemplate, TSchema>;

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
    ] as unknown as Collection<TSchema, TTemplate, RelationshipsByTemplate<TTemplate, TSchema>>;

    // 2. Extract defaults and process attributes
    const { defaults, traitNames } = this._processTraitsAndDefaults(...traitsAndDefaults);

    // 3. Extract model attributes and relationship updates
    const { modelAttrs, relationshipUpdates } = Model.processAttrs<TTemplate, TSchema>(
      defaults,
      collection.relationships,
    );

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

    // 7. Process associations (skip if no associations defined or all user-provided)
    const associationValues = this._processAssociations(schema, relationshipUpdates, traitNames);

    // 8. Merge: user defaults override associations, associations override factory attrs
    return {
      ...evaluatedAttrs,
      ...associationValues,
      ...relationshipUpdates,
    } as ModelCreateAttrs<TTemplate, TSchema>;
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
    model: ModelInstance<TTemplate, TSchema, any>,
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
      (hook as (model: ModelInstance<TTemplate, TSchema>, schema: SchemaInstance<TSchema>) => void)(
        model,
        schema,
      );
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

  private _collectTraitAttributes(traitNames: string[]): PartialModelAttrs<TTemplate> {
    return traitNames.reduce((traitAttributes, name) => {
      const trait = this.traits?.[name as TTraits];

      if (trait) {
        const { afterCreate: _, ...extension } = trait as TraitDefinition<TTemplate, TSchema>;
        return { ...traitAttributes, ...extension };
      }

      return traitAttributes;
    }, {} as PartialModelAttrs<TTemplate>);
  }

  private _evaluateAttributes(
    modelId: ModelId<TTemplate>,
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
          const targetValue = target[targetKey];

          if (processing.has(targetKey)) {
            throw new MirageError(
              `Circular dependency detected in ${modelName} factory: ${Array.from(processing).join(' -> ')} -> ${targetKey}`,
            );
          }

          if (targetKey in target && typeof targetValue === 'function') {
            processing.add(targetKey);
            return targetValue.call(createContext(attrs), modelId);
          }

          attrs[targetKey] = targetValue;
          return targetValue;
        },
      });

    for (const key in attributes) {
      const prop = key as keyof FactoryAttrs<TTemplate>;
      const value = attributes[prop];

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
    modelId: ModelId<TTemplate>,
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
   * Process associations and return relationships
   * This runs with schema context and creates/links related models
   * @param schema - The schema instance
   * @param relationshipUpdates - Relationship updates to skip
   * @param traitNames - Trait names to include trait associations
   * @returns A record of relationship values
   */
  _processAssociations(
    schema: SchemaInstance<TSchema>,
    relationshipUpdates: Partial<
      RelatedModelAttrs<TSchema, RelationshipsByTemplate<TTemplate, TSchema>>
    >,
    traitNames: TTraits[],
  ): Record<string, ModelInstance<any, TSchema> | ModelCollection<any, TSchema>> {
    // Get keys to skip
    const skipKeys = Object.keys(relationshipUpdates);

    // Get trait associations
    const traitAssociations = this._getTraitAssociations(traitNames);

    // Merge factory associations with trait associations (factory associations take precedence)
    const mergedAssociations = {
      ...traitAssociations,
      ...(this.associations || {}),
    };

    // If no associations defined, return empty
    if (Object.keys(mergedAssociations).length === 0) {
      return {};
    }

    // If all associations are user-provided (skipped), return empty
    if (skipKeys && Object.keys(mergedAssociations).every((key) => skipKeys.includes(key))) {
      return {};
    }

    // Use the manager instance to process merged associations
    return this._associationsManager.processAssociations(schema, mergedAssociations, skipKeys);
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
   * Extract associations from traits
   * @param traitNames - The trait names to extract associations from
   * @returns The merged associations from all traits
   */
  private _getTraitAssociations(traitNames: TTraits[]): FactoryAssociations<TTemplate, TSchema> {
    if (traitNames.length === 0) {
      return {};
    }

    const associations: Record<string, any> = {};

    for (const name of traitNames) {
      const trait = this.traits?.[name as TTraits];

      if (trait) {
        const typedTrait = trait as TraitDefinition<TTemplate, TSchema>;

        for (const key in typedTrait) {
          const value = typedTrait[key as keyof TraitDefinition<TTemplate, TSchema>];

          if (this._isAssociation(value)) {
            associations[key] = value;
          }
        }
      }
    }

    return associations as FactoryAssociations<TTemplate, TSchema>;
  }
}
