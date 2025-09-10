import type { InferTokenModelName, ModelToken } from '../model';

import type { BelongsTo } from './types';

/**
 * Define a belongs-to relationship.
 * @param targetToken - The token of the model that is being related to.
 * @returns The relationship definition object.
 */
export default function belongsTo<TTarget extends ModelToken>(
  targetToken: TTarget,
): BelongsTo<TTarget, `${InferTokenModelName<TTarget>}Id`>;
export default function belongsTo<TTarget extends ModelToken, TForeign extends string>(
  targetToken: TTarget,
  opts: { foreignKey: TForeign },
): BelongsTo<TTarget, TForeign>;
/**
 * Define a belongs-to relationship.
 * @param targetToken - The token of the model that is being related to.
 * @param opts - The options for the relationship.
 * @param opts.foreignKey - The foreign key of the relationship.
 * @returns The relationship definition object.
 */
export default function belongsTo<
  TTarget extends ModelToken,
  TForeign extends string = `${InferTokenModelName<TTarget>}Id`,
>(targetToken: TTarget, opts?: { foreignKey: TForeign }): BelongsTo<TTarget, TForeign> {
  const defaultForeignKey = `${targetToken.modelName}Id`;
  const foreignKey = (opts?.foreignKey ?? defaultForeignKey) as TForeign;
  return {
    foreignKey,
    targetToken,
    type: 'belongsTo',
  };
}
