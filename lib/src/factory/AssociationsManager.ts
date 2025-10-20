import type {
  Association,
  AssociationQuery,
  AssociationTraitsAndDefaults,
  FactoryAssociations,
} from '@src/associations';
import { ModelCollection, type ModelInstance, type ModelTemplate } from '@src/model';
import { type SchemaInstance, type SchemaCollection, type SchemaCollections } from '@src/schema';
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
   * @param associations - The associations to process
   * @param skipKeys - Optional list of relationship keys to skip (e.g., if user provided them)
   * @returns A record of relationship values
   */
  processAssociations(
    schema: SchemaInstance<TSchema>,
    associations: FactoryAssociations<TTemplate, TSchema>,
    skipKeys?: string[],
  ): Record<string, ModelInstance<any, TSchema> | ModelCollection<any, TSchema>> {
    const relationshipValues: Record<string, any> = {};
    const keysToSkip = new Set(skipKeys || []);

    for (const relationshipName in associations) {
      const association = associations[relationshipName] as Association<ModelTemplate>;
      if (!association) continue;

      // Skip if user provided this relationship
      if (keysToSkip.has(relationshipName)) continue;

      // Get the collection directly from the model's collectionName
      const collectionName = association.model.collectionName;
      const collection = schema.getCollection(collectionName);

      if (!collection) {
        throw new MirageError(
          `Collection '${collectionName}' not found in schema during associations processing`,
        );
      }

      switch (association.type) {
        case 'create':
          relationshipValues[relationshipName] = this._processCreate(
            collection,
            association.traitsAndDefaults,
          );
          break;

        case 'createMany':
          relationshipValues[relationshipName] = this._processCreateMany(
            collection,
            association.count,
            association.traitsAndDefaults,
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

    return relationshipValues;
  }

  private _processCreate(
    collection: SchemaCollection<TSchema, any, any, any, any>,
    traitsAndDefaults?: AssociationTraitsAndDefaults,
  ): ModelInstance<any, TSchema, any> {
    return collection.create(...(traitsAndDefaults || ([] as any)));
  }

  private _processCreateMany(
    collection: SchemaCollection<TSchema, any, any, any, any>,
    count: number,
    traitsAndDefaults?: AssociationTraitsAndDefaults,
  ): ModelCollection<any, TSchema, any> {
    return collection.createList(count, ...(traitsAndDefaults || ([] as any)));
  }

  private _processLink(
    collection: SchemaCollection<TSchema, any, any, any, any>,
    query?: AssociationQuery,
    traitsAndDefaults?: AssociationTraitsAndDefaults,
  ): ModelInstance<any, TSchema, any> {
    // Try to find existing
    let model: ModelInstance<any, TSchema, any> | null = null;

    if (query) {
      // Use findMany to get matches, then shuffle and pick first
      const matches =
        typeof query === 'function'
          ? collection.findMany({ where: query } as any)
          : collection.findMany(query as any);
      if (matches.length > 0) {
        const shuffled = this._shuffle(matches.models);
        model = shuffled[0];
      }
    } else {
      // Get all and shuffle, then pick first
      const all = collection.all();
      if (all.length > 0) {
        const shuffled = this._shuffle(all.models);
        model = shuffled[0];
      }
    }

    // Create if not found (with traits and defaults)
    if (!model) {
      model = collection.create(...(traitsAndDefaults || ([] as any)));
    }

    return model;
  }

  private _processLinkMany(
    collection: SchemaCollection<TSchema, any, any, any, any>,
    template: ModelTemplate,
    count: number,
    query?: AssociationQuery,
    traitsAndDefaults?: AssociationTraitsAndDefaults,
  ): ModelCollection<any, TSchema, any> {
    // Try to find existing
    let models: ModelCollection<any, TSchema, any>;

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
      const newModels = collection.createList(needed, ...(traitsAndDefaults || ([] as any)));
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
