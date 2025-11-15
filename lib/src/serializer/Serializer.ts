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
    this._include = options?.include;

    // Determine effective embed value
    // When include is specified without embed, default to false (side-load mode)
    // When include is not specified, embed is undefined (no relationships)
    // When embed is explicitly true, use true (embed mode)
    const hasInclude = options?.include && options.include.length > 0;
    const effectiveEmbed = hasInclude && options?.embed === undefined ? false : options?.embed;
    this._embed = effectiveEmbed;

    // Side-load mode (embed=false) requires root wrapping for side-loaded relationships
    // Auto-enable root when embed=false
    if (effectiveEmbed === false) {
      if (options?.root === false) {
        // Warn user that root=false will be ignored with embed=false
        console.warn(
          `[Mirage Serializer]: 'root' cannot be disabled when 'embed' is false. ` +
            `Side-loaded relationships require root wrapping. ` +
            `The 'root=false' setting will be ignored and 'root=true' will be used instead.`,
        );
      }
      // Force root to true when embed=false (use collection name as default root key)
      this._root = options?.root === false ? true : (options?.root ?? true);
    } else {
      // For embed=true or no relationships, respect the user's root setting
      this._root = options?.root;
    }
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
   * without applying any root wrapping. Used internally by serialize().
   * @param model - The model instance to serialize
   * @returns The serialized model data without root wrapping
   */
  private serializeData<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): Record<string, any> {
    const attrs = this._getAttributes(model);

    // Default behavior: if include is not specified or empty, return only attributes
    // No foreign keys for relationships and no relationship data
    if (!this._include || this._include.length === 0) {
      // Remove all foreign keys from attributes when include is empty
      return this._removeForeignKeys(attrs, model);
    }

    const { embedded, sideLoaded, foreignKeys } = this._getRelationships(model);

    if (this._embed) {
      // Embed mode (embed=true):
      // - Remove foreign keys from attributes
      // - Merge embedded relationships directly into the result
      // Example: { id: 1, name: 'John', posts: [...] } (no postIds)
      const filteredAttrs = { ...attrs };
      for (const fk of foreignKeys) {
        delete filteredAttrs[fk];
      }
      return { ...filteredAttrs, ...embedded };
    }

    // Side-load mode (embed=false):
    // - Keep foreign keys in attributes
    // - Merge side-loaded relationships at the same level
    // Example: { id: 1, name: 'John', postIds: [...], posts: [...] }
    return { ...attrs, ...sideLoaded };
  }

  /**
   * Serialize a single model instance with structural formatting
   * Applies root wrapping if configured
   * Can be overridden in custom serializers.
   * @param model - The model instance to serialize
   * @returns The serialized model with structural formatting applied
   */
  serialize<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): TSerializedModel {
    const data = this.serializeData(model);

    if (this._root) {
      const rootKey = typeof this._root === 'string' ? this._root : this._modelName;
      // With root wrapping: wrap data in root key
      return { [rootKey]: data } as TSerializedModel;
    }

    // Without root wrapping: return data as-is
    return data as TSerializedModel;
  }

  /**
   * Serialize raw data from a collection without structural wrapping
   * Returns an array of serialized model data without root wrapping
   * Used internally by serializeCollection().
   * @param collection - The model collection to serialize
   * @returns Array of serialized model data
   */
  private serializeCollectionData<TSchema extends SchemaCollections>(
    collection: ModelCollection<TTemplate, TSchema>,
  ): Record<string, any>[] {
    return collection.models.map((model) => this.serializeData(model));
  }

  /**
   * Serialize a model collection with structural formatting
   * Applies root wrapping if configured
   * Can be overridden in custom serializers.
   * @param collection - The model collection to serialize
   * @returns The serialized collection with structural formatting applied
   */
  serializeCollection<TSchema extends SchemaCollections>(
    collection: ModelCollection<TTemplate, TSchema>,
  ): TSerializedCollection {
    const data = this.serializeCollectionData(collection);

    if (this._root) {
      const rootKey = typeof this._root === 'string' ? this._root : this._collectionName;
      // With root wrapping: wrap data in root key
      return { [rootKey]: data } as TSerializedCollection;
    }

    // Without root wrapping: return array directly
    return data as TSerializedCollection;
  }

  /**
   * Get the attributes to include in serialization
   * @param model - The model instance
   * @returns Object with attributes
   */
  private _getAttributes<TSchema extends SchemaCollections>(
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
  private _getRelationships<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): { embedded: Record<string, any>; sideLoaded: Record<string, any>; foreignKeys: string[] } {
    const embedded: Record<string, any> = {};
    const sideLoaded: Record<string, any> = {};
    const foreignKeys: string[] = [];

    // include defaults to [] - no relationships are included by default
    if (!this._include || this._include.length === 0) {
      return { embedded, sideLoaded, foreignKeys };
    }

    for (const relName of this._include) {
      // Access the relationship from the model (dynamic property - models/collections)
      const relatedData = (model as any)[relName];

      // Skip if relationship doesn't exist or is undefined
      if (relatedData === undefined) {
        continue;
      }

      // Check if it's a ModelCollection (hasMany)
      const isCollection =
        relatedData !== null && typeof relatedData === 'object' && 'models' in relatedData;

      // Handle null relationships (belongsTo with no related model)
      if (relatedData === null) {
        if (this._embed) {
          // Embed mode: set relationship to null and track FK to remove
          embedded[relName] = null;
          foreignKeys.push(`${relName}Id`);
        } else {
          // Side-load mode: set relationship to empty array using collectionName
          const relationships = model.relationships as Record<string, any> | undefined;
          const relationship = relationships?.[relName];
          const collectionName = relationship?.collectionName || relName;
          sideLoaded[collectionName] = [];
        }
        continue;
      }

      if (this._embed) {
        // Embed mode (embed=true):
        // - Embed relationships directly in the result
        // - Track foreign keys to remove from attributes
        if (isCollection) {
          // HasMany: embed array of models
          embedded[relName] = relatedData.models.map((relModel: any) => {
            return { ...relModel.attrs };
          });
          // Track foreign key to remove (e.g., 'postIds')
          foreignKeys.push(`${relName.replace(/s$/, '')}Ids`);
        } else {
          // BelongsTo: embed single model
          embedded[relName] = { ...relatedData.attrs };
          // Track foreign key to remove (e.g., 'authorId')
          foreignKeys.push(`${relName}Id`);
        }
      } else {
        // Side-load mode (embed=false):
        // - Add relationships as arrays (even belongsTo) at the same level
        // - Use collectionName from relationship definition for all relationship names
        // - Foreign keys remain in attributes (not tracked for removal)
        if (isCollection) {
          // HasMany: side-load array of models using collectionName
          const relationships = model.relationships as Record<string, any> | undefined;
          const relationship = relationships?.[relName];
          const collectionName = relationship?.collectionName || relName;
          sideLoaded[collectionName] = relatedData.models.map((relModel: any) => {
            return { ...relModel.attrs };
          });
        } else {
          // BelongsTo: side-load as array using collectionName from relationship
          const relationships = model.relationships as Record<string, any> | undefined;
          const relationship = relationships?.[relName];
          const collectionName = relationship?.collectionName || relName;
          sideLoaded[collectionName] = [{ ...relatedData.attrs }];
        }
      }
    }

    return { embedded, sideLoaded, foreignKeys };
  }

  /**
   * Remove all foreign keys from attributes
   * This is used when include=[] to exclude relationship foreign keys
   * @param attrs - The attributes object
   * @param model - The model instance
   * @returns Attributes without foreign keys
   */
  private _removeForeignKeys<TSchema extends SchemaCollections>(
    attrs: Record<string, any>,
    model: ModelInstance<TTemplate, TSchema>,
  ): Record<string, any> {
    const result = { ...attrs };
    const relationships = model.relationships as Record<string, any> | undefined;

    if (!relationships) {
      return result;
    }

    // Remove foreign keys based on relationship definitions
    for (const relName in relationships) {
      const relationship = relationships[relName];
      if (relationship.type === 'hasMany') {
        // Remove hasMany foreign key array (e.g., 'postIds')
        const singularName = relName.replace(/s$/, '');
        delete result[`${singularName}Ids`];
      } else if (relationship.type === 'belongsTo') {
        // Remove belongsTo foreign key (e.g., 'authorId')
        const fk = relationship.foreignKey || `${relName}Id`;
        delete result[fk];
      }
    }

    return result;
  }
}
