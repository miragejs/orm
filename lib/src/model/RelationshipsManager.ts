import type { Relationships } from '@src/associations';
import type { SchemaCollections, SchemaInstance } from '@src/schema';
import { MirageError } from '@src/utils';

import type Model from './Model';
import ModelCollection from './ModelCollection';
import { isArray, isModelCollection, isModelInstance } from './typeGuards';
import type {
  ForeignKeyValue,
  ModelAttrs,
  ModelId,
  ModelInstance,
  ModelRelationships,
  ModelTemplate,
  PendingRelationshipOperation,
  RelatedModelAttrs,
  RelationshipDef,
  RelationshipDefs,
  RelationshipNames,
  RelationshipTargetModel,
  RelationshipUpdateResult,
  RelationshipsByTemplate,
} from './types';

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
  TRelationships extends ModelRelationships = RelationshipsByTemplate<TTemplate, TSchema>,
> {
  private _isApplyingPendingUpdates: boolean = false;
  private _model: Model<TTemplate, TSchema>;
  private _pendingRelationshipOperations: PendingRelationshipOperation[] = [];
  private _relationshipDefs?: RelationshipDefs<TRelationships>;
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
   * Handles both model instances and raw foreign key values
   * Should be called BEFORE updating model attributes so we can access old FKs
   * @param relationshipUpdates - Raw relationship values from attrs (can be models or FK values)
   */
  setPendingRelationshipUpdates(
    relationshipUpdates: Partial<RelatedModelAttrs<TSchema, TRelationships>>,
  ): void {
    for (const relationshipName in relationshipUpdates) {
      const relationshipDef = this._relationshipDefs?.[relationshipName];
      if (!relationshipDef) continue;

      const relationship = relationshipDef.relationship;
      const { foreignKey, type, targetModel } = relationship;
      const rawValue = relationshipUpdates[relationshipName];
      let processedValue: unknown = rawValue;

      // If rawValue is a raw FK value (string or string[]), fetch the actual model(s)
      if (
        typeof rawValue === 'string' ||
        typeof rawValue === 'number' ||
        (isArray(rawValue) &&
          (rawValue as unknown[]).every(
            (v: unknown) => typeof v === 'string' || typeof v === 'number',
          ))
      ) {
        const targetCollection = this._schema.getCollection(targetModel.collectionName);

        if (type === 'belongsTo') {
          const id = rawValue as string | number;
          processedValue = targetCollection.find(id);
        } else if (type === 'hasMany') {
          const ids = rawValue as (string | number)[];
          const models = ids
            .map((id) => targetCollection.find(id))
            .filter((m): m is ModelInstance<ModelTemplate, TSchema> => isModelInstance<TSchema>(m));
          processedValue = new ModelCollection(targetModel, models);
        }
      }

      // Get CURRENT foreign key value from model (the OLD value before update)
      const currentForeignKey = this._getForeignKeyValue(foreignKey);
      // Extract NEW foreign key from the relationship value
      const newForeignKey = this._extractForeignKeyFromValue(relationship, processedValue);
      // Check if the relationship is actually changing
      const hasChanged = this._hasForeignKeyChanged(currentForeignKey, newForeignKey);

      // For saved models with changed relationships:
      if (this._model.isSaved()) {
        // unlink old
        if (hasChanged) {
          const oldValue = this.related(relationshipName);
          this._pendingRelationshipOperations.push({
            relationshipName,
            link: false,
            unlink: true,
            value: oldValue,
          });
        }
        // link new
        if (this._hasForeignKeyValue(newForeignKey)) {
          this._pendingRelationshipOperations.push({
            relationshipName,
            link: true,
            unlink: false,
            value: processedValue,
          });
        }
      } else if (this._model.isNew() && this._hasForeignKeyValue(newForeignKey)) {
        // For new models: only link (no unlink needed)
        this._pendingRelationshipOperations.push({
          relationshipName,
          link: true,
          unlink: false,
          value: processedValue,
        });
      }
    }
  }

  /**
   * Apply inverse relationship updates for pending operations
   * Should be called AFTER saving the model (when FK changes are in the database)
   * Note: FK updates are already applied to the model by _processAttrs or link/unlink methods
   */
  applyPendingInverseUpdates(): void {
    if (this._pendingRelationshipOperations.length === 0) return;

    this._isApplyingPendingUpdates = true;

    try {
      // Step 1: Process all unlinks first - update inverse relationships on old targets
      for (const operation of this._pendingRelationshipOperations) {
        if (operation.unlink && operation.value !== undefined) {
          // Update inverse relationships on the old related models
          if (isModelInstance<TSchema>(operation.value)) {
            this._updateInverseRelationship(operation.relationshipName, operation.value, 'unlink');
          } else if (isModelCollection<TSchema>(operation.value)) {
            operation.value.models.forEach((model) => {
              this._updateInverseRelationship(operation.relationshipName, model, 'unlink');
            });
          }
        }
      }

      // Step 2: Process all links - update inverse relationships
      for (const operation of this._pendingRelationshipOperations) {
        if (operation.link && operation.value !== undefined) {
          const relationshipDef = this._relationshipDefs?.[operation.relationshipName];
          if (!relationshipDef) continue;

          // Update inverse relationships on new targets
          if (isModelInstance<TSchema>(operation.value)) {
            this._updateInverseRelationship(operation.relationshipName, operation.value, 'link');
          } else if (isModelCollection<TSchema>(operation.value)) {
            operation.value.models.forEach((model) => {
              this._updateInverseRelationship(operation.relationshipName, model, 'link');
            });
          } else if (isArray(operation.value)) {
            const models = operation.value.filter(
              (item): item is ModelInstance<ModelTemplate, TSchema> =>
                isModelInstance<TSchema>(item),
            );
            models.forEach((model) => {
              this._updateInverseRelationship(operation.relationshipName, model, 'link');
            });
          }
        }
      }

      // Clear pending operations
      this._pendingRelationshipOperations = [];
    } finally {
      this._isApplyingPendingUpdates = false;
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

    if (!this._relationshipDefs || !this._schema) {
      return { foreignKeyUpdates };
    }

    const relationshipDef = this._getRelationshipDef(relationshipName);
    if (!relationshipDef) {
      return { foreignKeyUpdates };
    }

    const relationship = relationshipDef.relationship;
    const { type, foreignKey } = relationship;

    if (type === 'belongsTo') {
      const currentForeignKeyValue = this._getForeignKeyValue(foreignKey);
      const newTargetId = isModelInstance<TSchema>(targetModel) ? (targetModel.id as string) : null;

      // Only unlink if the relationship is actually changing
      if (currentForeignKeyValue && currentForeignKeyValue !== newTargetId) {
        // Get old target for inverse update
        const targetCollectionName = relationship.targetModel.collectionName;
        const targetCollection = this._schema.getCollection(targetCollectionName);
        const oldTarget = targetCollection.find(currentForeignKeyValue as string);

        // Update inverse relationship on old target
        if (oldTarget && isModelInstance<TSchema>(oldTarget)) {
          this._updateInverseRelationship(relationshipName as string, oldTarget, 'unlink');
        }
      }

      // Set new FK value
      foreignKeyUpdates[foreignKey] = newTargetId;

      // Update inverse relationship on new target
      if (isModelInstance<TSchema>(targetModel)) {
        this._updateInverseRelationship(relationshipName as string, targetModel, 'link');
      }
    } else if (type === 'hasMany') {
      // Extract new target IDs
      let newTargetIds: (string | number)[] = [];
      let newTargetModels: ModelInstance<ModelTemplate, TSchema>[] = [];

      if (isModelCollection<TSchema>(targetModel)) {
        newTargetModels = targetModel.models;
        newTargetIds = newTargetModels.map((m) => m.id as string);
      } else if (isArray(targetModel)) {
        newTargetModels = targetModel.filter(
          (item): item is ModelInstance<ModelTemplate, TSchema> => isModelInstance<TSchema>(item),
        );
        newTargetIds = newTargetModels.map((m) => m.id as string);
      }

      // Get current IDs
      const currentForeignKeyValues = this._getForeignKeyValue(foreignKey);
      const currentIds = this._extractIdsArray(currentForeignKeyValues);

      // Check if the relationship is actually changing
      const idsChanged =
        currentIds.length !== newTargetIds.length ||
        !currentIds.every((id, index) => id === newTargetIds[index]);

      if (currentIds.length > 0 && idsChanged) {
        // Get old targets for inverse updates
        const targetCollectionName = relationship.targetModel.collectionName;
        const targetCollection = this._schema.getCollection(targetCollectionName);

        currentIds.forEach((id) => {
          const oldTarget = targetCollection.find(id as string);
          if (oldTarget && isModelInstance<TSchema>(oldTarget)) {
            this._updateInverseRelationship(relationshipName as string, oldTarget, 'unlink');
          }
        });
      }

      // Set new FK value
      foreignKeyUpdates[foreignKey] = newTargetIds as string[];

      // Update inverse relationships on new targets
      newTargetModels.forEach((model) => {
        this._updateInverseRelationship(relationshipName as string, model, 'link');
      });
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

    if (!this._relationshipDefs || !this._schema) {
      return { foreignKeyUpdates };
    }

    const relationshipDef = this._getRelationshipDef(relationshipName);
    if (!relationshipDef) {
      return { foreignKeyUpdates };
    }

    const relationship = relationshipDef.relationship;
    const { type, foreignKey } = relationship;

    if (type === 'belongsTo') {
      // Get the current target model before unlinking for inverse update
      const currentTarget = this.related(relationshipName);

      // Set FK to null
      foreignKeyUpdates[foreignKey] = null;

      // Update inverse relationship
      if (isModelInstance<TSchema>(currentTarget)) {
        this._updateInverseRelationship(relationshipName as string, currentTarget, 'unlink');
      }
    } else if (type === 'hasMany') {
      if (targetModel) {
        // Unlink specific item(s)
        const currentIds = this._extractIdsArray(this._getForeignKeyValue(foreignKey));
        let modelsToUnlink: ModelInstance<ModelTemplate, TSchema>[] = [];

        if (isModelInstance<TSchema>(targetModel)) {
          // Single model
          modelsToUnlink = [targetModel];
        } else if (isModelCollection<TSchema>(targetModel)) {
          // ModelCollection
          modelsToUnlink = targetModel.models;
        } else if (isArray(targetModel)) {
          // Array of models
          modelsToUnlink = targetModel.filter(
            (item): item is ModelInstance<ModelTemplate, TSchema> => isModelInstance<TSchema>(item),
          );
        }

        // Filter out the IDs of models to unlink
        const idsToRemove = new Set<string>(modelsToUnlink.map((m) => m.id));
        const newIds = currentIds.filter((id) => !idsToRemove.has(id));
        foreignKeyUpdates[foreignKey] = newIds;

        // Update inverse relationships
        modelsToUnlink.forEach((model) => {
          this._updateInverseRelationship(relationshipName as string, model, 'unlink');
        });
      } else {
        // Unlink all items (no targetModel provided)
        const currentTargets = this.related(relationshipName);
        foreignKeyUpdates[foreignKey] = [];

        // Update inverse relationships
        if (isModelCollection<TSchema>(currentTargets)) {
          currentTargets.models.forEach((target) => {
            this._updateInverseRelationship(relationshipName as string, target, 'unlink');
          });
        }
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

    const targetCollection = this._schema.getCollection(targetModel.collectionName);
    if (!targetCollection) {
      throw new MirageError(`Collection for model ${targetModel.modelName} not found in schema`);
    }

    if (type === 'belongsTo') {
      const foreignKeyValue = this._getForeignKeyValue(foreignKey);
      const singleId = this._extractSingleId(foreignKeyValue);

      if (singleId === null) {
        return null;
      }

      return targetCollection.find(singleId as string) as RelationshipTargetModel<
        TSchema,
        TRelationships,
        K
      >;
    }

    if (type === 'hasMany') {
      const foreignKeyValues = this._getForeignKeyValue(foreignKey);
      const idsArray = this._extractIdsArray(foreignKeyValues);

      if (idsArray.length === 0) {
        return new ModelCollection(targetModel, []) as RelationshipTargetModel<
          TSchema,
          TRelationships,
          K
        >;
      }

      const relatedModels = idsArray
        .map((id) => targetCollection.find(id as string))
        .filter((model): model is ModelInstance<ModelTemplate, TSchema> => model !== null);

      return new ModelCollection(targetModel, relatedModels) as RelationshipTargetModel<
        TSchema,
        TRelationships,
        K
      >;
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
  private _extractSingleId(foreignKeyValue: ForeignKeyValue): ModelId<TTemplate> | null {
    if (foreignKeyValue === null || foreignKeyValue === undefined) {
      return null;
    }
    if (Array.isArray(foreignKeyValue)) {
      // Arrays should not be used for belongsTo relationships
      return null;
    }
    return foreignKeyValue as ModelId<TTemplate>;
  }

  /**
   * Extract array of IDs from foreign key value
   * @param foreignKeyValue - The foreign key value
   * @returns Array of IDs
   */
  private _extractIdsArray(foreignKeyValue: ForeignKeyValue): ModelId<TTemplate>[] {
    if (Array.isArray(foreignKeyValue)) {
      return foreignKeyValue as ModelId<TTemplate>[];
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

      // Look for inverse relationship in the target model's collection
      const targetCollectionName = relationship.targetModel.collectionName;
      const targetCollection = this._schema.getCollection(targetCollectionName);

      if (targetCollection.relationships) {
        for (const inverseRelationshipName in targetCollection.relationships) {
          const inverseRelationship = targetCollection.relationships[inverseRelationshipName];
          if (inverseRelationship.targetModel.modelName === this._model.modelName) {
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

      relationshipDefs[relationshipName] = relationshipDef;
    }

    return relationshipDefs;
  }

  /**
   * Update the inverse relationship on the target model
   * @param relationshipName - The name of the relationship being updated
   * @param targetModel - The target model to update
   * @param action - Whether to 'link' or 'unlink'
   */
  private _updateInverseRelationship(
    relationshipName: string,
    targetModel: ModelInstance<ModelTemplate, TSchema>,
    action: 'link' | 'unlink',
  ): void {
    if (!this._relationshipDefs || !this._schema) return;

    const relationshipDef = this._relationshipDefs[relationshipName];
    if (!relationshipDef?.inverse) {
      // No inverse relationship defined, so don't update the target model
      return;
    }

    const modelId = this._model.id;
    if (!modelId) return;

    const { inverse } = relationshipDef;
    const { type, foreignKey } = inverse;

    // Get the target model's ID to find it in the database
    const targetModelId = targetModel.id;
    if (!targetModelId) return;

    // Get the target collection from schema
    const targetCollectionName = relationshipDef.relationship.targetModel.collectionName;

    // Find the target model in the database
    const targetDbRecord = this._schema.db.getCollection(targetCollectionName).find(targetModelId);
    if (!targetDbRecord) return;

    // Prepare the update object for the target model
    const updateAttrs: Record<string, ForeignKeyValue> = {};

    if (type === 'hasMany') {
      // Update hasMany relationship - add/remove this model's ID
      const currentValue = targetDbRecord[foreignKey as keyof typeof targetDbRecord];
      const currentIds = this._extractIdsArray(currentValue as ForeignKeyValue);

      if (action === 'link') {
        // Add this model's ID if not already present
        if (!currentIds.includes(modelId as ModelId<TTemplate>)) {
          updateAttrs[foreignKey] = [...currentIds, modelId as string];
        }
      } else {
        // Remove this model's ID
        updateAttrs[foreignKey] = currentIds.filter((id) => id !== modelId);
      }
    } else if (type === 'belongsTo') {
      // Update belongsTo relationship - set/unset this model's ID
      updateAttrs[foreignKey] = action === 'link' ? (modelId as string) : null;
    }

    // Update the target model directly in the database to avoid recursion
    if (Object.keys(updateAttrs).length > 0) {
      this._schema.db.getCollection(targetCollectionName).update(targetModelId, updateAttrs);
    }
  }

  /**
   * Extract foreign key value from a relationship value (model/array/collection)
   * @param relationship - The relationship configuration
   * @param value - The relationship value
   * @returns The extracted foreign key value
   */
  private _extractForeignKeyFromValue(
    relationship: Relationships,
    value: unknown,
  ): ForeignKeyValue {
    const { type } = relationship;

    if (type === 'belongsTo') {
      if (isModelInstance<TSchema>(value)) {
        return value.id as string;
      }
      return null;
    }

    if (type === 'hasMany') {
      if (isModelCollection<TSchema>(value)) {
        return value.models.map((m) => m.id as string);
      }
      if (isArray(value)) {
        return value
          .filter((item): item is ModelInstance<ModelTemplate, TSchema> =>
            isModelInstance<TSchema>(item),
          )
          .map((m) => m.id as string);
      }
      return [];
    }

    return null;
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
  private _hasForeignKeyChanged(currentFk: ForeignKeyValue, newFk: ForeignKeyValue): boolean {
    // Both null/undefined
    if (!this._hasForeignKeyValue(currentFk) && !this._hasForeignKeyValue(newFk)) {
      return false;
    }

    // One is null, other isn't
    if (!this._hasForeignKeyValue(currentFk) || !this._hasForeignKeyValue(newFk)) {
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
  private _arraysEqual(arr1: (string | number)[], arr2: (string | number)[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }
}
