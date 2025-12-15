import type {
  SerializedCollectionFor,
  SerializedModelFor,
  ModelInstance,
  ModelTemplate,
} from '@src/model';
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
 *
 * // Override options at call time
 * const json = serializer.serialize(user, { root: false });
 * ```
 */
export default class Serializer<
  TTemplate extends ModelTemplate,
  TSerializedModel = SerializedModelFor<TTemplate>,
  TSerializedCollection = SerializedCollectionFor<TTemplate>,
  TOptions extends SerializerOptions<TTemplate> = SerializerOptions<TTemplate>,
> {
  public readonly modelName: string;
  public readonly collectionName: string;

  protected _options: TOptions;

  constructor(template: TTemplate, options?: TOptions) {
    this.modelName = template.modelName;
    this.collectionName = template.collectionName;
    this._options = (options ?? {}) as TOptions;
  }

  /**
   * Serialize a single model instance with structural formatting
   * Applies root wrapping if configured
   * Can be overridden in custom serializers.
   * @param model - The model instance to serialize
   * @param options - Optional method-level options to override class-level options
   * @returns The serialized model with structural formatting applied
   */
  serialize<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
    options?: Partial<SerializerOptions<TTemplate>>,
  ): TSerializedModel {
    const opts = this._resolveOptions(options);
    const data = this._serializeData(model, opts);

    // Side-load mode: extract side-loaded relationships and place them at top level
    // Only when embed=false is explicitly set
    if (opts.embed === false && opts.include && opts.include.length > 0) {
      const { sideLoaded } = this._getRelationships(model, opts);

      // Get attributes without side-loaded relationships
      const attrs = this._getAttributes(model, opts);

      if (opts.root) {
        const rootKey = typeof opts.root === 'string' ? opts.root : this.modelName;
        // With root wrapping: wrap attributes in root key, side-load relationships at top level
        return { [rootKey]: attrs, ...sideLoaded } as TSerializedModel;
      }

      // Without root wrapping: return attributes with side-loaded relationships at same level
      return { ...attrs, ...sideLoaded } as TSerializedModel;
    }

    // Embed mode or no includes: use the combined data
    if (opts.root) {
      const rootKey = typeof opts.root === 'string' ? opts.root : this.modelName;
      // With root wrapping: wrap data in root key
      return { [rootKey]: data } as TSerializedModel;
    }

    // Without root wrapping: return data as-is
    return data as TSerializedModel;
  }

  /**
   * Serialize a model collection with structural formatting
   * Applies root wrapping if configured
   * Can be overridden in custom serializers.
   * @param collection - The model collection to serialize
   * @param options - Optional method-level options to override class-level options
   * @returns The serialized collection with structural formatting applied
   */
  serializeCollection<TSchema extends SchemaCollections>(
    collection: ModelCollection<TTemplate, TSchema>,
    options?: Partial<SerializerOptions<TTemplate>>,
  ): TSerializedCollection {
    const opts = this._resolveOptions(options);
    const data = this._serializeCollectionData(collection, opts);

    if (opts.root) {
      const rootKey = typeof opts.root === 'string' ? opts.root : this.collectionName;
      // With root wrapping: wrap data in root key
      return { [rootKey]: data } as TSerializedCollection;
    }

    // Without root wrapping: return array directly
    return data as TSerializedCollection;
  }

  // -- PRIVATE HELPERS --

  /**
   * Merge class-level options with method-level options and resolve root for side-load mode
   * Method-level options override class-level options
   * @param methodOptions - Optional method-level options
   * @returns Resolved options with root auto-enabled for side-load mode
   */
  private _resolveOptions(
    methodOptions?: Partial<SerializerOptions<TTemplate>>,
  ): SerializerOptions<TTemplate> {
    // Merge class-level options with method-level options
    const merged = {
      attrs: methodOptions?.attrs ?? this._options.attrs,
      include: methodOptions?.include ?? this._options.include,
      embed: methodOptions?.embed ?? this._options.embed,
      root: methodOptions?.root ?? this._options.root,
    };

    // Side-load mode (embed=false) requires root wrapping for side-loaded relationships
    // Auto-enable root when embed=false is explicitly set
    if (merged.embed === false) {
      if (merged.root === false) {
        // Warn user that root=false will be ignored with embed=false
        console.warn(
          `[Mirage Serializer]: 'root' cannot be disabled when 'embed' is false. ` +
            `Side-loaded relationships require root wrapping. ` +
            `The 'root=false' setting will be ignored and 'root=true' will be used instead.`,
        );
      }
      // Force root to true when embed=false (use collection name as default root key)
      merged.root = merged.root === false ? true : (merged.root ?? true);
    }

    return merged;
  }

  /**
   * Serialize raw data from a model without structural wrapping
   * This method extracts and returns the data (attributes + relationships)
   * without applying any root wrapping. Used internally by serialize().
   * @param model - The model instance to serialize
   * @param opts - Resolved serializer options
   * @returns The serialized model data without root wrapping
   */
  private _serializeData<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate>,
  ): Record<string, unknown> {
    const attrs = this._getAttributes(model, opts);

    // Default behavior: if include is not specified or empty, return only attributes
    // No foreign keys for relationships and no relationship data
    if (!opts.include || opts.include.length === 0) {
      // Remove all foreign keys from attributes when include is empty
      return this._removeForeignKeys(attrs, model);
    }

    const { embedded } = this._getRelationships(model, opts);

    if (opts.embed === true) {
      // Embed mode (embed=true):
      // - Remove ALL foreign keys from attributes (both included and not included)
      // - Merge embedded relationships directly into the result
      // Example: include=['posts'] -> { id: 1, name: 'John', posts: [...] } (no postIds, no other FKs)
      const filteredAttrs = this._removeForeignKeys(attrs, model);
      return { ...filteredAttrs, ...embedded };
    }

    if (opts.embed === false) {
      // Side-load mode (embed=false):
      // - Keep foreign keys in attributes
      // - Side-loaded relationships will be handled in serialize() at top level
      // Example: In serializeData, just return attrs with foreign keys
      return attrs;
    }

    // Default mode (embed=undefined):
    // - Include foreign keys ONLY for relationships in the include array
    // - No relationship data
    // Example: include=['author'] -> { id: 1, title: '...', authorId: 1 } (no commentIds)
    const filteredAttrs = { ...attrs };
    const relationships = model.relationships as Record<string, unknown> | undefined;

    if (relationships) {
      // Remove foreign keys for relationships NOT in the include array
      for (const relName in relationships) {
        if (!opts.include.includes(relName)) {
          const relationship = relationships[relName] as { type: string; foreignKey?: string };
          if (relationship.type === 'hasMany') {
            // Remove hasMany foreign key array (e.g., 'commentIds')
            const singularName = relName.replace(/s$/, '');
            delete filteredAttrs[`${singularName}Ids`];
          } else if (relationship.type === 'belongsTo') {
            // Remove belongsTo foreign key (e.g., 'authorId')
            const fk = relationship.foreignKey || `${relName}Id`;
            delete filteredAttrs[fk];
          }
        }
      }
    }

    return filteredAttrs;
  }

  /**
   * Serialize raw data from a collection without structural wrapping
   * Returns an array of serialized model data without root wrapping
   * Used internally by serializeCollection().
   * @param collection - The model collection to serialize
   * @param opts - Resolved serializer options
   * @returns Array of serialized model data
   */
  private _serializeCollectionData<TSchema extends SchemaCollections>(
    collection: ModelCollection<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate>,
  ): Record<string, unknown>[] {
    // For collections with side-load mode (embed=false), we include relationships
    // within each model object in the array (not extracted to top level like single models)
    if (opts.embed === false && opts.include && opts.include.length > 0) {
      return collection.models.map((model) => {
        const attrs = this._getAttributes(model, opts);
        const { sideLoaded } = this._getRelationships(model, opts);
        return { ...attrs, ...sideLoaded };
      });
    }

    return collection.models.map((model) => this._serializeData(model, opts));
  }

  /**
   * Get the attributes to include in serialization
   * @param model - The model instance
   * @param opts - Resolved serializer options
   * @returns Object with attributes
   */
  private _getAttributes<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate>,
  ): Record<string, unknown> {
    // If specific attributes are configured, only include those
    if (opts.attrs && opts.attrs.length > 0) {
      return opts.attrs.reduce(
        (acc, attr) => {
          acc[attr as string] = model.attrs[attr as keyof typeof model.attrs];
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }

    // Default: return raw attributes (no embedding, no filtering)
    return { ...model.attrs };
  }

  /**
   * Get relationships to include in serialization
   * Returns embedded relationships, side-loaded relationships, and foreign keys
   * @param model - The model instance
   * @param opts - Resolved serializer options
   * @returns Object with embedded, sideLoaded, and foreignKeys
   */
  private _getRelationships<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate>,
  ): {
    embedded: Record<string, unknown>;
    sideLoaded: Record<string, unknown>;
    foreignKeys: string[];
  } {
    const embedded: Record<string, unknown> = {};
    const sideLoaded: Record<string, unknown> = {};
    const foreignKeys: string[] = [];

    // include defaults to [] - no relationships are included by default
    if (!opts.include || opts.include.length === 0) {
      return { embedded, sideLoaded, foreignKeys };
    }

    for (const relName of opts.include) {
      // Access the relationship from the model (dynamic property - models/collections)
      const relatedData = (model as Record<string, unknown>)[relName];

      // Skip if relationship doesn't exist or is undefined
      if (relatedData === undefined) {
        continue;
      }

      // Check if it's a ModelCollection (hasMany)
      const isCollection =
        relatedData !== null && typeof relatedData === 'object' && 'models' in relatedData;

      // Handle null relationships (belongsTo with no related model)
      if (relatedData === null) {
        if (opts.embed) {
          // Embed mode: set relationship to null and track FK to remove
          embedded[relName] = null;
          foreignKeys.push(`${relName}Id`);
        } else {
          // Side-load mode: set relationship to empty array using collectionName
          const relationships = model.relationships as Record<string, unknown> | undefined;
          const relationship = relationships?.[relName] as { collectionName?: string } | undefined;
          const collectionName = relationship?.collectionName || relName;
          sideLoaded[collectionName] = [];
        }
        continue;
      }

      if (opts.embed) {
        // Embed mode (embed=true):
        // - Embed relationships directly in the result
        // - Track foreign keys to remove from attributes
        if (isCollection) {
          // HasMany: embed array of models
          const collection = relatedData as { models: Array<{ attrs: Record<string, unknown> }> };
          embedded[relName] = collection.models.map((relModel) => {
            return { ...relModel.attrs };
          });
          // Track foreign key to remove (e.g., 'postIds')
          foreignKeys.push(`${relName.replace(/s$/, '')}Ids`);
        } else {
          // BelongsTo: embed single model
          const relModel = relatedData as { attrs: Record<string, unknown> };
          embedded[relName] = { ...relModel.attrs };
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
          const relationships = model.relationships as Record<string, unknown> | undefined;
          const relationship = relationships?.[relName] as { collectionName?: string } | undefined;
          const collectionName = relationship?.collectionName || relName;
          const collection = relatedData as { models: Array<{ attrs: Record<string, unknown> }> };
          sideLoaded[collectionName] = collection.models.map((relModel) => {
            return { ...relModel.attrs };
          });
        } else {
          // BelongsTo: side-load as array using collectionName from relationship
          const relationships = model.relationships as Record<string, unknown> | undefined;
          const relationship = relationships?.[relName] as { collectionName?: string } | undefined;
          const collectionName = relationship?.collectionName || relName;
          const relModel = relatedData as { attrs: Record<string, unknown> };
          sideLoaded[collectionName] = [{ ...relModel.attrs }];
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
    attrs: Record<string, unknown>,
    model: ModelInstance<TTemplate, TSchema>,
  ): Record<string, unknown> {
    const result = { ...attrs };
    const relationships = model.relationships as Record<string, unknown> | undefined;

    if (!relationships) {
      return result;
    }

    // Remove foreign keys based on relationship definitions
    for (const relName in relationships) {
      const relationship = relationships[relName] as { type: string; foreignKey?: string };
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
