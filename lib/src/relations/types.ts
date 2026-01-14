import type { ModelNameFor, ModelTemplate } from '@src/model';

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

/**
 * BelongsTo relationship - this model contains a foreign key to another model
 * Example: Post belongsTo User (Post has authorId pointing to User.id)
 * @template TTarget - The target model template this relationship points to
 * @template TForeign - The foreign key field name (defaults to "{targetModelName}Id")
 */
export type BelongsTo<
  TTarget extends ModelTemplate,
  TForeign extends string = `${ModelNameFor<TTarget>}Id`,
> = {
  foreignKey: TForeign;
  targetModel: TTarget;
  type: 'belongsTo';
  /**
   * The name of the inverse relationship on the target model.
   * - `undefined`: Auto-detect inverse relationship (default behavior)
   * - `string`: Explicit inverse relationship name
   * - `null`: No inverse relationship (disable synchronization)
   */
  inverse?: string | null;
  /**
   * The collection name to use for side-loading during serialization.
   * Defaults to targetModel.collectionName.
   */
  collectionName: string;
};

/**
 * HasMany relationship - this model can have multiple related models
 * Example: User hasMany Posts (User has postIds array containing Post.id values)
 * @template TTarget - The target model template this relationship points to
 * @template TForeign - The foreign key array field name (defaults to "{targetModelName}Ids")
 */
export type HasMany<
  TTarget extends ModelTemplate,
  TForeign extends string = `${ModelNameFor<TTarget>}Ids`,
> = {
  foreignKey: TForeign;
  targetModel: TTarget;
  type: 'hasMany';
  /**
   * The name of the inverse relationship on the target model.
   * - `undefined`: Auto-detect inverse relationship (default behavior)
   * - `string`: Explicit inverse relationship name
   * - `null`: No inverse relationship (disable synchronization)
   */
  inverse?: string | null;
  /**
   * The collection name to use for side-loading during serialization.
   * Defaults to targetModel.collectionName.
   */
  collectionName: string;
};

/**
 * All relationship types
 */
export type Relationships = BelongsTo<any, any> | HasMany<any, any>;

/**
 * Extract the target model template from a relationship
 * @template TRelationship - The relationship type (BelongsTo or HasMany)
 */
export type RelationshipTargetTemplate<TRelationship> = TRelationship extends {
  targetModel: infer TTarget;
}
  ? TTarget extends ModelTemplate
    ? TTarget
    : never
  : never;
