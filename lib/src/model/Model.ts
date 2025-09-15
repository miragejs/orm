import type { Relationships } from '@src/associations';
import { DbCollection, type DbRecordInput } from '@src/db';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

import ModelCollection from './ModelCollection';
import type {
  ModelAttrs,
  ModelClass,
  ModelConfig,
  ModelId,
  ModelInstance,
  ModelTemplate,
  ModelUpdateAttrs,
  NewModelAttrs,
  NewModelInstance,
  RelationshipDef,
  RelationshipDefs,
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
> {
  public readonly modelName: string;
  public readonly collectionName: string;

  protected _attrs: NewModelAttrs<TTemplate>;
  protected _dbCollection: DbCollection<ModelAttrs<TTemplate>>;
  protected _relationshipDefs?: RelationshipDefs;
  protected _schema?: SchemaInstance<TSchema>;
  protected _status: 'new' | 'saved';

  constructor(
    template: TTemplate,
    { attrs, dbCollection, relationships, schema }: ModelConfig<TTemplate, TSchema>,
  ) {
    this.modelName = template.modelName;
    this.collectionName = template.collectionName;

    // Merge template attrs with provided attrs, with provided attrs taking precedence
    const mergedAttrs = { ...template.attrs, ...attrs };
    this._attrs = { ...mergedAttrs, id: attrs?.id ?? null } as NewModelAttrs<TTemplate>;
    this._dbCollection =
      dbCollection ?? new DbCollection<ModelAttrs<TTemplate>>(template.collectionName);
    this._schema = schema;
    this._status = this._attrs.id ? this._verifyStatus(this._attrs.id) : 'new';
    this._relationshipDefs = this._parseRelationshipDefs(relationships);

    this._initForeignKeys();
    this._initAttributeAccessors();
    this._initRelationshipAccessors();
  }

  // -- GETTERS --

  /**
   * Getter for the protected id attribute
   * @returns The id of the model
   */
  get id(): ModelAttrs<TTemplate>['id'] | null {
    return this._attrs.id;
  }

  /**
   * Getter for the model attributes
   * @returns A copy of the model attributes
   */
  get attrs(): NewModelAttrs<TTemplate> {
    return { ...this._attrs };
  }

  // -- MUTATIONS --

  /**
   * Destroy the model from the database
   * @returns The model with new instance type
   */
  destroy(): NewModelInstance<TTemplate, TSchema> {
    if (this.isSaved() && this.id) {
      this._dbCollection.delete(this.id as ModelAttrs<TTemplate>['id']);
      this._attrs = { ...this._attrs, id: null } as NewModelAttrs<TTemplate>;
      this._status = 'new';
    }

    return this as unknown as NewModelInstance<TTemplate, TSchema>;
  }

  /**
   * Reload the model from the database
   * @returns The model with saved instance type
   */
  reload(): ModelInstance<TTemplate, TSchema> {
    if (this.isSaved() && this.id) {
      const record = this._dbCollection.find(this.id as ModelAttrs<TTemplate>['id']);

      if (record) {
        this._attrs = { ...record } as NewModelAttrs<TTemplate>;
        this._initAttributeAccessors();
      }
    }

    return this as unknown as ModelInstance<TTemplate, TSchema>;
  }

  /**
   * Save the model to the database
   * @returns The model with saved instance type
   */
  save(): ModelInstance<TTemplate, TSchema> {
    if (this.isNew() || !this.id) {
      const record = this._dbCollection.insert(this._attrs as DbRecordInput<ModelAttrs<TTemplate>>);

      this._attrs = { ...record } as NewModelAttrs<TTemplate>;
      this._status = 'saved';
    } else {
      this._dbCollection.update(
        this.id as ModelAttrs<TTemplate>['id'],
        this._attrs as DbRecordInput<ModelAttrs<TTemplate>>,
      );
    }

    return this as unknown as ModelInstance<TTemplate, TSchema>;
  }

  /**
   * Update the model attributes and save the model
   * @param attrs - The attributes to update (includes both regular attributes and relationship model instances)
   * @returns The model with saved instance type
   */
  update(attrs: ModelUpdateAttrs<TTemplate, TSchema>): ModelInstance<TTemplate, TSchema> {
    const regularAttrs: any = {};

    // Process each attribute being updated
    for (const [key, value] of Object.entries(attrs)) {
      if (this._isRelationshipAttribute(key)) {
        // Handle relationship updates (e.g., user.update({ posts: [post1, post2] }))
        this._updateRelationship(key, value);
      } else if (this._isForeignKey(key)) {
        // Handle foreign key updates (e.g., user.update({ postIds: ['1', '2'] }))
        this._updateForeignKey(key, value);
      } else {
        // Regular attribute updates
        regularAttrs[key] = value;
      }
    }

    // Apply regular attribute updates
    Object.assign(this._attrs, regularAttrs);
    return this.save();
  }

  // -- STATUS CHECKS --

  /**
   * Check if the model is new
   * @returns True if the model is new, false otherwise
   */
  isNew(): boolean {
    return this._status === 'new';
  }

  /**
   * Check if the model is saved
   * @returns True if the model is saved, false otherwise
   */
  isSaved(): boolean {
    return this._status === 'saved';
  }

  // -- SERIALIZATION --

  /**
   * Serialize the model to a JSON object
   * @returns The serialized model using the configured serializer or raw attributes
   */
  toJSON(): ModelAttrs<TTemplate> {
    return { ...this._attrs } as ModelAttrs<TTemplate>;
  }

  /**
   * Serialize the model to a string
   * @returns The simple string representation of the model and its id
   */
  toString(): string {
    let idLabel = this.id ? `(${this.id})` : '';
    return `model:${this.modelName}${idLabel}`;
  }

  // --  ACCESSORS --

  /**
   * Initialize attribute accessors for all attributes except id
   */
  private _initAttributeAccessors(): void {
    // Remove old accessors
    for (const key in this._attrs) {
      if (key !== 'id' && Object.prototype.hasOwnProperty.call(this, key)) {
        delete this[key as keyof this];
      }
    }

    // Set up new accessors
    for (const key in this._attrs) {
      if (key !== 'id' && !Object.prototype.hasOwnProperty.call(this, key)) {
        const isForeignKey = this._isForeignKey(key);

        Object.defineProperty(this, key, {
          get: () => {
            return this._attrs[key as keyof NewModelAttrs<TTemplate>];
          },
          set: (value: NewModelAttrs<TTemplate>[keyof NewModelAttrs<TTemplate>]) => {
            if (isForeignKey) {
              this._handleForeignKeyChange(key, value);
            } else {
              this._attrs[key as keyof NewModelAttrs<TTemplate>] = value;
            }
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  /**
   * Initialize foreign key attributes if they don't exist
   */
  private _initForeignKeys(): void {
    if (!this._relationshipDefs) return;

    for (const relationshipName in this._relationshipDefs) {
      const relationshipDef = this._relationshipDefs[relationshipName];
      const { foreignKey, type } = relationshipDef.relationship;

      // Initialize foreign key if it doesn't exist in attrs
      if (!(foreignKey in this._attrs)) {
        if (type === 'belongsTo') {
          this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] = null as any;
        } else if (type === 'hasMany') {
          this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] = [] as any;
        }
      }
    }
  }

  /**
   * Initialize relationship accessors for all relationships
   */
  private _initRelationshipAccessors(): void {
    if (!this._relationshipDefs) return;

    for (const relationshipName in this._relationshipDefs) {
      if (!Object.prototype.hasOwnProperty.call(this, relationshipName)) {
        Object.defineProperty(this, relationshipName, {
          get: () => {
            return this._getRelatedModel(relationshipName);
          },
          set: (value: any | any[] | null) => {
            this.link(relationshipName as keyof RelationshipsByTemplate<TSchema, TTemplate>, value);
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  /**
   * Parse relationships configuration into internal relationship definitions
   * This includes finding inverse relationships for bidirectional updates
   * @param relationships - The relationships configuration from schema
   * @returns Parsed relationship definitions with inverse information
   */
  private _parseRelationshipDefs(
    relationships?: RelationshipsByTemplate<TSchema, TTemplate>,
  ): RelationshipDefs | undefined {
    if (!relationships || !this._schema) return undefined;

    const relationshipDefs: RelationshipDefs = {};

    // Parse each relationship and find its inverse
    for (const relationshipName in relationships) {
      const relationship = relationships[relationshipName];
      const relationshipDef: RelationshipDef = {
        relationship,
      };

      // Look for inverse relationship in the target model's collection
      const targetCollectionName = relationship.targetModel.collectionName;
      const targetCollection = this._schema.getCollection(targetCollectionName);

      if (targetCollection.relationships) {
        for (const inverseRelationshipName in targetCollection.relationships) {
          const inverseRelationship = targetCollection.relationships[inverseRelationshipName];
          if (inverseRelationship.targetModel.modelName === this.modelName) {
            relationshipDef.inverse = {
              targetModel: relationship.targetModel,
              relationshipName: inverseRelationshipName,
              type: inverseRelationship.type,
              foreignKey: inverseRelationship.foreignKey,
            };
            break;
          }
        }
      }

      relationshipDefs[relationshipName] = relationshipDef;
    }

    return relationshipDefs;
  }

  // -- RELATIONSHIP MANAGEMENT --

  /**
   * Link this model to another model via a relationship
   * @param relationshipName - The name of the relationship
   * @param targetModel - The model to link to (or null to unlink)
   * @returns This model instance for chaining
   */
  link<K extends RelationshipNames<RelationshipsByTemplate<TSchema, TTemplate>>>(
    relationshipName: K,
    targetModel: RelationshipTargetModel<TSchema, RelationshipsByTemplate<TSchema, TTemplate>, K>,
  ): this {
    if (!this._relationshipDefs || !this._schema) return this;

    const relationshipDef = this._relationshipDefs?.[relationshipName as string];
    if (!relationshipDef) return this;
    const relationship = relationshipDef.relationship;

    const { type } = relationship;

    if (type === 'belongsTo') {
      // For belongsTo, unlink previous and link new
      this._unlinkBelongsTo(relationship);

      if (targetModel && !Array.isArray(targetModel)) {
        this._linkBelongsTo(relationship, targetModel);
        this._updateInverseRelationship(relationshipName as string, targetModel, 'link');
      }
    } else if (type === 'hasMany') {
      // For hasMany, unlink all previous and link all new
      this._unlinkHasMany(relationship);

      if (targetModel && Array.isArray(targetModel)) {
        this._linkHasMany(relationship, targetModel);
        // Update inverse relationships for all target models
        targetModel.forEach((model) => {
          this._updateInverseRelationship(relationshipName as string, model, 'link');
        });
      }
    }

    // Save the model if it was already saved before
    if (this.isSaved()) {
      this.save();
    }

    return this;
  }

  /**
   * Unlink this model from another model via a relationship
   * @param relationshipName - The name of the relationship
   * @param targetModel - The specific model to unlink (optional for hasMany, unlinks all if not provided)
   * @returns This model instance for chaining
   */
  unlink<K extends RelationshipNames<RelationshipsByTemplate<TSchema, TTemplate>>>(
    relationshipName: K,
    targetModel?: RelationshipTargetModel<TSchema, RelationshipsByTemplate<TSchema, TTemplate>, K>,
  ): this {
    if (!this._relationshipDefs || !this._schema) return this;

    const relationshipDef = this._relationshipDefs?.[relationshipName as string];
    if (!relationshipDef) return this;
    const relationship = relationshipDef.relationship;

    const { type } = relationship;

    if (type === 'belongsTo') {
      // Get the current target model before unlinking for inverse update
      const currentTarget = this._getRelatedModel(relationshipName as string);
      this._unlinkBelongsTo(relationship);

      if (currentTarget) {
        this._updateInverseRelationship(relationshipName as string, currentTarget, 'unlink');
      }
    } else if (type === 'hasMany') {
      if (targetModel) {
        this._unlinkHasManyItem(relationship, targetModel);
        this._updateInverseRelationship(relationshipName as string, targetModel, 'unlink');
      } else {
        // Get all current target models before unlinking
        const currentTargets = this._getRelatedModel(relationshipName as string) as any[];
        this._unlinkHasMany(relationship);

        if (currentTargets && Array.isArray(currentTargets)) {
          currentTargets.forEach((target) => {
            this._updateInverseRelationship(relationshipName as string, target, 'unlink');
          });
        }
      }
    }

    // Save the model if it was already saved before
    if (this.isSaved()) {
      this.save();
    }

    return this;
  }

  /**
   * Get related model(s) for a relationship
   * @param relationshipName - The relationship name
   * @returns The related model(s) or null/empty array
   */
  protected _getRelatedModel(relationshipName: string): any | any[] | null {
    if (!this._schema || !this._relationshipDefs) return null;

    const relationshipDef = this._relationshipDefs[relationshipName];
    if (!relationshipDef) return null;
    const relationship = relationshipDef.relationship;
    if (!relationship) return null;

    const { type, foreignKey, targetModel } = relationship;

    // Use symbol-based access for proper type inference
    const targetCollection = (this._schema as any)[targetModel.collectionName];

    if (!targetCollection) {
      console.warn(`Collection for template ${targetModel.modelName} not found in schema`);
      return null;
    }

    if (type === 'belongsTo') {
      const foreignKeyValue = this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>];

      if (foreignKeyValue === null || foreignKeyValue === undefined) {
        return null;
      }

      return targetCollection.find(foreignKeyValue);
    } else if (type === 'hasMany') {
      const foreignKeyValues =
        (this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] as ModelId<TTemplate>[]) || [];

      if (!Array.isArray(foreignKeyValues) || foreignKeyValues.length === 0) {
        return new ModelCollection(targetModel, []);
      }

      const relatedModels = foreignKeyValues
        .map((id: ModelId<TTemplate>) => targetCollection.find(id))
        .filter((model: ModelInstance<any, any> | null) => model !== null);

      return new ModelCollection(targetModel, relatedModels);
    }

    return null;
  }

  /**
   * Handle changes to foreign key attributes
   * @param foreignKey - The foreign key attribute name
   * @param value - The new value for the foreign key
   */
  private _handleForeignKeyChange(
    foreignKey: string,
    value: ModelId<TTemplate> | ModelId<TTemplate>[] | null,
  ): void {
    this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] = value as any;
  }

  /**
   * Link a belongsTo relationship
   * @param relationship - The relationship configuration
   * @param targetModel - The model to link to
   */
  private _linkBelongsTo(relationship: Relationships, targetModel: any): void {
    const { foreignKey } = relationship;
    this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] = targetModel.id as any;
  }

  /**
   * Unlink a belongsTo relationship
   * @param relationship - The relationship configuration
   */
  private _unlinkBelongsTo(relationship: Relationships): void {
    const { foreignKey } = relationship;
    this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] = null as any;
  }

  /**
   * Link a hasMany relationship
   * @param relationship - The relationship configuration
   * @param targetModels - The array of models to link to
   */
  private _linkHasMany(relationship: Relationships, targetModels: any[]): void {
    const { foreignKey } = relationship;
    this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] = targetModels.map(
      (model) => model.id,
    ) as any;
  }

  /**
   * Unlink all hasMany relationships
   * @param relationship - The relationship configuration
   */
  private _unlinkHasMany(relationship: Relationships): void {
    const { foreignKey } = relationship;
    this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] = [] as any;
  }

  /**
   * Unlink a specific item from hasMany relationship
   * @param relationship - The relationship configuration
   * @param targetModel - The specific model to unlink
   */
  private _unlinkHasManyItem(relationship: Relationships, targetModel: any): void {
    const { foreignKey } = relationship;
    const currentIds =
      (this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] as ModelId<TTemplate>[]) || [];
    const newIds = currentIds.filter((id: ModelId<TTemplate>) => id !== targetModel.id);
    this._attrs[foreignKey as keyof NewModelAttrs<TTemplate>] = newIds as any;
  }

  /**
   * Update the inverse relationship on the target model
   * @param relationshipName - The name of the relationship being updated
   * @param targetModel - The target model to update
   * @param action - Whether to 'link' or 'unlink'
   */
  private _updateInverseRelationship(
    relationshipName: string,
    targetModel: any,
    action: 'link' | 'unlink',
  ): void {
    if (!this._relationshipDefs || !this._schema) return;

    const relationshipDef = this._relationshipDefs[relationshipName];
    if (!relationshipDef?.inverse) {
      // No inverse relationship defined, so don't update the target model
      return;
    }

    const { inverse } = relationshipDef;
    const { type, foreignKey } = inverse;

    // Get the target model's ID to find it in the database
    const targetModelId = targetModel.id;
    if (!targetModelId) return;

    // Get the target collection from schema
    const targetCollectionName = relationshipDef.relationship.targetModel.collectionName;
    const targetCollection = this._schema.getCollection(targetCollectionName);

    // Find the target model in the database
    const targetDbRecord = this._schema.db.getCollection(targetCollectionName).find(targetModelId);
    if (!targetDbRecord) return;

    // Prepare the update object for the target model
    const updateAttrs: any = {};

    if (type === 'hasMany') {
      // Update hasMany relationship - add/remove this model's ID
      const currentIds = (targetDbRecord[foreignKey] as any[]) || [];

      if (action === 'link') {
        // Add this model's ID if not already present
        if (!currentIds.includes(this.id)) {
          updateAttrs[foreignKey] = [...currentIds, this.id];
        }
      } else {
        // Remove this model's ID
        updateAttrs[foreignKey] = currentIds.filter((id) => id !== this.id);
      }
    } else if (type === 'belongsTo') {
      // Update belongsTo relationship - set/unset this model's ID
      if (action === 'link') {
        updateAttrs[foreignKey] = this.id;
      } else {
        updateAttrs[foreignKey] = null;
      }
    }

    // Update the target model directly in the database to avoid recursion
    if (Object.keys(updateAttrs).length > 0) {
      this._schema.db.getCollection(targetCollectionName).update(targetModelId, updateAttrs);
    }
  }

  /**
   * Check if an attribute is a foreign key for any relationship
   * @param attributeName - The attribute name to check
   * @returns True if the attribute is a foreign key
   */
  private _isForeignKey(attributeName: string): boolean {
    if (!this._relationshipDefs) return false;

    for (const relationshipName in this._relationshipDefs) {
      const relationshipDef = this._relationshipDefs[relationshipName];
      if (relationshipDef.relationship.foreignKey === attributeName) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if an attribute is a relationship name
   * @param attributeName - The attribute name to check
   * @returns True if the attribute is a relationship name
   */
  private _isRelationshipAttribute(attributeName: string): boolean {
    if (!this._relationshipDefs) return false;
    return attributeName in this._relationshipDefs;
  }

  /**
   * Update a relationship using model instances
   * @param relationshipName - The relationship name
   * @param value - Model instance(s) or null
   */
  private _updateRelationship(relationshipName: any, value: any): void {
    this.link(relationshipName, value);
  }

  /**
   * Update a foreign key and handle bidirectional relationship updates
   * @param foreignKeyName - The name of the foreign key attribute
   * @param value - The new value for the foreign key
   * @private
   */
  private _updateForeignKey(foreignKeyName: any, value: any): void {
    if (!this._relationshipDefs) {
      return;
    }

    // Find the relationship that uses this foreign key
    for (const relationshipName in this._relationshipDefs) {
      const relationshipDef = this._relationshipDefs[relationshipName];
      const relationship = relationshipDef.relationship;

      if (relationship.foreignKey === foreignKeyName) {
        const { type } = relationship;

        // Get the previous value for inverse relationship cleanup
        const previousValue = this._attrs[foreignKeyName as keyof NewModelAttrs<TTemplate>];

        // Update the foreign key attribute
        this._attrs[foreignKeyName as keyof NewModelAttrs<TTemplate>] = value as any;

        if (!this._schema) return;

        // Handle bidirectional updates
        if (type === 'belongsTo') {
          // Unlink from previous target if it exists
          if (previousValue && this._schema.db) {
            const targetCollection = this._schema.db.getCollection(
              relationship.targetModel.collectionName,
            );
            const previousTarget = targetCollection.find(previousValue);
            if (previousTarget) {
              this._updateInverseRelationship(relationshipName, previousTarget, 'unlink');
            }
          }

          // Link to new target if value is not null
          if (value && this._schema.db) {
            const targetCollection = this._schema.db.getCollection(
              relationship.targetModel.collectionName,
            );
            const newTarget = targetCollection.find(value);
            if (newTarget) {
              this._updateInverseRelationship(relationshipName, newTarget, 'link');
            }
          }
        } else if (type === 'hasMany' && Array.isArray(value)) {
          // For hasMany, we need to handle the array of IDs
          const previousIds = Array.isArray(previousValue) ? previousValue : ([] as any[]);
          const newIds = value;

          // Unlink from removed targets
          const removedIds = previousIds.filter((id: any) => !newIds.includes(id));
          if (removedIds.length > 0 && this._schema.db) {
            const targetCollection = this._schema.db.getCollection(
              relationship.targetModel.collectionName,
            );
            removedIds.forEach((id: any) => {
              const target = targetCollection.find(id);
              if (target) {
                this._updateInverseRelationship(relationshipName, target, 'unlink');
              }
            });
          }

          // Link to new targets
          const addedIds = newIds.filter((id: any) => !previousIds.includes(id));
          if (addedIds.length > 0 && this._schema.db) {
            const targetCollection = this._schema.db.getCollection(
              relationship.targetModel.collectionName,
            );
            addedIds.forEach((id: any) => {
              const target = targetCollection.find(id);
              if (target) {
                this._updateInverseRelationship(relationshipName, target, 'link');
              }
            });
          }
        }

        return;
      }
    }

    // Handle direct foreign key updates that don't match any relationship
    this._attrs[foreignKeyName as keyof NewModelAttrs<TTemplate>] = value as any;
  }

  // -- PRIVATE METHODS --

  /**
   * Verify the status of the model during initialization when the id is provided
   * @param id - The id of the model
   * @returns The status of the model
   */
  private _verifyStatus(id: ModelAttrs<TTemplate>['id']): 'new' | 'saved' {
    return this._dbCollection.find(id) ? 'saved' : 'new';
  }
}

/**
 * Define a model class with attribute accessors
 * @template TTemplate - The model template
 * @template TSchema - The full schema collections config for enhanced type inference
 * @param template - The model template to define
 * @returns A model class that can be instantiated with 'new'
 */
export function defineModelClass<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
>(template: TTemplate): ModelClass<TTemplate, TSchema> {
  return class extends Model<TTemplate, TSchema> {
    constructor(config: ModelConfig<TTemplate, TSchema>) {
      super(template, config);
    }
  } as ModelClass<TTemplate, TSchema>;
}
