import type { InferModelName, ModelTemplate } from '../model';

/**
 * BelongsTo relationship - this model contains a foreign key to another model
 * Example: Post belongsTo User (Post has authorId pointing to User.id)
 * @template TTarget - The target model template this relationship points to
 * @template TForeign - The foreign key field name (defaults to "{targetModelName}Id")
 */
export type BelongsTo<
  TTarget extends ModelTemplate<any, any, any>,
  TForeign extends string = `${InferModelName<TTarget>}Id`,
> = {
  foreignKey: TForeign;
  targetModel: TTarget;
  type: 'belongsTo';
};

/**
 * HasMany relationship - this model can have multiple related models
 * Example: User hasMany Posts (User has postIds array containing Post.id values)
 * @template TTarget - The target model template this relationship points to
 * @template TForeign - The foreign key array field name (defaults to "{targetModelName}Ids")
 */
export type HasMany<
  TTarget extends ModelTemplate<any, any, any>,
  TForeign extends string = `${InferModelName<TTarget>}Ids`,
> = {
  foreignKey: TForeign;
  targetModel: TTarget;
  type: 'hasMany';
};

/**
 * All relationship types
 */
export type Relationships = BelongsTo<any, any> | HasMany<any, any>;
