import { Relationships } from '@src/associations';
import type { DbCollection } from '@src/db';
import type { SchemaCollections } from '@src/schema';
import { Serializer } from '@src/serializer';

import BaseModel from './BaseModel';
import RelationshipsManager from './RelationshipsManager';
import { isModelCollection, isModelInstance, isModelInstanceArray } from './typeGuards';
import type {
  SerializedCollectionFor,
  SerializedModelFor,
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
  RelatedModelAttrs,
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
  Serializer<TTemplate, SerializedModelFor<TTemplate>, SerializedCollectionFor<TTemplate>>
> {
  public readonly relationships?: RelationshipsByTemplate<TTemplate, TSchema>;
  protected _relationshipsManager?: RelationshipsManager<TTemplate, TSchema>;

  constructor(
    template: TTemplate,
    config: ModelConfig<TTemplate, TSchema, RelationshipsByTemplate<TTemplate, TSchema>>,
  ) {
    const { attrs, relationships, serializer, schema } = config;

    const dbCollection = schema.db.getCollection(
      template.collectionName,
    ) as unknown as DbCollection<ModelAttrs<TTemplate, TSchema>>;

    // Process attributes to separate relationship model instances from regular attributes
    const { modelAttrs, relationshipUpdates } = Model.processAttrs<TTemplate, TSchema>(
      attrs,
      relationships,
    );

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

      // Set pending relationship updates only if the model is new (not already in the database)
      if (this._status === 'new' && Object.keys(relationshipUpdates).length > 0) {
        this._relationshipsManager.setPendingRelationshipUpdates(relationshipUpdates);
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
        config: ModelConfig<TTemplate, TSchema, RelationshipsByTemplate<TTemplate, TSchema>>,
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
  static processAttrs<
    TTemplate extends ModelTemplate,
    TSchema extends SchemaCollections,
    TRelationships extends ModelRelationships = RelationshipsByTemplate<TTemplate, TSchema>,
  >(
    attrs:
      | ModelCreateAttrs<TTemplate, TSchema, TRelationships>
      | ModelUpdateAttrs<TTemplate, TSchema, TRelationships>
      | Partial<ModelCreateAttrs<TTemplate, TSchema, TRelationships>>
      | Record<string, unknown>,
    relationships?: TRelationships,
  ): {
    modelAttrs:
      | NewModelAttrs<ModelAttrs<TTemplate, TSchema>>
      | Partial<ModelAttrs<TTemplate, TSchema>>;
    relationshipUpdates: Partial<RelatedModelAttrs<TSchema, TRelationships>>;
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

    // Step 1: Separate regular attributes, relationship values, and extracted foreign keys
    // (default FK values are also initialized here)
    const { regularAttrs, relationshipValues, foreignKeys } = Model._separateAttrs<
      TTemplate,
      TSchema,
      TRelationships
    >(attrs as Record<string, unknown>, relationships);

    // Step 2: Combine foreign keys (defaults) with regular attributes
    // regularAttrs comes second to allow explicit FK values to override defaults
    const modelAttrs = { ...foreignKeys, ...regularAttrs };

    return {
      modelAttrs: modelAttrs as
        | NewModelAttrs<ModelAttrs<TTemplate, TSchema>>
        | Partial<ModelAttrs<TTemplate, TSchema>>,
      relationshipUpdates: relationshipValues as Partial<
        RelatedModelAttrs<TSchema, TRelationships>
      >,
    };
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
  update(attrs: ModelUpdateAttrs<TTemplate, TSchema>): this & ModelInstance<TTemplate, TSchema> {
    // Process attributes to separate relationship model instances from regular attributes
    const { modelAttrs, relationshipUpdates } = Model.processAttrs<TTemplate, TSchema>(
      attrs,
      this.relationships,
    );

    // Set pending relationship updates (handles both model instances and FK values)
    if (this._relationshipsManager && Object.keys(relationshipUpdates).length > 0) {
      this._relationshipsManager.setPendingRelationshipUpdates(relationshipUpdates);
    }

    const model = super.update(modelAttrs as Partial<ModelAttrs<TTemplate, TSchema>>) as this &
      ModelInstance<TTemplate, TSchema>;

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
  related<K extends RelationshipNames<RelationshipsByTemplate<TTemplate, TSchema>>>(
    relationshipName: K,
  ): RelationshipTargetModel<TSchema, RelationshipsByTemplate<TTemplate, TSchema>, K> | null {
    return this._relationshipsManager?.related(relationshipName) ?? null;
  }

  /**
   * Link this model to another model via a relationship
   * @param relationshipName - The name of the relationship
   * @param targetModel - The model to link to (or null to unlink)
   * @returns This model instance for chaining
   */
  link<K extends RelationshipNames<RelationshipsByTemplate<TTemplate, TSchema>>>(
    relationshipName: K,
    targetModel: RelationshipTargetModel<TSchema, RelationshipsByTemplate<TTemplate, TSchema>, K>,
  ): this & ModelInstance<TTemplate, TSchema> {
    if (this._relationshipsManager) {
      // Get FK updates from manager (which also handles inverse relationships)
      const result = this._relationshipsManager.link(relationshipName, targetModel);

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
  unlink<K extends RelationshipNames<RelationshipsByTemplate<TTemplate, TSchema>>>(
    relationshipName: K,
    targetModel?: RelationshipTargetModel<TSchema, RelationshipsByTemplate<TTemplate, TSchema>, K>,
  ): this & ModelInstance<TTemplate, TSchema> {
    if (this._relationshipsManager) {
      // Get FK updates from manager (which also handles inverse relationships)
      const result = this._relationshipsManager.unlink(relationshipName, targetModel);

      // Apply FK updates to this model's attributes
      Object.assign(this._attrs, result.foreignKeyUpdates);

      // Save if this model was already saved
      if (this.isSaved()) {
        this.save();
      }
    }
    return this as this & ModelInstance<TTemplate, TSchema>;
  }

  // -- ATTRIBUTES PROCESSING METHODS --

  /**
   * Extract foreign key value from a relationship value
   * @param relationship - The relationship configuration
   * @param value - The value to extract the foreign key from
   * @returns The foreign key value
   */
  private static _extractForeignKey<TSchema extends SchemaCollections>(
    relationship: Relationships,
    value: unknown,
  ): string | string[] | null {
    const { type } = relationship;

    if (type === 'belongsTo') {
      if (isModelInstance<TSchema>(value)) {
        return value.id as string;
      }
      return null;
    }

    if (type === 'hasMany') {
      if (isModelInstanceArray<TSchema>(value)) {
        return value.map((model) => model.id as string);
      }
      if (isModelCollection<TSchema>(value)) {
        return value.models.map((model) => model.id as string);
      }
      return [];
    }

    return null;
  }

  /**
   * Separate attributes into model attributes and relationship updates
   * Extracts foreign keys from relationship model instances and initializes default values
   * @param attrs - The attributes to separate
   * @param relationships - The relationships configuration
   * @returns Object containing:
   *   - regularAttrs: Regular attributes (may include explicit FK values)
   *   - relationshipValues: Relationship values
   *   - foreignKeys: Foreign keys (extracted from relationship models or defaults)
   */
  private static _separateAttrs<
    _TTemplate extends ModelTemplate,
    TSchema extends SchemaCollections,
    TRelationships extends ModelRelationships,
  >(
    attrs: Record<string, unknown>,
    relationships: TRelationships,
  ): {
    regularAttrs: Record<string, unknown>;
    relationshipValues: Record<string, unknown>;
    foreignKeys: Record<string, string | string[] | null>;
  } {
    const regularAttrs: Record<string, unknown> = {};
    const relationshipValues: Record<string, unknown> = {};
    const foreignKeys: Record<string, string | string[] | null> = {};

    // Step 1: Initialize all foreign keys with default values
    for (const relationshipName in relationships) {
      const relationship = relationships[relationshipName];
      const { type, foreignKey } = relationship;
      foreignKeys[foreignKey] = type === 'belongsTo' ? null : [];
    }

    // Step 2: Process attributes
    for (const key in attrs) {
      const value = attrs[key];
      if (key in relationships) {
        // Relationship attribute (model instance)
        const relationship = relationships[key];
        relationshipValues[key] = value;

        // Extract FK from relationship model (overrides default if present)
        const foreignKeyValue = Model._extractForeignKey<TSchema>(relationship, value);
        if (foreignKeyValue !== null) {
          foreignKeys[relationship.foreignKey] = foreignKeyValue;
        }
      } else {
        // Check if this is a foreign key attribute
        let isForeignKey = false;
        for (const relationshipName in relationships) {
          const relationship = relationships[relationshipName];
          if (relationship.foreignKey === key) {
            isForeignKey = true;
            foreignKeys[key] = value as string | string[] | null;
            // Add FK value to relationshipValues so it's processed by setPendingRelationshipUpdates
            relationshipValues[relationshipName] = value;
            break;
          }
        }

        if (!isForeignKey) {
          // Regular attribute
          regularAttrs[key] = value;
        }
      }
    }

    return { regularAttrs, relationshipValues, foreignKeys };
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
      const relationshipDef = this._relationshipsManager.relationshipDefs[relationshipName];
      const { foreignKey, type } = relationshipDef.relationship as Relationships;

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
