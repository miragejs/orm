import type { DbCollection } from '@src/db';
import type { SchemaCollections, SchemaInstance } from '@src/schema';
import { MirageError } from '@src/utils';

import type Model from './Model';
import ModelCollection from './ModelCollection';
import { isArray, isModelCollection, isModelInstance } from './typeGuards';
import type {
  ForeignKeyValue,
  ModelAttrs,
  ModelIdFor,
  ModelInstance,
  ModelRelationships,
  ModelTemplate,
  PendingRelationshipOperation,
  RelationshipDef,
  RelationshipDefs,
  RelationshipNames,
  RelationshipTargetModel,
  RelationshipUpdateResult,
  RelationshipsByTemplate,
} from './types';

// TODO: Review types to make them more precise
/**
 * ModelRelationshipsManager - Handles all relationship operations
 * Separated from core model logic for better maintainability
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 * @template TRelationships - The relationships configuration
 */
export default class RelationshipsManager<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<
    TTemplate,
    TSchema
  >,
> {
  public isApplyingPendingUpdates: boolean = false;

  private _model: Model<TTemplate, TSchema>;
  private _pendingRelationshipOperations: PendingRelationshipOperation[] = [];
  private _relationshipDefs?: RelationshipDefs<TRelationships>;
  private _inverseMap: Map<string, string | null | undefined> = new Map();
  private _schema: SchemaInstance<TSchema>;

  constructor(
    model: Model<TTemplate, TSchema>,
    schema: SchemaInstance<TSchema>,
    relationships?: TRelationships,
  ) {
    this._model = model;
    this._schema = schema;
    this._relationshipDefs = this._parseRelationshipDefs(relationships);
  }

  // -- GETTERS --

  /**
   * Getter for the relationship definitions
   * @returns The relationship definitions
   */
  get relationshipDefs(): RelationshipDefs<TRelationships> | undefined {
    return this._relationshipDefs;
  }

  /**
   * Getter for the schema
   * @returns The schema
   */
  get schema(): SchemaInstance<TSchema> {
    return this._schema;
  }

  // -- PENDING RELATIONSHIP UPDATES --

  /**
   * Set pending relationship updates by analyzing changes
   * Should be called BEFORE updating model attributes so we can access old FKs
   * @param relationshipUpdates - Map of relationship names to foreign key values
   */
  setPendingRelationshipUpdates(
    relationshipUpdates: Record<string, ForeignKeyValue>,
  ): void {
    // Process all relationships
    for (const relationshipName in relationshipUpdates) {
      const relationshipDef = this._relationshipDefs?.[relationshipName];
      if (!relationshipDef) continue;

      const relationship = relationshipDef.relationship;
      const { foreignKey } = relationship;
      const inverse = relationshipDef.inverse;

      // Skip if no inverse relationship defined
      if (!inverse) continue;

      const newForeignKey = relationshipUpdates[relationshipName];

      // Get CURRENT foreign key value from model (the OLD value before update)
      const currentForeignKey = this._getForeignKeyValue(foreignKey);

      // Check if the relationship is actually changing
      const hasChanged = this._hasForeignKeyChanged(
        currentForeignKey,
        newForeignKey,
      );

      // For saved models with changed relationships:
      if (this._model.isSaved()) {
        // Unlink old if changed
        if (hasChanged && this._hasForeignKeyValue(currentForeignKey)) {
          this._pendingRelationshipOperations.push({
            relationshipName,
            type: 'unlink',
            foreignKeyValue: currentForeignKey,
            targetCollectionName: relationship.targetModel.collectionName,
            inverseForeignKey: inverse.foreignKey,
            inverseRelationshipName: inverse.relationshipName,
            inverseType: inverse.type,
          });
        }
        // Link new
        if (this._hasForeignKeyValue(newForeignKey)) {
          this._pendingRelationshipOperations.push({
            relationshipName,
            type: 'link',
            foreignKeyValue: newForeignKey,
            targetCollectionName: relationship.targetModel.collectionName,
            inverseForeignKey: inverse.foreignKey,
            inverseRelationshipName: inverse.relationshipName,
            inverseType: inverse.type,
          });
        }
      } else if (
        this._model.isNew() &&
        this._hasForeignKeyValue(newForeignKey)
      ) {
        // For new models: only link (no unlink needed)
        this._pendingRelationshipOperations.push({
          relationshipName,
          type: 'link',
          foreignKeyValue: newForeignKey,
          targetCollectionName: relationship.targetModel.collectionName,
          inverseForeignKey: inverse.foreignKey,
          inverseRelationshipName: inverse.relationshipName,
          inverseType: inverse.type,
        });
      }
    }
  }

  /**
   * Apply inverse relationship updates for pending operations
   * Should be called AFTER saving the model (when FK changes are in the database)
   * Note: FK updates are already applied to the model by processAttrs or link/unlink methods
   */
  applyPendingInverseUpdates(): void {
    if (this._pendingRelationshipOperations.length === 0) return;

    this.isApplyingPendingUpdates = true;

    try {
      for (const operation of this._pendingRelationshipOperations) {
        // Skip if no inverse relationship metadata
        if (
          !operation.inverseForeignKey ||
          !operation.inverseRelationshipName
        ) {
          continue;
        }

        // Extract target IDs from the FK value
        const targetIds = this._extractTargetIds(operation.foreignKeyValue);

        // Update inverse relationships on all target models
        this._updateInverseRelationship(operation.type, {
          targetCollectionName: operation.targetCollectionName,
          targetIds,
          inverseForeignKey: operation.inverseForeignKey,
          inverseType: operation.inverseType!,
          sourceModelId: this._model.id!,
          inverseRelationshipName: operation.inverseRelationshipName,
        });
      }

      // Clear pending operations
      this._pendingRelationshipOperations = [];
    } finally {
      this.isApplyingPendingUpdates = false;
    }
  }

  // -- PUBLIC RELATIONSHIP METHODS --

  /**
   * Link this model to another model via a relationship
   * Returns foreign key updates without mutating model state
   * @param relationshipName - The name of the relationship
   * @param targetModel - The model to link to (or null to unlink)
   * @returns FK updates to apply and inverse relationship updates
   */
  link<K extends RelationshipNames<TRelationships>>(
    relationshipName: K,
    targetModel: RelationshipTargetModel<TSchema, TRelationships, K>,
  ): RelationshipUpdateResult {
    const foreignKeyUpdates: Record<string, ForeignKeyValue> = {};
    const relationshipNameString = String(relationshipName);

    if (!this._relationshipDefs || !this._schema) {
      return { foreignKeyUpdates };
    }

    const relationshipDef = this._getRelationshipDef(relationshipNameString);
    if (!relationshipDef) {
      return { foreignKeyUpdates };
    }

    const relationship = relationshipDef.relationship;
    const { type, foreignKey } = relationship;
    const targetCollectionName = relationship.targetModel.collectionName;
    const inverse = relationshipDef.inverse;

    if (type === 'belongsTo') {
      // Extract new target ID from input
      const newTargetIds = this._extractIdsFromValue('belongsTo', targetModel);
      const newTargetId = newTargetIds[0] ?? null;

      // Get current FK value
      const currentForeignKeyValue = this._getForeignKeyValue(foreignKey);
      const oldTargetId = this._extractSingleId(currentForeignKeyValue);

      // Unlink old if changed and inverse exists
      if (inverse && oldTargetId && oldTargetId !== newTargetId) {
        this._updateInverseRelationship('unlink', {
          targetCollectionName,
          targetIds: [oldTargetId],
          inverseForeignKey: inverse.foreignKey,
          inverseType: inverse.type,
          sourceModelId: this._model.id!,
          inverseRelationshipName: inverse.relationshipName,
        });
      }

      // Set new FK value
      foreignKeyUpdates[foreignKey] = newTargetId;

      // Link new if inverse exists
      if (inverse && newTargetId !== null) {
        this._updateInverseRelationship('link', {
          targetCollectionName,
          targetIds: [newTargetId],
          inverseForeignKey: inverse.foreignKey,
          inverseType: inverse.type,
          sourceModelId: this._model.id!,
          inverseRelationshipName: inverse.relationshipName,
        });
      }
    } else if (type === 'hasMany') {
      // Extract new target IDs from input
      const newTargetIds = this._extractIdsFromValue('hasMany', targetModel);

      // Get current IDs
      const currentForeignKeyValue = this._getForeignKeyValue(foreignKey);
      const currentIds = this._extractIdsArray(currentForeignKeyValue);

      // Check if the relationship is actually changing
      if (!this._arraysEqual(currentIds, newTargetIds)) {
        // Unlink removed IDs if inverse exists
        if (inverse && currentIds.length > 0) {
          this._updateInverseRelationship('unlink', {
            targetCollectionName,
            targetIds: currentIds,
            inverseForeignKey: inverse.foreignKey,
            inverseType: inverse.type,
            sourceModelId: this._model.id!,
            inverseRelationshipName: inverse.relationshipName,
          });
        }

        // Link new IDs if inverse exists
        if (inverse && newTargetIds.length > 0) {
          this._updateInverseRelationship('link', {
            targetCollectionName,
            targetIds: newTargetIds,
            inverseForeignKey: inverse.foreignKey,
            inverseType: inverse.type,
            sourceModelId: this._model.id!,
            inverseRelationshipName: inverse.relationshipName,
          });
        }
      }

      // Set new FK value
      foreignKeyUpdates[foreignKey] = newTargetIds as ForeignKeyValue;
    }

    return { foreignKeyUpdates };
  }

  /**
   * Unlink this model from another model via a relationship
   * Returns foreign key updates without mutating model state
   * @param relationshipName - The name of the relationship
   * @param targetModel - The specific model to unlink (optional for hasMany, unlinks all if not provided)
   * @returns FK updates to apply
   */
  unlink<K extends RelationshipNames<TRelationships>>(
    relationshipName: K,
    targetModel?: RelationshipTargetModel<TSchema, TRelationships, K>,
  ): RelationshipUpdateResult {
    const foreignKeyUpdates: Record<string, ForeignKeyValue> = {};
    const relationshipNameString = String(relationshipName);

    if (!this._relationshipDefs || !this._schema) {
      return { foreignKeyUpdates };
    }

    const relationshipDef = this._getRelationshipDef(relationshipNameString);
    if (!relationshipDef) {
      return { foreignKeyUpdates };
    }

    const { inverse, relationship } = relationshipDef;
    const { type, foreignKey } = relationship;
    const targetCollectionName = relationship.targetModel.collectionName;

    if (type === 'belongsTo') {
      // Get current ID
      const currentId = this._extractSingleId(
        this._getForeignKeyValue(foreignKey),
      );

      // Unlink if current exists and inverse exists
      if (inverse && currentId) {
        this._updateInverseRelationship('unlink', {
          targetCollectionName,
          targetIds: [currentId],
          inverseForeignKey: inverse.foreignKey,
          inverseType: inverse.type,
          sourceModelId: this._model.id!,
          inverseRelationshipName: inverse.relationshipName,
        });
      }

      // Set FK to null
      foreignKeyUpdates[foreignKey] = null;
    } else if (type === 'hasMany') {
      const currentIds = this._extractIdsArray(
        this._getForeignKeyValue(foreignKey),
      );

      if (targetModel) {
        // Unlink specific IDs
        const idsToRemove = this._extractIdsFromValue('hasMany', targetModel);
        const newIds = currentIds.filter((id) => !idsToRemove.includes(id));

        // Update inverse if inverse exists
        if (inverse && idsToRemove.length > 0) {
          this._updateInverseRelationship('unlink', {
            targetCollectionName,
            targetIds: idsToRemove,
            inverseForeignKey: inverse.foreignKey,
            inverseType: inverse.type,
            sourceModelId: this._model.id!,
            inverseRelationshipName: inverse.relationshipName,
          });
        }

        foreignKeyUpdates[foreignKey] = newIds;
      } else {
        // Unlink all
        if (inverse && currentIds.length > 0) {
          this._updateInverseRelationship('unlink', {
            targetCollectionName,
            targetIds: currentIds,
            inverseForeignKey: inverse.foreignKey,
            inverseType: inverse.type,
            sourceModelId: this._model.id!,
            inverseRelationshipName: inverse.relationshipName,
          });
        }

        foreignKeyUpdates[foreignKey] = [];
      }
    }

    return { foreignKeyUpdates };
  }

  /**
   * Get related model(s) for a relationship with proper typing
   * @param relationshipName - The relationship name
   * @returns The related model(s) or null/empty collection
   */
  related<K extends RelationshipNames<TRelationships>>(
    relationshipName: K,
  ): RelationshipTargetModel<TSchema, TRelationships, K> | null {
    if (!this._schema || !this._relationshipDefs) return null;

    const relationshipDef = this._getRelationshipDef(relationshipName);
    if (!relationshipDef) return null;

    const relationship = relationshipDef.relationship;
    const { type, foreignKey, targetModel } = relationship;

    const targetCollection = this._schema.getCollection(
      targetModel.collectionName,
    );
    if (!targetCollection) {
      throw new MirageError(
        `Collection for model ${targetModel.modelName} not found in schema`,
      );
    }

    if (type === 'belongsTo') {
      const foreignKeyValue = this._getForeignKeyValue(foreignKey);
      const singleId = this._extractSingleId(foreignKeyValue);

      if (singleId === null) {
        return null;
      }

      return targetCollection.find(singleId) as RelationshipTargetModel<
        TSchema,
        TRelationships,
        K
      >;
    }

    if (type === 'hasMany') {
      const foreignKeyValues = this._getForeignKeyValue(foreignKey);
      const idsArray = this._extractIdsArray(foreignKeyValues);

      // Get the serializer from the target collection to ensure proper serialization
      const serializer = targetCollection.serializer;

      if (idsArray.length === 0) {
        return new ModelCollection(
          targetModel,
          [],
          serializer,
        ) as RelationshipTargetModel<TSchema, TRelationships, K>;
      }

      const relatedModels = idsArray
        .map((id) => targetCollection.find(id))
        .filter(
          (model): model is ModelInstance<ModelTemplate, TSchema> =>
            model !== null,
        );

      return new ModelCollection(
        targetModel,
        relatedModels,
        serializer,
      ) as RelationshipTargetModel<TSchema, TRelationships, K>;
    }

    return null;
  }

  // -- PRIVATE HELPER METHODS --

  /**
   * Get a relationship definition by name
   * @param relationshipName - The relationship name
   * @returns The relationship definition or undefined
   */
  private _getRelationshipDef<K extends RelationshipNames<TRelationships>>(
    relationshipName: K,
  ): RelationshipDef<TRelationships[K]> | undefined {
    if (!this._relationshipDefs) return undefined;
    return this._relationshipDefs[relationshipName];
  }

  /**
   * Get model attributes with proper typing
   * @returns Model attributes
   */
  private _getModelAttrs(): ModelAttrs<TTemplate, TSchema> {
    // Access private property - we know this exists
    return this._model.attrs as ModelAttrs<TTemplate, TSchema>;
  }

  /**
   * Get foreign key value from model attrs
   * @param foreignKey - The foreign key to retrieve
   * @returns The foreign key value
   */
  private _getForeignKeyValue(foreignKey: string): ForeignKeyValue {
    const attrs = this._getModelAttrs();
    return attrs[foreignKey as keyof typeof attrs] as ForeignKeyValue;
  }

  /**
   * Extract a single ID from foreign key value (for belongsTo relationships)
   * @param foreignKeyValue - The foreign key value
   * @returns A single ID or null
   */
  private _extractSingleId(
    foreignKeyValue: ForeignKeyValue,
  ): ModelIdFor<TTemplate> | null {
    if (foreignKeyValue === null || foreignKeyValue === undefined) {
      return null;
    }
    if (Array.isArray(foreignKeyValue)) {
      // Arrays should not be used for belongsTo relationships
      return null;
    }
    return foreignKeyValue as ModelIdFor<TTemplate>;
  }

  /**
   * Extract array of IDs from foreign key value
   * @param foreignKeyValue - The foreign key value
   * @returns Array of IDs
   */
  private _extractIdsArray(
    foreignKeyValue: ForeignKeyValue,
  ): ModelIdFor<TTemplate>[] {
    if (Array.isArray(foreignKeyValue)) {
      return foreignKeyValue as ModelIdFor<TTemplate>[];
    }
    return [];
  }

  /**
   * Parse relationships configuration into internal relationship definitions
   * This includes finding inverse relationships for bidirectional updates
   * @param relationships - The relationships configuration from schema
   * @returns Parsed relationship definitions with inverse information
   */
  private _parseRelationshipDefs(
    relationships?: TRelationships,
  ): RelationshipDefs<TRelationships> | undefined {
    if (!relationships || !this._schema) return undefined;

    const relationshipDefs: RelationshipDefs<TRelationships> =
      {} as RelationshipDefs<TRelationships>;

    // Parse each relationship and find its inverse
    for (const relationshipName in relationships) {
      const relationship = relationships[relationshipName];
      const relationshipDef: RelationshipDef<typeof relationship> = {
        relationship,
      };

      // Store the explicit inverse setting in the map
      if ('inverse' in relationship) {
        this._inverseMap.set(relationshipName, relationship.inverse);
      }

      // Handle inverse relationship based on the inverse option
      const inverseOption =
        'inverse' in relationship ? relationship.inverse : undefined;

      if (inverseOption === null) {
        // Explicitly disabled inverse - don't set inverse relationship
        relationshipDef.inverse = undefined;
      } else if (typeof inverseOption === 'string') {
        // Explicit inverse relationship name provided
        const targetCollectionName = relationship.targetModel.collectionName;
        const targetCollection =
          this._schema.getCollection(targetCollectionName);

        if (
          targetCollection.relationships &&
          targetCollection.relationships[inverseOption]
        ) {
          const inverseRelationship =
            targetCollection.relationships[inverseOption];
          relationshipDef.inverse = {
            foreignKey: inverseRelationship.foreignKey,
            relationshipName: inverseOption,
            targetModel: relationship.targetModel,
            type: inverseRelationship.type,
          };
        }
      } else {
        // Auto-detect inverse relationship (undefined or not specified)
        const targetCollectionName = relationship.targetModel.collectionName;
        const targetCollection =
          this._schema.getCollection(targetCollectionName);

        if (targetCollection.relationships) {
          for (const inverseRelationshipName in targetCollection.relationships) {
            const inverseRelationship =
              targetCollection.relationships[inverseRelationshipName];
            if (
              inverseRelationship.targetModel.modelName ===
              this._model.modelName
            ) {
              relationshipDef.inverse = {
                foreignKey: inverseRelationship.foreignKey,
                relationshipName: inverseRelationshipName,
                targetModel: relationship.targetModel,
                type: inverseRelationship.type,
              };
              break;
            }
          }
        }
      }

      relationshipDefs[relationshipName] = relationshipDef;
    }

    return relationshipDefs;
  }

  /**
   * Update the inverse relationship on target models
   * @param type - Whether to 'link' or 'unlink'
   * @param config - Configuration object with target details and FK information
   * @param config.targetCollectionName - Collection name where target models live
   * @param config.targetIds - IDs of target models to update inverse FKs on
   * @param config.inverseForeignKey - FK field name on target models
   * @param config.inverseType - Type of inverse relationship (determines FK update logic)
   * @param config.sourceModelId - This model's ID to add/remove from target's FK field
   * @param config.inverseRelationshipName - The relationship name on the target (optional, for checking inverse: null)
   */
  private _updateInverseRelationship(
    type: 'link' | 'unlink',
    config: {
      inverseForeignKey: string;
      inverseRelationshipName?: string;
      inverseType: 'belongsTo' | 'hasMany';
      sourceModelId: string | number;
      targetCollectionName: string;
      targetIds: (string | number)[];
    },
  ): void {
    const {
      inverseForeignKey,
      inverseRelationshipName,
      inverseType,
      sourceModelId,
      targetCollectionName,
      targetIds,
    } = config;

    // Check if the target relationship has explicitly disabled inverse sync
    if (inverseRelationshipName) {
      const targetCollection = this._schema.getCollection(targetCollectionName);
      const targetRelationship =
        targetCollection.relationships?.[inverseRelationshipName];

      // Check if inverse is explicitly null (disabled)
      if (
        targetRelationship &&
        'inverse' in targetRelationship &&
        targetRelationship.inverse === null
      ) {
        // Target relationship explicitly disabled inverse sync
        return;
      }
    }

    // Get the target collection from database - works with any collection/template
    const targetDbCollection = this._schema.db.getCollection(
      targetCollectionName,
    ) as DbCollection<ModelAttrs<ModelTemplate, SchemaCollections>>;

    // Update each target model's foreign key
    for (const key of targetIds) {
      // Find the target record in the database
      const targetId = key as ModelIdFor<ModelTemplate>;
      const targetDbRecord = targetDbCollection.find(targetId);
      if (!targetDbRecord) continue;

      // Prepare the update object for the arbitrary target collection
      const updateAttrs: Record<string, unknown> = {};

      if (inverseType === 'hasMany') {
        // Update hasMany relationship - add/remove this model's ID from array
        const currentValue = targetDbRecord[inverseForeignKey];
        const currentIds = this._extractIdsArray(currentValue);

        if (type === 'link') {
          // Add this model's ID if not already present
          if (!currentIds.includes(sourceModelId)) {
            updateAttrs[inverseForeignKey] = [...currentIds, sourceModelId];
          }
        } else {
          // Remove this model's ID
          updateAttrs[inverseForeignKey] = currentIds.filter(
            (id) => id !== sourceModelId,
          );
        }
      } else if (inverseType === 'belongsTo') {
        // Update belongsTo relationship - set/unset this model's ID
        updateAttrs[inverseForeignKey] = type === 'link' ? sourceModelId : null;
      }

      // Update the target record directly in the database to avoid recursion
      if (Object.keys(updateAttrs).length > 0) {
        targetDbCollection.update(
          targetId,
          updateAttrs as ModelAttrs<ModelTemplate, SchemaCollections>,
        );
      }
    }
  }

  /**
   * Check if foreign key has a meaningful value
   * @param fk - The foreign key value to check
   * @returns True if the foreign key has a value
   */
  private _hasForeignKeyValue(fk: ForeignKeyValue): boolean {
    if (fk === null || fk === undefined) return false;
    if (Array.isArray(fk)) return fk.length > 0;
    return true;
  }

  /**
   * Check if foreign key has changed
   * @param currentFk - The current foreign key value
   * @param newFk - The new foreign key value
   * @returns True if the foreign keys are different
   */
  private _hasForeignKeyChanged(
    currentFk: ForeignKeyValue,
    newFk: ForeignKeyValue,
  ): boolean {
    // Both null/undefined
    if (
      !this._hasForeignKeyValue(currentFk) &&
      !this._hasForeignKeyValue(newFk)
    ) {
      return false;
    }

    // One is null, other isn't
    if (
      !this._hasForeignKeyValue(currentFk) ||
      !this._hasForeignKeyValue(newFk)
    ) {
      return true;
    }

    // Both are arrays (hasMany)
    if (Array.isArray(currentFk) && Array.isArray(newFk)) {
      return !this._arraysEqual(currentFk, newFk);
    }

    // Simple comparison
    return currentFk !== newFk;
  }

  /**
   * Compare two arrays for equality
   * @param arr1 - First array
   * @param arr2 - Second array
   * @returns True if arrays are equal
   */
  private _arraysEqual(
    arr1: (string | number)[],
    arr2: (string | number)[],
  ): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }

  /**
   * Extract ID array from foreign key value
   * @param foreignKeyValue - The foreign key value to extract IDs from
   * @returns Array of IDs
   */
  private _extractTargetIds(
    foreignKeyValue: ForeignKeyValue,
  ): (string | number)[] {
    if (foreignKeyValue === null || foreignKeyValue === undefined) return [];
    if (Array.isArray(foreignKeyValue)) return foreignKeyValue;
    return [foreignKeyValue];
  }

  /**
   * Extract IDs from model/collection input value
   * @param relationshipType - The type of relationship (belongsTo or hasMany)
   * @param value - The value to extract IDs from (model instance, model collection, or array)
   * @returns Array of extracted IDs
   */
  private _extractIdsFromValue(
    relationshipType: 'belongsTo' | 'hasMany',
    value: unknown,
  ): (string | number)[] {
    if (relationshipType === 'belongsTo') {
      if (isModelInstance<TSchema>(value)) {
        return [value.id as string | number];
      }
      return [];
    }

    // hasMany
    if (isModelCollection<TSchema>(value)) {
      return value.models.map((m) => m.id as string | number);
    }
    if (isArray(value)) {
      return value
        .filter((item): item is ModelInstance<ModelTemplate, TSchema> =>
          isModelInstance<TSchema>(item),
        )
        .map((m) => m.id as string | number);
    }
    return [];
  }
}
