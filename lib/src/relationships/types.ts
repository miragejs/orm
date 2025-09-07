import type { InferTokenModelName, ModelToken } from '../model';

/**
 * BelongsTo relationship - this model contains a foreign key to another model
 * Example: Post belongsTo User (Post has authorId pointing to User.id)
 * @template TTarget - The target model token this relationship points to
 * @template TForeign - The foreign key field name (defaults to "{targetModelName}Id")
 */
export type BelongsTo<
  TTarget extends ModelToken,
  TForeign extends string = `${InferTokenModelName<TTarget>}Id`,
> = {
  foreignKey: TForeign;
  targetToken: TTarget;
  type: 'belongsTo';
};

/**
 * HasMany relationship - this model can have multiple related models
 * Example: User hasMany Posts (User has postIds array containing Post.id values)
 * @template TTarget - The target model token this relationship points to
 * @template TForeign - The foreign key array field name (defaults to "{targetModelName}Ids")
 */
export type HasMany<
  TTarget extends ModelToken,
  TForeign extends string = `${InferTokenModelName<TTarget>}Ids`,
> = {
  foreignKey: TForeign;
  targetToken: TTarget;
  type: 'hasMany';
};

/**
 * All relationship types
 */
export type Relationships = BelongsTo<any, any> | HasMany<any, any>;
