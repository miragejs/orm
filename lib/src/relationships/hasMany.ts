import type { InferTokenModelName, ModelToken } from '../model';

import type { HasMany } from './types';

/**
 * Define a has-many relationship.
 * @param targetToken - The token of the model that is being related to.
 * @returns The relationship definition object.
 */
export default function hasMany<TTarget extends ModelToken>(
  targetToken: TTarget,
): HasMany<TTarget, `${InferTokenModelName<TTarget>}Ids`>;
export default function hasMany<TTarget extends ModelToken, TForeign extends string>(
  targetToken: TTarget,
  opts: { foreignKey: TForeign },
): HasMany<TTarget, TForeign>;
/**
 * Define a has-many relationship.
 * @param targetToken - The token of the model that is being related to.
 * @param opts - The options for the relationship.
 * @param opts.foreignKey - The foreign key of the relationship.
 * @returns The relationship definition object.
 */
export default function hasMany<
  TTarget extends ModelToken,
  TForeign extends string = `${InferTokenModelName<TTarget>}Ids`,
>(targetToken: TTarget, opts?: { foreignKey: TForeign }): HasMany<TTarget, TForeign> {
  const defaultForeignKey = `${targetToken.modelName}Ids` as TForeign;
  const foreignKey = (opts?.foreignKey ?? defaultForeignKey) as TForeign;
  return {
    foreignKey,
    targetToken,
    type: 'hasMany',
  };
}
