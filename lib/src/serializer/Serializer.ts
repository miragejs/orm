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

// TODO: Review types to make them more precise
// TODO: Review the serializer logic for potential performance optimization
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
 *     root: 'user',
 *     with: {
 *       posts: true,
 *     }
 *     relationsMode: 'embedded',
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
  TOptions extends SerializerOptions<TTemplate, TSchema> = SerializerOptions<
    TTemplate,
    TSchema
  >,
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
    const data = this.serializeModel(model, options);

    // Side-load mode: extract side-loaded relationships and place them at top level
    const withNames = this._getWithNames(opts.with);
    const hasRelations = withNames.length > 0;
    const hasSideLoaded =
      opts.relationsMode === 'sideLoaded' ||
      opts.relationsMode === 'sideLoaded+foreignKey';

    if (hasRelations && hasSideLoaded) {
      const { sideLoaded } = this._getRelationships(model, opts);

      // Get attributes without side-loaded relationships
      const attrs = this._getAttributes(model, opts);

      if (opts.root) {
        const rootKey =
          typeof opts.root === 'string' ? opts.root : this.modelName;
        // With root wrapping: wrap attributes in root key, side-load relationships at top level
        return { [rootKey]: attrs, ...sideLoaded } as TSerializedModel;
      }

      // Without root wrapping: return attributes with side-loaded relationships at same level
      return { ...attrs, ...sideLoaded } as TSerializedModel;
    }

    // Embed mode or no includes: use the combined data
    if (opts.root) {
      const rootKey =
        typeof opts.root === 'string' ? opts.root : this.modelName;
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
    const data = this.serializeCollectionModels(collection, options);

    if (opts.root) {
      const rootKey =
        typeof opts.root === 'string' ? opts.root : this.collectionName;
      // With root wrapping: wrap data in root key
      return { [rootKey]: data } as TSerializedCollection;
    }

    // Without root wrapping: return array directly
    return data as TSerializedCollection;
  }

  // -- LAYER 1: ATTRIBUTES ONLY --

  /**
   * Layer 1: Serialize only model attributes with foreign keys
   * Respects select config for regular attributes.
   * Always includes all foreign keys regardless of select.
   * Does not include relationships.
   * @param model - The model instance to serialize
   * @returns The serialized attributes with foreign keys
   */
  serializeAttrs(
    model: ModelInstance<TTemplate, TSchema>,
  ): Record<string, unknown> {
    const opts = this._resolveOptions();
    const attrs = this._getAttributes(model, opts);

    // Add all foreign keys from relationships
    const relationships = model.relationships as
      | Record<string, unknown>
      | undefined;

    if (relationships) {
      for (const relName in relationships) {
        const relationship = relationships[relName] as {
          foreignKey: string;
        };

        if (relationship?.foreignKey) {
          const fkValue = model.attrs[
            relationship.foreignKey as keyof typeof model.attrs
          ] as unknown;

          if (fkValue !== undefined) {
            attrs[relationship.foreignKey] = fkValue;
          }
        }
      }
    }

    return attrs;
  }

  /**
   * Layer 1: Serialize collection as array of attributes with foreign keys
   * Respects select config for regular attributes.
   * Always includes all foreign keys regardless of select.
   * Does not include relationships.
   * @param collection - The model collection to serialize
   * @returns Array of serialized attributes with foreign keys
   */
  serializeCollectionAttrs(
    collection: ModelCollection<TTemplate, TSchema>,
  ): Record<string, unknown>[] {
    return collection.models.map((model) => this.serializeAttrs(model));
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
      relationsMode:
        methodOptions?.relationsMode ?? this._options.relationsMode,
      root: methodOptions?.root ?? this._options.root,
    };

    // Set default relationsMode if not specified
    if (
      !merged.relationsMode &&
      merged.with &&
      this._getWithNames(merged.with).length > 0
    ) {
      merged.relationsMode = 'foreignKey';
    }

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
    withOption:
      | WithOption<RelationshipsByTemplate<TTemplate, TSchema>>
      | undefined,
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
    withOption:
      | WithOption<RelationshipsByTemplate<TTemplate, TSchema>>
      | undefined,
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

  // -- LAYER 2: WITH RELATIONSHIPS --

  /**
   * Layer 2: Serialize model with relationship handling
   * Returns attributes + relationships based on relationsMode.
   * No root wrapping. Used internally by serialize().
   * @param model - The model instance to serialize
   * @param options - Optional method-level options to override class-level options
   * @returns The serialized model data without root wrapping
   */
  serializeModel(
    model: ModelInstance<TTemplate, TSchema>,
    options?: Partial<SerializerOptions<TTemplate, TSchema>>,
  ): Record<string, unknown> {
    const opts = this._resolveOptions(options);
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
      // - Remove ALL foreign keys from ALL relationships by default
      // - EXCEPT for relationships with nested mode override to 'foreignKey' (keep their FKs)
      // - Merge embedded relationships directly into the result
      // - Also merge sideLoaded relationships (for per-relationship mode overrides)
      // Example: with=['posts'] -> { id: 1, name: 'John', posts: [...] } (no postIds, no other FKs)
      // Example with override: with={posts: {mode: 'foreignKey'}} -> { id: 1, name: 'John', postIds: [...] } (no posts)
      const filteredAttrs = { ...attrs };
      const relationships = model.relationships as
        | Record<string, unknown>
        | undefined;

      if (relationships) {
        // Remove ALL foreign keys except those with nested mode override to 'foreignKey'
        for (const relName in relationships) {
          const relationship = relationships[relName] as
            | { foreignKey: string }
            | undefined;
          if (relationship?.foreignKey) {
            // Check if this relationship has a nested mode override to 'foreignKey'
            const nestedOpts = this._getNestedOptions(opts.with, relName);
            const relationMode = nestedOpts?.mode;

            // Only keep FK if explicitly overridden to 'foreignKey'
            if (relationMode !== 'foreignKey') {
              delete filteredAttrs[relationship.foreignKey];
            }
          }
        }
      }
      return { ...filteredAttrs, ...embedded, ...sideLoaded };
    }

    if (opts.relationsMode === 'embedded+foreignKey') {
      // Embed+ForeignKey mode (relationsMode='embedded+foreignKey'):
      // - Embed relationships directly in the result
      // - Keep foreign keys for relationships in the with array
      // - Remove foreign keys for relationships NOT in the with array
      // Example: with=['posts'] -> { id: 1, name: 'John', postIds: [...], posts: [...] }
      const filteredAttrs = { ...attrs };
      const relationships = model.relationships as
        | Record<string, unknown>
        | undefined;

      if (relationships) {
        // Remove foreign keys for relationships NOT in the with array
        for (const relName in relationships) {
          if (!withNames.includes(relName)) {
            const relationship = relationships[relName] as {
              type: string;
              foreignKey: string;
            };
            if (
              relationship.type === 'hasMany' ||
              relationship.type === 'belongsTo'
            ) {
              delete filteredAttrs[relationship.foreignKey];
            }
          }
        }
      }
      return { ...filteredAttrs, ...embedded, ...sideLoaded };
    }

    if (
      opts.relationsMode === 'sideLoaded' ||
      opts.relationsMode === 'sideLoaded+foreignKey'
    ) {
      // Side-load mode (relationsMode='sideLoaded' or 'sideLoaded+foreignKey'):
      // - Keep foreign keys in attributes
      // - Side-loaded relationships will be handled in serialize() at top level
      // Example: In serializeData, just return attrs with foreign keys
      return attrs;
    }

    if (opts.relationsMode === 'foreignKey' || !opts.relationsMode) {
      // Foreign key mode (relationsMode='foreignKey' or undefined for backward compatibility):
      // - Include foreign keys ONLY for relationships in the with array
      // - No relationship data (unless per-relation mode override)
      // - Support per-relation mode overrides (e.g., with: { team: { mode: 'embedded' } })
      // Example: with=['author'] -> { id: 1, title: '...', authorId: 1 } (no commentIds)
      const filteredAttrs = { ...attrs };
      const relationships = model.relationships as
        | Record<string, unknown>
        | undefined;

      if (relationships) {
        // Process each relationship
        for (const relName in relationships) {
          const relationship = relationships[relName] as {
            type: string;
            foreignKey: string;
          };

          if (!withNames.includes(relName)) {
            // Relationship NOT in with array - remove its foreign key
            if (
              relationship.type === 'hasMany' ||
              relationship.type === 'belongsTo'
            ) {
              delete filteredAttrs[relationship.foreignKey];
            }
          } else {
            // Relationship IS in with array - check for per-relation mode override
            const nestedOpts = this._getNestedOptions(opts.with, relName);
            const relationMode = nestedOpts?.mode;

            // If per-relation mode is 'embedded', remove the foreign key
            if (relationMode === 'embedded') {
              delete filteredAttrs[relationship.foreignKey];
            }
            // For 'embedded+foreignKey', 'sideLoaded', 'sideLoaded+foreignKey', keep the FK
            // For 'foreignKey' or undefined, keep the FK (default behavior)
          }
        }
      }

      // Include embedded/sideLoaded relationships from per-relation mode overrides
      return { ...filteredAttrs, ...embedded, ...sideLoaded };
    }

    // If we reach here, throw an error for unknown mode
    throw new Error(
      `[Mirage Serializer]: Unknown relationsMode '${opts.relationsMode}'. ` +
        `Valid values are: 'foreignKey', 'embedded', 'sideLoaded', 'embedded+foreignKey', 'sideLoaded+foreignKey'.`,
    );
  }

  /**
   * Layer 2: Serialize collection as array with relationships
   * Returns array of model data with relationships based on relationsMode.
   * No root wrapping. Used internally by serializeCollection().
   * @param collection - The model collection to serialize
   * @param options - Optional method-level options to override class-level options
   * @returns Array of serialized model data
   */
  serializeCollectionModels(
    collection: ModelCollection<TTemplate, TSchema>,
    options?: Partial<SerializerOptions<TTemplate, TSchema>>,
  ): Record<string, unknown>[] {
    const opts = this._resolveOptions(options);
    const withNames = this._getWithNames(opts.with);

    // For collections with side-load mode (relationsMode='sideLoaded' or 'sideLoaded+foreignKey'), we include relationships
    // within each model object in the array (not extracted to top level like single models)
    if (
      (opts.relationsMode === 'sideLoaded' ||
        opts.relationsMode === 'sideLoaded+foreignKey') &&
      withNames.length > 0
    ) {
      return collection.models.map((model) => {
        const attrs = this._getAttributes(model, opts);
        const { sideLoaded } = this._getRelationships(model, opts);
        return { ...attrs, ...sideLoaded };
      });
    }

    return collection.models.map((model) =>
      this.serializeModel(model, options),
    );
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
      const excludeKeys = entries
        .filter(([, value]) => value === false)
        .map(([key]) => key);
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
    const includeKeys = entries
      .filter(([, value]) => value === true)
      .map(([key]) => key);
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
   * Returns embedded relationships and side-loaded relationships
   * @param model - The model instance
   * @param opts - Resolved serializer options
   * @returns Object with embedded and sideLoaded relationships
   */
  private _getRelationships(
    model: ModelInstance<TTemplate, TSchema>,
    opts: SerializerOptions<TTemplate, TSchema>,
  ): {
    embedded: Record<string, unknown>;
    sideLoaded: Record<string, unknown>;
  } {
    const embedded: Record<string, unknown> = {};
    const sideLoaded: Record<string, unknown> = {};

    const withNames = this._getWithNames(opts.with);

    // with defaults to [] - no relationships are included by default
    if (withNames.length === 0) {
      return { embedded, sideLoaded };
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
      // Default to 'foreignKey' when with relationships but no mode specified
      const relationMode: RelationsMode =
        nestedOpts?.mode ?? opts.relationsMode ?? 'foreignKey';

      // Check if it's a ModelCollection (hasMany)
      const isCollection =
        relatedData !== null &&
        typeof relatedData === 'object' &&
        'models' in relatedData;

      // Handle null relationships (belongsTo with no related model)
      if (relatedData === null) {
        if (
          relationMode === 'embedded' ||
          relationMode === 'embedded+foreignKey'
        ) {
          // Embed mode: set relationship to null
          // Foreign key removal is handled in _serializeData based on collection-level relationsMode
          embedded[relName] = null;
        } else if (
          relationMode === 'sideLoaded' ||
          relationMode === 'sideLoaded+foreignKey'
        ) {
          // Side-load mode: set relationship to empty array using collectionName
          const relationships = model.relationships as
            | Record<string, unknown>
            | undefined;
          const relationship = relationships?.[relName] as
            | { collectionName?: string }
            | undefined;
          const collectionName = relationship?.collectionName || relName;
          sideLoaded[collectionName] = [];
        }
        continue;
      }

      if (
        relationMode === 'embedded' ||
        relationMode === 'embedded+foreignKey'
      ) {
        // Embed mode:
        // - Embed relationships directly in the result
        // - Foreign key removal is handled in _serializeData based on collection-level relationsMode
        if (isCollection) {
          // HasMany: embed array of models
          const collection = relatedData as {
            models: Array<{ attrs: Record<string, unknown> }>;
          };
          embedded[relName] = collection.models.map((relModel) => {
            return this._serializeRelatedModel(relModel, nestedOpts);
          });
        } else {
          // BelongsTo: embed single model
          const relModel = relatedData as { attrs: Record<string, unknown> };
          embedded[relName] = this._serializeRelatedModel(relModel, nestedOpts);
        }
      } else if (
        relationMode === 'sideLoaded' ||
        relationMode === 'sideLoaded+foreignKey'
      ) {
        // Side-load mode:
        // - Add relationships as arrays (even belongsTo) at the same level
        // - Use collectionName from relationship definition for all relationship names
        // - Foreign keys remain in attributes (not tracked for removal)
        if (isCollection) {
          // HasMany: side-load array of models using collectionName
          const relationships = model.relationships as
            | Record<string, unknown>
            | undefined;
          const relationship = relationships?.[relName] as
            | { collectionName?: string }
            | undefined;
          const collectionName = relationship?.collectionName || relName;
          const collection = relatedData as {
            models: Array<{ attrs: Record<string, unknown> }>;
          };
          sideLoaded[collectionName] = collection.models.map((relModel) => {
            return this._serializeRelatedModel(relModel, nestedOpts);
          });
        } else {
          // BelongsTo: side-load as array using collectionName from relationship
          const relationships = model.relationships as
            | Record<string, unknown>
            | undefined;
          const relationship = relationships?.[relName] as
            | { collectionName?: string }
            | undefined;
          const collectionName = relationship?.collectionName || relName;
          const relModel = relatedData as { attrs: Record<string, unknown> };
          sideLoaded[collectionName] = [
            this._serializeRelatedModel(relModel, nestedOpts),
          ];
        }
      }
      // else: foreignKey mode - do nothing here
      // The foreign key is kept in attributes, filtering is handled in _serializeData
    }

    return { embedded, sideLoaded };
  }

  /**
   * Serialize a related model with nested options
   * Uses relModel.serializer.serializeAttrs() if available (respects related model's select config),
   * otherwise falls back to copying attrs directly.
   * Applies parent's select override if provided.
   * @param relModel - The related model to serialize
   * @param relModel.attrs - The model's attributes
   * @param relModel.serializer - Optional serializer instance for Layer 1 serialization
   * @param nestedOpts - Nested serializer options from parent
   * @returns Serialized related model data
   */
  private _serializeRelatedModel(
    relModel: {
      attrs: Record<string, unknown>;
      serializer?: Serializer<ModelTemplate, SchemaCollections>;
    },
    nestedOpts?: NestedSerializerOptions<ModelTemplate>,
  ): Record<string, unknown> {
    // Use serializer.serializeAttrs if available (Layer 1 - respects related model's select config)
    // Otherwise fall back to copying attrs directly
    let attrs = relModel.serializer
      ? relModel.serializer.serializeAttrs(
          relModel as ModelInstance<ModelTemplate, SchemaCollections>,
        )
      : { ...relModel.attrs };

    // Apply parent's select override if present
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
              typeof nestedRelData === 'object' &&
              'models' in (nestedRelData as object);
            if (isNestedCollection) {
              const collection = nestedRelData as {
                models: Array<{
                  attrs: Record<string, unknown>;
                  serializer?: Serializer<ModelTemplate, SchemaCollections>;
                }>;
              };
              // Use serializer.serializeAttrs for nested models if available
              attrs[nestedRelName] = collection.models.map((m) =>
                m.serializer
                  ? m.serializer.serializeAttrs(
                      m as ModelInstance<ModelTemplate, SchemaCollections>,
                    )
                  : { ...m.attrs },
              );
            } else {
              const model = nestedRelData as {
                attrs: Record<string, unknown>;
                serializer?: Serializer<ModelTemplate, SchemaCollections>;
              };
              // Use serializer.serializeAttrs for nested model if available
              attrs[nestedRelName] = model.serializer
                ? model.serializer.serializeAttrs(
                    model as ModelInstance<ModelTemplate, SchemaCollections>,
                  )
                : { ...model.attrs };
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
      const excludeKeys = entries
        .filter(([, value]) => value === false)
        .map(([key]) => key);
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
    const includeKeys = entries
      .filter(([, value]) => value === true)
      .map(([key]) => key);
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
    const relationships = model.relationships as
      | Record<string, unknown>
      | undefined;

    if (!relationships) {
      return result;
    }

    // Remove foreign keys based on relationship definitions
    for (const relName in relationships) {
      const relationship = relationships[relName] as {
        type: string;
        foreignKey: string;
      };
      if (
        relationship.type === 'hasMany' ||
        relationship.type === 'belongsTo'
      ) {
        // Remove foreign key using configured foreignKey from relationship definition
        delete result[relationship.foreignKey];
      }
    }

    return result;
  }
}
