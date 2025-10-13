import type { InferModelName, ModelTemplate } from '../model';

import type { HasMany } from './types';

/**
 * Define a has-many relationship.
 * @param targetModel - The template of the model that is being related to.
 * @param opts - The options for the relationship.
 * @param opts.foreignKey - The foreign key of the relationship.
 * @returns The relationship definition object.
 */
export default function hasMany<
  TTarget extends ModelTemplate,
  const TOpts extends { foreignKey?: string } | undefined = undefined,
>(
  targetModel: TTarget,
  opts?: TOpts,
): HasMany<
  TTarget,
  TOpts extends { foreignKey: infer F extends string } ? F : `${InferModelName<TTarget>}Ids`
> {
  type ForeignKey = TOpts extends { foreignKey: infer F extends string }
    ? F
    : `${InferModelName<TTarget>}Ids`;

  const defaultForeignKey = `${targetModel.modelName}Ids` as const;
  const foreignKey = (opts?.foreignKey ?? defaultForeignKey) as ForeignKey;

  return {
    foreignKey,
    targetModel,
    type: 'hasMany',
  };
}
