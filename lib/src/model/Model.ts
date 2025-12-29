import { Relationships } from '@src/associations';
import type { DbCollection } from '@src/db';
import type { SchemaCollections } from '@src/schema';
import { Serializer } from '@src/serializer';
import type { SerializerOptions } from '@src/serializer';

import BaseModel from './BaseModel';
import RelationshipsManager from './RelationshipsManager';
import {
  isModelCollection,
  isModelInstance,
  isModelInstanceArray,
} from './typeGuards';
import type {
  SerializedCollectionFor,
  SerializedModelFor,
  ForeignKeyValue,
  ModelAttrs,
  ModelClass,
  ModelConfig,
  ModelCreateAttrs,
  ModelInstance,
  ModelRelationships,
  ModelTemplate,
  ModelUpdateAttrs,
  NewModelAttrs,
  NewModelInstance,
  RelationshipNames,
  RelationshipTargetModel,
  RelationshipsByTemplate,
} from './types';

/**
 * Model class for managing model instances with relationships
 * @template TTemplate - The model template (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 */
export default class Model<
  TTemplate extends ModelTemplate = ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> extends BaseModel<
  ModelAttrs<TTemplate, TSchema>,
  SerializedModelFor<TTemplate>
> {
  public readonly relationships?: RelationshipsByTemplate<TTemplate, TSchema>;
  protected _relationshipsManager?: RelationshipsManager<TTemplate, TSchema>;
  declare protected _serializer?: Serializer<
    TTemplate,
    TSchema,
    SerializedModelFor<TTemplate>,
    SerializedCollectionFor<TTemplate>
  >;

  constructor(
    template: TTemplate,
    config: ModelConfig<
      TTemplate,
      TSchema,
      RelationshipsByTemplate<TTemplate, TSchema>
    >,
  ) {
    const { attrs, relationships, serializer, schema } = config;

    const dbCollection = schema.db.getCollection(
      template.collectionName,
    ) as unknown as DbCollection<ModelAttrs<TTemplate, TSchema>>;

    // Process attributes to separate relationship values from regular attributes
    const { modelAttrs, relationshipUpdates } = Model.processAttrs<
      TTemplate,
      TSchema
    >(attrs, relationships, true);

    // Initialize BaseModel with regular attributes, db collection, and serializer
    super(
      template.modelName,
      template.collectionName,
      modelAttrs as NewModelAttrs<ModelAttrs<TTemplate, TSchema>>,
      dbCollection,
      serializer,
    );

    this.relationships = relationships;
    if (schema && relationships) {
      // Cast to base Model type since RelationshipsManager doesn't need serializer type info
      this._relationshipsManager = new RelationshipsManager(
        this as unknown as Model<TTemplate, TSchema>,
        schema,
        relationships,
      );

      if (
        this._status === 'new' &&
        Object.keys(relationshipUpdates).length > 0
      ) {
        this._relationshipsManager.setPendingRelationshipUpdates(
          relationshipUpdates,
        );
      }

      this._initAttributeAccessors();
      this._initForeignKeys();
      this._initRelationshipAccessors();
    } else {
      this._initAttributeAccessors();
    }
  }

  /**
   * Define a model class with attribute accessors
   * @template TTemplate - The model template (most important for users)
   * @template TSchema - The schema collections type for enhanced type inference
   * @param template - The model template to define
   * @returns A model class that can be instantiated with 'new'
   */
  static define<
    TTemplate extends ModelTemplate,
    TSchema extends SchemaCollections = SchemaCollections,
  >(template: TTemplate): ModelClass<TTemplate, TSchema> {
    return class extends Model<TTemplate, TSchema> {
      constructor(
        config: ModelConfig<
          TTemplate,
          TSchema,
          RelationshipsByTemplate<TTemplate, TSchema>
        >,
      ) {
        super(template, config);
      }
    } as unknown as ModelClass<TTemplate, TSchema>;
  }

  /**
   * Process constructor/update attributes before model initialization
   * Separates relationship model instances from regular attributes and extracts foreign keys
   * @param attrs - The attributes to process (can include both regular attrs and relationship instances)
   * @param relationships - The relationships configuration (optional)
   * @param includeDefaults - Whether to include default FK values (null for belongsTo, [] for hasMany). Default: false
   * @returns Object containing:
   *   - modelAttrs: Regular attributes and foreign keys ready for the database
   *   - relationshipUpdates: Relationship model instances to be linked after save
   * @example
   * // Input: { title: 'Post', author: authorModelInstance }
   * // Output: {
   * //   modelAttrs: { title: 'Post', authorId: '1' },
   * //   relationshipUpdates: { author: authorModelInstance }
   * // }
   */
  /**
   * Process attributes to separate model attributes from relationship updates
   * Extracts foreign keys from relationship model instances and initializes default values
   * @param attrs - The attributes to process
   * @param relationships - The relationships configuration
   * @param includeDefaults - Whether to include default FK values (null for belongsTo, [] for hasMany)
   * @returns Object with modelAttrs (including FKs) and relationshipUpdates (for inverse sync)
   */
  static processAttrs<
    TTemplate extends ModelTemplate,
    TSchema extends SchemaCollections,
    TRelationships extends ModelRelationships = RelationshipsByTemplate<
      TTemplate,
      TSchema
    >,
  >(
    attrs:
      | ModelCreateAttrs<TTemplate, TSchema, TRelationships>
      | ModelUpdateAttrs<TTemplate, TSchema, TRelationships>
      | Partial<ModelCreateAttrs<TTemplate, TSchema, TRelationships>>
      | Record<string, unknown>,
    relationships?: TRelationships,
    includeDefaults: boolean = false,
  ): {
    modelAttrs:
      | NewModelAttrs<ModelAttrs<TTemplate, TSchema>>
      | Partial<ModelAttrs<TTemplate, TSchema>>;
    relationshipUpdates: Record<string, ForeignKeyValue>; // { relationshipName: foreignKeyValue }
  } {
    // Early return if no relationships are defined
    if (!relationships) {
      return {
        modelAttrs: attrs as
          | NewModelAttrs<ModelAttrs<TTemplate, TSchema>>
          | Partial<ModelAttrs<TTemplate, TSchema>>,
        relationshipUpdates: {},
      };
    }

    const modelAttrs: Record<string, unknown> = {};
    const relationshipUpdates: Record<string, ForeignKeyValue> = {};
    const attrsRecord = attrs as Record<string, unknown>;

    // Step 1: Initialize all foreign keys with default values (only if includeDefaults is true)
    if (includeDefaults) {
      for (const relationshipName in relationships) {
        const relationship = relationships[relationshipName];
        const { type, foreignKey } = relationship;
        modelAttrs[foreignKey] = type === 'belongsTo' ? null : [];
      }
    }

    // Step 2: Process attributes
    for (const key in attrsRecord) {
      const value = attrsRecord[key];

      if (key in relationships) {
        // Relationship attribute - extract FK value (from model instance or direct value)
        const relationship = relationships[key];

        // Check if this is null or empty array (valid for unsetting relationships)
        const isNullOrEmpty =
          value === null || (Array.isArray(value) && value.length === 0);

        if (isNullOrEmpty) {
          // null or [] - store as-is
          modelAttrs[relationship.foreignKey] = value;
          relationshipUpdates[key] = value as ForeignKeyValue;
        } else {
          // Model instance or collection - extract FK value
          const foreignKeyValue = Model.extractForeignKey(relationship, value);
          if (foreignKeyValue !== null) {
            modelAttrs[relationship.foreignKey] = foreignKeyValue;
            relationshipUpdates[key] = foreignKeyValue;
          }
        }
      } else {
        // Check if this is a foreign key attribute
        let isForeignKey = false;
        for (const relationshipName in relationships) {
          const relationship = relationships[relationshipName];
          if (relationship.foreignKey === key) {
            isForeignKey = true;
            modelAttrs[key] = value;
            // Store with relationship name as key for inverse updates
            relationshipUpdates[relationshipName] = value as ForeignKeyValue;
            break;
          }
        }

        if (!isForeignKey) {
          // Regular attribute
          modelAttrs[key] = value;
        }
      }
    }

    return {
      modelAttrs: modelAttrs as
        | NewModelAttrs<ModelAttrs<TTemplate, TSchema>>
        | Partial<ModelAttrs<TTemplate, TSchema>>,
      relationshipUpdates,
    };
  }

  /**
   * Extract foreign key value from a relationship value
   * @param relationship - The relationship configuration
   * @param value - The value to extract the foreign key from
   * @returns The foreign key value
   */
  private static extractForeignKey(
    relationship: Relationships,
    value: unknown,
  ): string | string[] | null {
    const { type } = relationship;

    if (type === 'belongsTo') {
      if (isModelInstance(value)) {
        return value.id;
      }
      return null;
    }

    if (type === 'hasMany') {
      if (isModelInstanceArray(value)) {
        return value.map((model) => model.id);
      }
      if (isModelCollection(value)) {
        return value.models.map((model) => model.id);
      }
      return [];
    }

    return null;
  }

  // -- CRUD METHODS --

  /**
   * Save the model to the database and apply pending relationship updates
   * @returns The model with saved instance type
   */
  save(): this & ModelInstance<TTemplate, TSchema> {
    // Save the model (FK changes are in _attrs from processAttrs or link/unlink)
    super.save();

    // Update inverse relationships on other models (now that this model is saved)
    if (this._relationshipsManager) {
      this._relationshipsManager.applyPendingInverseUpdates();
    }

    return this as this & ModelInstance<TTemplate, TSchema>;
  }

  /**
   * Update the model attributes and save the model
   * @param attrs - The attributes to update
   * @returns The model with saved instance type
   */
  update(
    attrs: ModelUpdateAttrs<TTemplate, TSchema>,
  ): this & ModelInstance<TTemplate, TSchema> {
    // Process attributes to separate relationship values from regular attributes
    const { modelAttrs, relationshipUpdates } = Model.processAttrs<
      TTemplate,
      TSchema
    >(attrs, this.relationships);

    // Set pending relationship updates
    if (
      this._relationshipsManager &&
      Object.keys(relationshipUpdates).length > 0
    ) {
      this._relationshipsManager.setPendingRelationshipUpdates(
        relationshipUpdates,
      );
    }

    const model = super.update(
      modelAttrs as Partial<ModelAttrs<TTemplate, TSchema>>,
    ) as this & ModelInstance<TTemplate, TSchema>;

    this._initAttributeAccessors();

    return model;
  }

  /**
   * Reload the model from the database
   * @returns The model with saved instance type
   */
  reload(): this & ModelInstance<TTemplate, TSchema> {
    return super.reload() as this & ModelInstance<TTemplate, TSchema>;
  }

  /**
   * Destroy the model from the database
   * @returns The model with new instance type
   */
  destroy(): this & NewModelInstance<TTemplate, TSchema> {
    return super.destroy() as this & NewModelInstance<TTemplate, TSchema>;
  }

  // -- RELATIONSHIP METHODS --

  /**
   * Get related model(s) for a relationship with proper typing
   * @param relationshipName - The relationship name
   * @returns The related model(s) or null/empty collection
   */
  related<
    K extends RelationshipNames<RelationshipsByTemplate<TTemplate, TSchema>>,
  >(
    relationshipName: K,
  ): RelationshipTargetModel<
    TSchema,
    RelationshipsByTemplate<TTemplate, TSchema>,
    K
  > | null {
    return this._relationshipsManager?.related(relationshipName) ?? null;
  }

  /**
   * Link this model to another model via a relationship
   * @param relationshipName - The name of the relationship
   * @param targetModel - The model to link to (or null to unlink)
   * @returns This model instance for chaining
   */
  link<
    K extends RelationshipNames<RelationshipsByTemplate<TTemplate, TSchema>>,
  >(
    relationshipName: K,
    targetModel: RelationshipTargetModel<
      TSchema,
      RelationshipsByTemplate<TTemplate, TSchema>,
      K
    >,
  ): this & ModelInstance<TTemplate, TSchema> {
    if (this._relationshipsManager) {
      // Get FK updates from manager (which also handles inverse relationships)
      const result = this._relationshipsManager.link(
        relationshipName,
        targetModel,
      );

      // Apply FK updates to this model's attributes
      Object.assign(this._attrs, result.foreignKeyUpdates);

      // Save if this model was already saved
      if (this.isSaved()) {
        this.save();
      }
    }
    return this as this & ModelInstance<TTemplate, TSchema>;
  }

  /**
   * Unlink this model from another model via a relationship
   * @param relationshipName - The name of the relationship
   * @param targetModel - The specific model to unlink (optional for hasMany, unlinks all if not provided)
   * @returns This model instance for chaining
   */
  unlink<
    K extends RelationshipNames<RelationshipsByTemplate<TTemplate, TSchema>>,
  >(
    relationshipName: K,
    targetModel?: RelationshipTargetModel<
      TSchema,
      RelationshipsByTemplate<TTemplate, TSchema>,
      K
    >,
  ): this & ModelInstance<TTemplate, TSchema> {
    if (this._relationshipsManager) {
      // Get FK updates from manager (which also handles inverse relationships)
      const result = this._relationshipsManager.unlink(
        relationshipName,
        targetModel,
      );

      // Apply FK updates to this model's attributes
      Object.assign(this._attrs, result.foreignKeyUpdates);

      // Save if this model was already saved
      if (this.isSaved()) {
        this.save();
      }
    }
    return this as this & ModelInstance<TTemplate, TSchema>;
  }

  // -- SERIALIZATION --

  /**
   * Serialize the model with optional runtime options
   * @template TSerialized - Custom return type for manual serialization (defaults to model's JSON type)
   * @param options - Optional serializer options to override class-level settings
   * @returns A serialized representation of the model
   */
  serialize<TSerialized = SerializedModelFor<TTemplate>>(
    options?: Partial<SerializerOptions<TTemplate, TSchema>>,
  ): TSerialized {
    if (this._serializer instanceof Serializer) {
      return this._serializer.serialize(
        this as unknown as ModelInstance<TTemplate, TSchema>,
        options,
      ) as TSerialized;
    }
    return { ...this._attrs } as TSerialized;
  }

  // -- ACCESSOR INITIALIZATION METHODS --

  /**
   * Initialize attribute accessors for all attributes except id
   */
  private _initAttributeAccessors(): void {
    // Remove old accessors
    for (const key in this._attrs) {
      if (key !== 'id' && Object.hasOwn(this, key)) {
        delete this[key as keyof this];
      }
    }

    // Set up new accessors
    for (const key in this._attrs) {
      const attrKey = key as keyof typeof this._attrs;
      if (attrKey !== 'id' && !Object.hasOwn(this, attrKey)) {
        Object.defineProperty(this, key, {
          get: () => {
            return this._attrs[attrKey];
          },
          set: (value: any) => {
            this._attrs[attrKey] = value;
          },
          enumerable: false,
          configurable: true,
        });
      }
    }
  }

  /**
   * Initialize foreign key attributes if they don't exist
   */
  private _initForeignKeys(): void {
    if (!this._relationshipsManager?.relationshipDefs) return;

    for (const name in this._relationshipsManager.relationshipDefs) {
      const relationshipName = name as RelationshipNames<
        RelationshipsByTemplate<TTemplate, TSchema>
      >;
      const relationshipDef =
        this._relationshipsManager.relationshipDefs[relationshipName];
      const { foreignKey, type } =
        relationshipDef.relationship as Relationships;

      // Initialize foreign key if it doesn't exist in attrs
      if (!(foreignKey in this._attrs)) {
        if (type === 'belongsTo') {
          (this._attrs as Record<string, unknown>)[foreignKey] = null;
        } else if (type === 'hasMany') {
          (this._attrs as Record<string, unknown>)[foreignKey] = [];
        }
      }
    }
  }

  /**
   * Initialize relationship accessors for all relationships
   */
  private _initRelationshipAccessors(): void {
    if (!this._relationshipsManager?.relationshipDefs) return;

    for (const name in this._relationshipsManager.relationshipDefs) {
      const relationshipName = name as RelationshipNames<
        RelationshipsByTemplate<TTemplate, TSchema>
      >;

      if (!Object.hasOwn(this, relationshipName)) {
        Object.defineProperty(this, relationshipName, {
          get: () => {
            return this.related(relationshipName);
          },
          set: (value: any | any[] | null) => {
            this.link(relationshipName, value);
          },
          enumerable: false,
          configurable: true,
        });
      }
    }
  }
}
