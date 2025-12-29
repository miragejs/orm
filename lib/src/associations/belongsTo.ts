import type { ModelNameFor, ModelTemplate } from '../model';

import type { BelongsTo } from './types';

/**
 * Define a belongs-to relationship.
 * @param targetModel - The template of the model that is being related to.
 * @param opts - The options for the relationship.
 * @param opts.foreignKey - The foreign key of the relationship.
 * @param opts.inverse - The name of the inverse relationship on the target model, or null to disable.
 * @param opts.collectionName - The collection name for side-loading during serialization. Defaults to targetModel.collectionName. This is useful when the serializer needs to side-load relationships using a specific collection key (e.g., 'authors' instead of 'users').
 * @returns The relationship definition object.
 * @example
 * ```typescript
 * // Auto-detect inverse
 * author: belongsTo(userModel)
 *
 * // Explicit inverse
 * author: belongsTo(userModel, { inverse: 'authoredPosts' })
 *
 * // No inverse (no synchronization)
 * reviewer: belongsTo(userModel, { inverse: null })
 *
 * // Custom collection name for serialization
 * author: belongsTo(userModel, { collectionName: 'authors' })
 * ```
 */
export default function belongsTo<
  TTarget extends ModelTemplate,
  const TOpts extends
    | { foreignKey?: string; inverse?: string | null; collectionName?: string }
    | undefined = undefined,
>(
  targetModel: TTarget,
  opts?: TOpts,
): BelongsTo<
  TTarget,
  TOpts extends { foreignKey: infer F extends string }
    ? F
    : `${ModelNameFor<TTarget>}Id`
> {
  type ForeignKey = TOpts extends { foreignKey: infer F extends string }
    ? F
    : `${ModelNameFor<TTarget>}Id`;

  const defaultForeignKey = `${targetModel.modelName}Id` as const;
  const foreignKey = (opts?.foreignKey ?? defaultForeignKey) as ForeignKey;

  return {
    collectionName: opts?.collectionName ?? targetModel.collectionName,
    foreignKey,
    inverse: opts?.inverse,
    targetModel,
    type: 'belongsTo',
  };
}
