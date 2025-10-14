import type { InferModelAttrs, ModelInstance, ModelTemplate } from '@src/model';
import type ModelCollection from '@src/model/ModelCollection';
import type { SchemaCollections } from '@src/schema';

import type { SerializerOptions } from './types';

/**
 * Serializer class that handles model serialization with custom JSON types
 * @template TTemplate - The model template
 * @template TSerializedModel - The serialized model type (for single model)
 * @template TSerializedCollection - The serialized collection type (for array of models)
 * @template TOptions - The serializer options type
 * @example
 * ```typescript
 * interface UserJSON {
 *   id: string;
 *   name: string;
 * }
 *
 * interface UsersJSON {
 *   users: UserJSON[];
 * }
 *
 * const serializer = new Serializer<UserTemplate, UserJSON, UsersJSON>(
 *   userTemplate,
 *   {
 *     attrs: ['id', 'name'],
 *     root: 'user'
 *   }
 * );
 * ```
 */
export default class Serializer<
  TTemplate extends ModelTemplate,
  TSerializedModel = InferModelAttrs<TTemplate>,
  TSerializedCollection = TSerializedModel[],
  TOptions extends SerializerOptions<TTemplate> = SerializerOptions<TTemplate>,
> {
  protected _template: TTemplate;
  protected _modelName: string;
  protected _collectionName: string;
  protected _attrs: TOptions['attrs'];
  protected _root: TOptions['root'];
  protected _embed: TOptions['embed'];
  protected _include: TOptions['include'];

  constructor(template: TTemplate, options?: TOptions) {
    this._template = template;
    this._modelName = template.modelName;
    this._collectionName = template.collectionName;
    this._attrs = options?.attrs;
    this._root = options?.root;
    this._embed = options?.embed;
    this._include = options?.include;
  }

  /**
   * Get the model name
   * @returns The model name
   */
  get modelName(): string {
    return this._modelName;
  }

  /**
   * Get the collection name
   * @returns The collection name
   */
  get collectionName(): string {
    return this._collectionName;
  }

  /**
   * Serialize raw data from a model without structural wrapping
   * This method extracts and returns the data (attributes + relationships)
   * without applying any root wrapping. Used for embedding relationships.
   * @param model - The model instance to serialize
   * @returns The serialized model data without root wrapping
   */
  serializeData<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): Record<string, any> {
    const attrs = this._getAttributes(model);

    if (this._embed) {
      // Embed mode: merge embedded relationships, removing foreign keys
      const { embedded, foreignKeys } = this._getRelationships(model);
      const filteredAttrs = { ...attrs };

      // Remove foreign keys from attributes when embedding
      for (const fk of foreignKeys) {
        delete filteredAttrs[fk];
      }

      return { ...filteredAttrs, ...embedded };
    }

    // Default: return attributes as-is (foreign keys remain)
    return attrs;
  }

  /**
   * Serialize a single model instance with structural formatting
   * Applies root wrapping and side-loading if configured
   * @param model - The model instance to serialize
   * @returns The serialized model with structural formatting applied
   */
  serialize<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): TSerializedModel {
    const data = this.serializeData(model);

    // Get side-loaded relationships (only when embed: false)
    const { sideLoaded } = this._embed ? { sideLoaded: {} } : this._getRelationships(model);

    if (this._root) {
      const rootKey = typeof this._root === 'string' ? this._root : this._modelName;
      // With root wrapping: merge side-loaded at root level
      return { [rootKey]: data, ...sideLoaded } as TSerializedModel;
    }

    // Without root wrapping: merge side-loaded at same level
    return { ...data, ...sideLoaded } as TSerializedModel;
  }

  /**
   * Serialize raw data from a collection without structural wrapping
   * Returns an array of serialized model data without root wrapping
   * @param collection - The model collection to serialize
   * @returns Array of serialized model data
   */
  serializeCollectionData<TSchema extends SchemaCollections>(
    collection: ModelCollection<TTemplate, TSchema>,
  ): Record<string, any>[] {
    return collection.models.map((model) => this.serializeData(model));
  }

  /**
   * Serialize a model collection with structural formatting
   * Applies root wrapping and side-loading if configured
   * @param collection - The model collection to serialize
   * @returns The serialized collection with structural formatting applied
   */
  serializeCollection<TSchema extends SchemaCollections>(
    collection: ModelCollection<TTemplate, TSchema>,
  ): TSerializedCollection {
    const data = this.serializeCollectionData(collection);

    // Collect all side-loaded relationships from all models
    const allSideLoaded: Record<string, any[]> = {};
    if (!this._embed && this._include) {
      for (const model of collection.models) {
        const { sideLoaded } = this._getRelationships(model);

        // Merge side-loaded data, deduplicating by ID
        for (const [key, value] of Object.entries(sideLoaded)) {
          if (!allSideLoaded[key]) {
            allSideLoaded[key] = [];
          }

          // Add to side-loaded array if not already present (dedupe by id)
          if (Array.isArray(value)) {
            for (const item of value) {
              if (!allSideLoaded[key].some((existing) => existing.id === item.id)) {
                allSideLoaded[key].push(item);
              }
            }
          } else if (value && !allSideLoaded[key].some((existing) => existing.id === value.id)) {
            allSideLoaded[key].push(value);
          }
        }
      }
    }

    if (this._root) {
      const rootKey = typeof this._root === 'string' ? this._root : this._collectionName;
      // With root wrapping: merge side-loaded at root level
      return { [rootKey]: data, ...allSideLoaded } as TSerializedCollection;
    }

    // Without root wrapping: return array (side-loading not supported without root)
    return data as TSerializedCollection;
  }

  /**
   * Get the attributes to include in serialization
   * Can be overridden in subclasses for custom serialization logic
   * @param model - The model instance
   * @returns Object with attributes
   */
  protected _getAttributes<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): Record<string, any> {
    // If specific attributes are configured, only include those
    if (this._attrs && this._attrs.length > 0) {
      return this._attrs.reduce(
        (acc, attr) => {
          acc[attr as string] = model.attrs[attr as keyof typeof model.attrs];
          return acc;
        },
        {} as Record<string, any>,
      );
    }

    // Default: return raw attributes (no embedding, no filtering)
    return { ...model.attrs };
  }

  /**
   * Get relationships to include in serialization
   * Returns embedded relationships, side-loaded relationships, and foreign keys
   * @param model - The model instance
   * @returns Object with embedded, sideLoaded, and foreignKeys
   */
  protected _getRelationships<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): { embedded: Record<string, any>; sideLoaded: Record<string, any>; foreignKeys: string[] } {
    // If no relationships are configured to include, return empty
    if (!this._include || this._include.length === 0) {
      return { embedded: {}, sideLoaded: {}, foreignKeys: [] };
    }

    const embedded: Record<string, any> = {};
    const sideLoaded: Record<string, any> = {};
    const foreignKeys: string[] = [];

    for (const relName of this._include) {
      // Access the relationship from the model
      const relatedData = (model as any)[relName];

      // Skip if relationship doesn't exist or is undefined
      if (relatedData === undefined) {
        continue;
      }

      // Handle null relationships (belongsTo with no related model)
      if (relatedData === null) {
        if (this._embed) {
          embedded[relName] = null;
          // Track foreign key to remove even when null (e.g., 'authorId')
          foreignKeys.push(`${relName}Id`);
        } else {
          sideLoaded[relName] = null;
        }
        continue;
      }

      // Check if it's a ModelCollection (hasMany)
      const isCollection =
        relatedData && typeof relatedData === 'object' && 'models' in relatedData;

      if (this._embed) {
        // Embed mode: replace foreign keys with full models
        if (isCollection) {
          // HasMany: serialize each model in the collection
          embedded[relName] = relatedData.models.map((relModel: any) => {
            return { ...relModel.attrs };
          });
          // Track foreign key to remove (e.g., 'postIds')
          foreignKeys.push(`${relName.replace(/s$/, '')}Ids`);
        } else {
          // BelongsTo: serialize single model
          embedded[relName] = { ...relatedData.attrs };
          // Track foreign key to remove (e.g., 'authorId')
          foreignKeys.push(`${relName}Id`);
        }
      } else {
        // Side-load mode: keep foreign keys, add full models separately
        if (isCollection) {
          // HasMany: side-load all models as array
          sideLoaded[relName] = relatedData.models.map((relModel: any) => {
            return { ...relModel.attrs };
          });
        } else {
          // BelongsTo: side-load single model
          sideLoaded[relName] = { ...relatedData.attrs };
        }
      }
    }

    return { embedded, sideLoaded, foreignKeys };
  }
}
