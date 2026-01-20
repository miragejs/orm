import type {
  Association,
  AssociationQuery,
  AssociationTraitsAndDefaults,
  FactoryAssociations,
} from '@src/associations';
import {
  ModelCollection,
  ModelCreateAttrs,
  ModelIdFor,
  ModelRelationships,
  RelatedModelAttrs,
  RelationshipsByTemplate,
  type ModelInstance,
  type ModelTemplate,
} from '@src/model';
import type { BelongsTo, HasMany } from '@src/relations';
import type {
  SchemaInstance,
  Collection,
  SchemaCollections,
} from '@src/schema';
import { MirageError } from '@src/utils';

/**
 * Manages factory associations - creates and links related models
 */
export default class AssociationsManager<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections,
> {
  /**
   * Process all associations and return relationship values
   * @param schema - The schema instance
   * @param associations - The associations to process (already filtered by Factory)
   * @param parentRelationships - The parent model's relationship definitions (for inverse FK lookup)
   * @param parentId - The parent model's planned ID (for inverse FK injection)
   * @returns A record of relationship values
   */
  processAssociations(
    schema: SchemaInstance<TSchema>,
    associations: FactoryAssociations<TTemplate, TSchema>,
    parentRelationships?: ModelRelationships,
    parentId?: ModelIdFor<TTemplate>,
  ): Partial<
    RelatedModelAttrs<TSchema, RelationshipsByTemplate<TTemplate, TSchema>>
  > {
    const relationshipValues: Record<string, any> = {};

    for (const relationshipName in associations) {
      const association = associations[
        relationshipName
      ] as Association<ModelTemplate>;
      if (!association) continue;

      // Get the collection directly from the model's collectionName
      const collectionName = association.model.collectionName;
      const collection = schema.getCollection(collectionName);

      if (!collection) {
        throw new MirageError(
          `Collection '${collectionName}' not found in schema during associations processing`,
        );
      }

      // Calculate inverse FK defaults for related models
      const inverseDefaults = this._getInverseDefaults(
        relationshipName,
        parentRelationships,
        collection.relationships,
        parentId,
      );

      switch (association.type) {
        case 'create':
          relationshipValues[relationshipName] = this._processCreate(
            collection,
            association.traitsAndDefaults,
            inverseDefaults,
          );
          break;

        case 'createMany':
          relationshipValues[relationshipName] = this._processCreateMany(
            collection,
            association.count,
            association.traitsAndDefaults,
            association.models,
            inverseDefaults,
          );
          break;

        case 'link':
          relationshipValues[relationshipName] = this._processLink(
            collection,
            association.query,
            association.traitsAndDefaults,
          );
          break;

        case 'linkMany':
          relationshipValues[relationshipName] = this._processLinkMany(
            collection,
            association.model,
            association.count,
            association.query,
            association.traitsAndDefaults,
          );
          break;
      }
    }

    return relationshipValues as Partial<
      RelatedModelAttrs<TSchema, RelationshipsByTemplate<TTemplate, TSchema>>
    >;
  }

  /**
   * Get inverse FK defaults to inject when creating related models.
   * For hasMany relationships with an inverse belongsTo, this returns
   * the FK value that should be set on the child model to point back to the parent.
   * @param relationshipName - The name of the relationship being processed
   * @param parentRelationships - The parent model's relationship definitions
   * @param targetRelationships - The target model's relationship definitions
   * @param parentId - The parent model's planned ID
   * @returns An object with the inverse FK value, or empty object if no inverse
   */
  private _getInverseDefaults(
    relationshipName: string,
    parentRelationships: ModelRelationships | undefined,
    targetRelationships: ModelRelationships | undefined,
    parentId: ModelIdFor<TTemplate> | undefined,
  ): Record<string, unknown> {
    if (
      !parentRelationships ||
      !targetRelationships ||
      parentId === undefined
    ) {
      return {};
    }

    // Get the parent's relationship definition
    const parentRel = parentRelationships[relationshipName] as
      | HasMany<ModelTemplate>
      | BelongsTo<ModelTemplate>
      | undefined;

    if (!parentRel || !parentRel.inverse) {
      return {};
    }

    // For hasMany -> belongsTo inverse, inject the parent ID as the FK value
    // The inverse relationship name on the target is parentRel.inverse
    const inverseRelName = parentRel.inverse;
    const inverseRel = targetRelationships[inverseRelName] as
      | BelongsTo<ModelTemplate>
      | HasMany<ModelTemplate>
      | undefined;

    if (!inverseRel) {
      return {};
    }

    // If parent is hasMany and inverse is belongsTo, inject FK
    if (parentRel.type === 'hasMany' && inverseRel.type === 'belongsTo') {
      // The FK is stored on the child (belongsTo side)
      // We need to inject the FK value (parentId) using the FK field name
      return { [inverseRel.foreignKey]: parentId };
    }

    // If parent is belongsTo and inverse is hasMany, the FK is on the parent side
    // No injection needed for the child
    return {};
  }

  private _processCreate(
    collection: Collection<TSchema, any, any, any>,
    traitsAndDefaults: AssociationTraitsAndDefaults = [],
    inverseDefaults: Record<string, unknown> = {},
  ): ModelInstance<any, TSchema> {
    // Inject inverse FK defaults before user-provided values
    const argsWithInverse =
      Object.keys(inverseDefaults).length > 0
        ? [inverseDefaults, ...traitsAndDefaults]
        : traitsAndDefaults;

    return collection.create(
      ...(argsWithInverse as ModelCreateAttrs<TTemplate, TSchema>[]),
    );
  }

  private _processCreateMany(
    collection: Collection<TSchema, any, any, any>,
    count: number | undefined,
    traitsAndDefaults: AssociationTraitsAndDefaults | undefined,
    models: AssociationTraitsAndDefaults[] | undefined,
    inverseDefaults: Record<string, unknown> = {},
  ): ModelCollection<any, TSchema> {
    const hasInverseDefaults = Object.keys(inverseDefaults).length > 0;

    if (models) {
      // Array mode: create different models
      // Inject inverse defaults at the beginning of each model's args
      const modelsWithInverse = hasInverseDefaults
        ? models.map((modelArgs) => [inverseDefaults, ...modelArgs])
        : models;

      return collection.createMany(
        modelsWithInverse as ModelCreateAttrs<TTemplate, TSchema>[][],
      );
    } else {
      // Count mode: create N identical models
      // Inject inverse defaults before user-provided values
      const argsWithInverse = hasInverseDefaults
        ? [inverseDefaults, ...(traitsAndDefaults ?? [])]
        : (traitsAndDefaults ?? []);

      return collection.createMany(
        count!,
        ...(argsWithInverse as ModelCreateAttrs<TTemplate, TSchema>[]),
      );
    }
  }

  private _processLink(
    collection: Collection<TSchema, any, any, any>,
    query?: AssociationQuery,
    traitsAndDefaults?: AssociationTraitsAndDefaults,
  ): ModelInstance<any, TSchema> {
    // Try to find existing
    let model: ModelInstance<any, TSchema> | null = null;

    if (query) {
      // Use findMany to get matches, then shuffle and pick first
      const matches =
        typeof query === 'function'
          ? collection.findMany({ where: query } as any)
          : collection.findMany(query as any);
      if (matches.length > 0) {
        const shuffled = this._shuffle(matches.models);
        model = shuffled[0] as ModelInstance<any, TSchema> | null;
      }
    } else {
      // Get all and shuffle, then pick first
      const all = collection.all();
      if (all.length > 0) {
        const shuffled = this._shuffle(all.models);
        model = shuffled[0] as ModelInstance<any, TSchema> | null;
      }
    }

    // Create if not found (with traits and defaults) // Create if not found (with traits and defaults)
    if (!model) {
      model = collection.create(
        ...((traitsAndDefaults ?? []) as ModelCreateAttrs<
          TTemplate,
          TSchema
        >[]),
      );
    }

    return model;
  }

  private _processLinkMany(
    collection: Collection<TSchema, any, any, any>,
    template: ModelTemplate,
    count: number,
    query?: AssociationQuery,
    traitsAndDefaults?: AssociationTraitsAndDefaults,
  ): ModelCollection<any, TSchema> {
    // Try to find existing
    let models: ModelCollection<any, TSchema>;

    if (query) {
      models =
        typeof query === 'function'
          ? collection.findMany({ where: query } as any)
          : collection.findMany(query as any);
    } else {
      models = collection.all();
    }

    // Shuffle before selecting
    const shuffledModels = this._shuffle(models.models);

    // Create more if needed (with traits and defaults)
    const needed = count - shuffledModels.length;
    if (needed > 0) {
      const newModels = collection.createMany(
        needed,
        ...((traitsAndDefaults ?? []) as ModelCreateAttrs<
          TTemplate,
          TSchema
        >[]),
      );
      // Combine shuffled existing with new ones
      const allModels = [...shuffledModels, ...newModels.models];
      return new ModelCollection(template, allModels);
    } else {
      // Trim to requested count
      const selectedModels = shuffledModels.slice(0, count);
      return new ModelCollection(template, selectedModels);
    }
  }

  /**
   * Fisher-Yates shuffle algorithm
   * @param array - The array to shuffle
   * @returns The shuffled array
   */
  private _shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
