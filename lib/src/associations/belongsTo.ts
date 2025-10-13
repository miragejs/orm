import type { InferModelName, ModelTemplate } from '../model';

import type { BelongsTo } from './types';

/**
 * Define a belongs-to relationship.
 * @param targetModel - The template of the model that is being related to.
 * @param opts - The options for the relationship.
 * @param opts.foreignKey - The foreign key of the relationship.
 * @returns The relationship definition object.
 */
export default function belongsTo<
  TTarget extends ModelTemplate,
  const TOpts extends { foreignKey?: string } | undefined = undefined,
>(
  targetModel: TTarget,
  opts?: TOpts,
): BelongsTo<
  TTarget,
  TOpts extends { foreignKey: infer F extends string } ? F : `${InferModelName<TTarget>}Id`
> {
  type ForeignKey = TOpts extends { foreignKey: infer F extends string }
    ? F
    : `${InferModelName<TTarget>}Id`;

  const defaultForeignKey = `${targetModel.modelName}Id` as const;
  const foreignKey = (opts?.foreignKey ?? defaultForeignKey) as ForeignKey;

  return {
    foreignKey,
    targetModel,
    type: 'belongsTo',
  };
}
