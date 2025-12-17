import type {
  SerializedCollectionFor,
  SerializedModelFor,
  ModelInstance,
  ModelTemplate,
  RelationshipsByTemplate,
} from '@src/model';
import type ModelCollection from '@src/model/ModelCollection';
import type { SchemaCollections } from '@src/schema';

import type {
  SerializerOptions,
  SelectOption,
  WithOption,
  NestedSerializerOptions,
  RelationsMode,
} from './types';

/**
 * Serializer class that handles model serialization with custom JSON types
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type for relationship suggestions
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
 * const serializer = new Serializer<UserTemplate, MySchema, UserJSON, UsersJSON>(
 *   userTemplate,
 *   {
 *     select: ['id', 'name'],
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
  TSchema extends SchemaCollections = SchemaCollections,
  TSerializedModel = SerializedModelFor<TTemplate>,
  TSerializedCollection = SerializedCollectionFor<TTemplate>,
  TOptions extends SerializerOptions<TTemplate, TSchema> = SerializerOptions<TTemplate, TSchema>,
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
  serialize(
    model: ModelInstance<TTemplate, TSchema>,
    options?: Partial<SerializerOptions<TTemplate, TSchema>>,
  ): TSerializedModel {
    const opts = this._resolveOptions(options);
    const data = this._serializeData(model, opts);

    // Side-load mode: extract side-loaded relationships and place them at top level
    const withNames = this._getWithNames(opts.with);
    if (opts.relationsMode === 'sideLoaded' && withNames.length > 0) {
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
  serializeCollection(
    collection: ModelCollection<TTemplate, TSchema>,
    options?: Partial<SerializerOptions<TTemplate, TSchema>>,
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
    methodOptions?: Partial<SerializerOptions<TTemplate, TSchema>>,
  ): SerializerOptions<TTemplate, TSchema> {
    // Merge class-level options with method-level options
    const merged: SerializerOptions<TTemplate, TSchema> = {
      select: methodOptions?.select ?? this._options.select,
      with: methodOptions?.with ?? this._options.with,
      relationsMode: methodOptions?.relationsMode ?? this._options.relationsMode,
      root: methodOptions?.root ?? this._options.root,
    };

    // Side-load mode requires root wrapping for side-loaded relationships
    // Auto-enable root when relationsMode='sideLoaded'
    if (merged.relationsMode === 'sideLoaded') {
      if (merged.root === false) {
        // Warn user that root=false will be ignored with relationsMode='sideLoaded'
        console.warn(
          `[Mirage Serializer]: 'root' cannot be disabled when 'relationsMode' is 'sideLoaded'. ` +
            `Side-loaded relationships require root wrapping. ` +
            `The 'root=false' setting will be ignored and 'root=true' will be used instead.`,
        );
      }
      // Force root to true when relationsMode='sideLoaded'
      merged.root = merged.root === false ? true : (merged.root ?? true);
    }

    return merged;
  }

  /**
   * Get relationship names from with option
   * @param withOption - The with option (array, object, or undefined)
   * @returns Array of relationship names to include
   */
  private _getWithNames(
    withOption: WithOption<RelationshipsByTemplate<TTemplate, TSchema>> | undefined,
  ): string[] {
    if (!withOption) {
      return [];
    }

    if (Array.isArray(withOption)) {
      return withOption as string[];
    }

    // Object format: get names where value is truthy (not false)
    return Object.entries(withOption)
      .filter(([, value]) => value !== false)
      .map(([name]) => name);
  }

  /**
   * Get nested options for a specific relationship
   * @param withOption - The with option
   * @param relName - The relationship name
   * @returns Nested options or undefined
   */
  private _getNestedOptions(
    withOption: WithOption<RelationshipsByTemplate<TTemplate, TSchema>> | undefined,
    relName: string,
  ): NestedSerializerOptions<ModelTemplate> | undefined {
    if (!withOption || Array.isArray(withOption)) {
      return undefined;
    }

    const value = withOption[relName as keyof typeof withOption];
    if (typeof value === 'object' && value !== null) {
      return value;
    }

    return undefined;
  }

  /**
   * Serialize raw data from a model without structural wrapping
   * This method extracts and returns the data (attributes + relationships)
   * without applying any root wrapping. Used internally by serialize().
   * @param model - The model instance to serialize
   * @param opts - Resolved serializer options
   * @returns The serialized model data without root wrapping
   */
  private _serializeData(
    model: ModelInstance<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate, TSchema>,
  ): Record<string, unknown> {
    const attrs = this._getAttributes(model, opts);
    const withNames = this._getWithNames(opts.with);

    // Default behavior: if with is not specified or empty, return only attributes
    // No foreign keys for relationships and no relationship data
    if (withNames.length === 0) {
      // Remove all foreign keys from attributes when with is empty
      return this._removeForeignKeys(attrs, model);
    }

    const { embedded, sideLoaded } = this._getRelationships(model, opts);

    if (opts.relationsMode === 'embedded') {
      // Embed mode (relationsMode='embedded'):
      // - Remove ALL foreign keys from attributes (both included and not included)
      // - Merge embedded relationships directly into the result
      // - Also merge sideLoaded relationships (for per-relationship mode overrides)
      // Example: with=['posts'] -> { id: 1, name: 'John', posts: [...] } (no postIds, no other FKs)
      const filteredAttrs = this._removeForeignKeys(attrs, model);
      return { ...filteredAttrs, ...embedded, ...sideLoaded };
    }

    if (opts.relationsMode === 'sideLoaded') {
      // Side-load mode (relationsMode='sideLoaded'):
      // - Keep foreign keys in attributes
      // - Side-loaded relationships will be handled in serialize() at top level
      // Example: In serializeData, just return attrs with foreign keys
      return attrs;
    }

    // Default mode (relationsMode=undefined):
    // - Include foreign keys ONLY for relationships in the with array
    // - No relationship data
    // Example: with=['author'] -> { id: 1, title: '...', authorId: 1 } (no commentIds)
    const filteredAttrs = { ...attrs };
    const relationships = model.relationships as Record<string, unknown> | undefined;

    if (relationships) {
      // Remove foreign keys for relationships NOT in the with array
      for (const relName in relationships) {
        if (!withNames.includes(relName)) {
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
  private _serializeCollectionData(
    collection: ModelCollection<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate, TSchema>,
  ): Record<string, unknown>[] {
    const withNames = this._getWithNames(opts.with);

    // For collections with side-load mode (relationsMode='sideLoaded'), we include relationships
    // within each model object in the array (not extracted to top level like single models)
    if (opts.relationsMode === 'sideLoaded' && withNames.length > 0) {
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
  private _getAttributes(
    model: ModelInstance<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate, TSchema>,
  ): Record<string, unknown> {
    const select = opts.select;

    // If no select option, return all attributes
    if (!select) {
      return { ...model.attrs };
    }

    // Array format: include only these attributes
    if (Array.isArray(select)) {
      if (select.length === 0) {
        return { ...model.attrs };
      }
      return select.reduce(
        (acc, attr) => {
          acc[attr as string] = model.attrs[attr as keyof typeof model.attrs];
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }

    // Object format: determine inclusion/exclusion mode
    const entries = Object.entries(select);
    if (entries.length === 0) {
      return { ...model.attrs };
    }

    const hasTrue = entries.some(([, value]) => value === true);
    const hasFalse = entries.some(([, value]) => value === false);

    // All false values: exclusion mode - include all except false keys
    if (hasFalse && !hasTrue) {
      const excludeKeys = entries.filter(([, value]) => value === false).map(([key]) => key);
      return Object.entries(model.attrs).reduce(
        (acc, [key, value]) => {
          if (!excludeKeys.includes(key)) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }

    // Has true values (all true or mixed): inclusion mode - include only true keys
    const includeKeys = entries.filter(([, value]) => value === true).map(([key]) => key);
    return includeKeys.reduce(
      (acc, key) => {
        acc[key] = model.attrs[key as keyof typeof model.attrs];
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  /**
   * Get relationships to include in serialization
   * Returns embedded relationships, side-loaded relationships, and foreign keys
   * @param model - The model instance
   * @param opts - Resolved serializer options
   * @returns Object with embedded, sideLoaded, and foreignKeys
   */
  private _getRelationships(
    model: ModelInstance<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate, TSchema>,
  ): {
    embedded: Record<string, unknown>;
    sideLoaded: Record<string, unknown>;
    foreignKeys: string[];
  } {
    const embedded: Record<string, unknown> = {};
    const sideLoaded: Record<string, unknown> = {};
    const foreignKeys: string[] = [];

    const withNames = this._getWithNames(opts.with);

    // with defaults to [] - no relationships are included by default
    if (withNames.length === 0) {
      return { embedded, sideLoaded, foreignKeys };
    }

    for (const relName of withNames) {
      // Access the relationship from the model (dynamic property - models/collections)
      const relatedData = (model as Record<string, unknown>)[relName];

      // Skip if relationship doesn't exist or is undefined
      if (relatedData === undefined) {
        continue;
      }

      // Get nested options for this relationship
      const nestedOpts = this._getNestedOptions(opts.with, relName);

      // Determine mode for this relationship: nested mode overrides default relationsMode
      const relationMode: RelationsMode = nestedOpts?.mode ?? opts.relationsMode ?? 'embedded';

      // Check if it's a ModelCollection (hasMany)
      const isCollection =
        relatedData !== null && typeof relatedData === 'object' && 'models' in relatedData;

      // Handle null relationships (belongsTo with no related model)
      if (relatedData === null) {
        if (relationMode === 'embedded') {
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

      if (relationMode === 'embedded') {
        // Embed mode:
        // - Embed relationships directly in the result
        // - Track foreign keys to remove from attributes
        if (isCollection) {
          // HasMany: embed array of models
          const collection = relatedData as { models: Array<{ attrs: Record<string, unknown> }> };
          embedded[relName] = collection.models.map((relModel) => {
            return this._serializeRelatedModel(relModel, nestedOpts);
          });
          // Track foreign key to remove (e.g., 'postIds')
          foreignKeys.push(`${relName.replace(/s$/, '')}Ids`);
        } else {
          // BelongsTo: embed single model
          const relModel = relatedData as { attrs: Record<string, unknown> };
          embedded[relName] = this._serializeRelatedModel(relModel, nestedOpts);
          // Track foreign key to remove (e.g., 'authorId')
          foreignKeys.push(`${relName}Id`);
        }
      } else {
        // Side-load mode:
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
            return this._serializeRelatedModel(relModel, nestedOpts);
          });
        } else {
          // BelongsTo: side-load as array using collectionName from relationship
          const relationships = model.relationships as Record<string, unknown> | undefined;
          const relationship = relationships?.[relName] as { collectionName?: string } | undefined;
          const collectionName = relationship?.collectionName || relName;
          const relModel = relatedData as { attrs: Record<string, unknown> };
          sideLoaded[collectionName] = [this._serializeRelatedModel(relModel, nestedOpts)];
        }
      }
    }

    return { embedded, sideLoaded, foreignKeys };
  }

  /**
   * Serialize a related model with nested options
   * Applies select and nested with options (with boolean only)
   * @param relModel - The related model to serialize containing attrs property
   * @param relModel.attrs - The model's attributes
   * @param nestedOpts - Nested serializer options
   * @returns Serialized related model data
   */
  private _serializeRelatedModel(
    relModel: { attrs: Record<string, unknown> },
    nestedOpts?: NestedSerializerOptions<ModelTemplate>,
  ): Record<string, unknown> {
    let attrs = { ...relModel.attrs };

    // Apply select option if present
    if (nestedOpts?.select) {
      attrs = this._applySelectToAttrs(attrs, nestedOpts.select);
    }

    // Apply nested with option (boolean only) if present and relModel has relationships
    if (nestedOpts?.with) {
      const relModelInstance = relModel as Record<string, unknown>;
      for (const [nestedRelName, include] of Object.entries(nestedOpts.with)) {
        if (include === true) {
          const nestedRelData = relModelInstance[nestedRelName];
          if (nestedRelData !== undefined && nestedRelData !== null) {
            // Check if it's a collection or single model
            const isNestedCollection =
              typeof nestedRelData === 'object' && 'models' in (nestedRelData as object);
            if (isNestedCollection) {
              const collection = nestedRelData as {
                models: Array<{ attrs: Record<string, unknown> }>;
              };
              attrs[nestedRelName] = collection.models.map((m) => ({ ...m.attrs }));
            } else {
              const model = nestedRelData as { attrs: Record<string, unknown> };
              attrs[nestedRelName] = { ...model.attrs };
            }
          } else if (nestedRelData === null) {
            attrs[nestedRelName] = null;
          }
        }
      }
    }

    return attrs;
  }

  /**
   * Apply select option to attributes object
   * @param attrs - The attributes to filter
   * @param select - The select option
   * @returns Filtered attributes
   */
  private _applySelectToAttrs(
    attrs: Record<string, unknown>,
    select: SelectOption<ModelTemplate>,
  ): Record<string, unknown> {
    // Array format: include only these attributes
    if (Array.isArray(select)) {
      if (select.length === 0) {
        return attrs;
      }
      return (select as string[]).reduce(
        (acc, key) => {
          if (key in attrs) {
            acc[key] = attrs[key];
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }

    // Object format: determine inclusion/exclusion mode
    const entries = Object.entries(select);
    if (entries.length === 0) {
      return attrs;
    }

    const hasTrue = entries.some(([, value]) => value === true);
    const hasFalse = entries.some(([, value]) => value === false);

    // All false values: exclusion mode - include all except false keys
    if (hasFalse && !hasTrue) {
      const excludeKeys = entries.filter(([, value]) => value === false).map(([key]) => key);
      return Object.entries(attrs).reduce(
        (acc, [key, value]) => {
          if (!excludeKeys.includes(key)) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }

    // Has true values (all true or mixed): inclusion mode - include only true keys
    const includeKeys = entries.filter(([, value]) => value === true).map(([key]) => key);
    return includeKeys.reduce(
      (acc, key) => {
        if (key in attrs) {
          acc[key] = attrs[key];
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  /**
   * Remove all foreign keys from attributes
   * This is used when with=[] to exclude relationship foreign keys
   * @param attrs - The attributes object
   * @param model - The model instance
   * @returns Attributes without foreign keys
   */
  private _removeForeignKeys(
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
