import type { ModelName, ModelTemplate } from '../model';

import type { HasMany } from './types';

/**
 * Define a has-many relationship.
 * @param targetModel - The template of the model that is being related to.
 * @returns The relationship definition object.
 */
export default function hasMany<TTarget extends ModelTemplate>(
  targetModel: TTarget,
): HasMany<TTarget, `${ModelName<TTarget>}Ids`>;
export default function hasMany<TTarget extends ModelTemplate, TForeign extends string>(
  targetModel: TTarget,
  opts: { foreignKey: TForeign },
): HasMany<TTarget, TForeign>;
/**
 * Define a has-many relationship.
 * @param targetModel - The template of the model that is being related to.
 * @param opts - The options for the relationship.
 * @param opts.foreignKey - The foreign key of the relationship.
 * @returns The relationship definition object.
 */
export default function hasMany<
  TTarget extends ModelTemplate,
  TForeign extends string = `${ModelName<TTarget>}Id`,
>(targetModel: TTarget, opts?: { foreignKey: TForeign }): HasMany<TTarget, TForeign> {
  const defaultForeignKey = `${targetModel.modelName}Ids` as TForeign;
  const foreignKey = (opts?.foreignKey ?? defaultForeignKey) as TForeign;
  return {
    foreignKey,
    targetModel,
    type: 'hasMany',
  };
}
