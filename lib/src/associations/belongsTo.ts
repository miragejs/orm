import type { InferTemplateModelName, ModelTemplate } from '../model';

import type { BelongsTo } from './types';

/**
 * Define a belongs-to relationship.
 * @param targetModel - The template of the model that is being related to.
 * @returns The relationship definition object.
 */
export default function belongsTo<TTarget extends ModelTemplate>(
  targetModel: TTarget,
): BelongsTo<TTarget, `${InferTemplateModelName<TTarget>}Id`>;
export default function belongsTo<TTarget extends ModelTemplate, TForeign extends string>(
  targetModel: TTarget,
  opts: { foreignKey: TForeign },
): BelongsTo<TTarget, TForeign>;
/**
 * Define a belongs-to relationship.
 * @param targetModel - The template of the model that is being related to.
 * @param opts - The options for the relationship.
 * @param opts.foreignKey - The foreign key of the relationship.
 * @returns The relationship definition object.
 */
export default function belongsTo<
  TTarget extends ModelTemplate,
  TForeign extends string = `${InferTemplateModelName<TTarget>}Id`,
>(targetModel: TTarget, opts?: { foreignKey: TForeign }): BelongsTo<TTarget, TForeign> {
  const defaultForeignKey = `${targetModel.modelName}Id`;
  const foreignKey = (opts?.foreignKey ?? defaultForeignKey) as TForeign;
  return {
    foreignKey,
    targetModel,
    type: 'belongsTo',
  };
}
