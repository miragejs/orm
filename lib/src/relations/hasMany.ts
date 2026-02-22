import type { ModelNameFor, ModelTemplate } from '@src/model';

import type { HasMany } from './types';

/**
 * Define a has-many relationship.
 * @param targetModel - The template of the model that is being related to.
 * @param opts - The options for the relationship.
 * @param opts.foreignKey - The foreign key of the relationship.
 * @param opts.inverse - The name of the inverse relationship on the target model, or null to disable.
 * @param opts.collectionName - The collection name for side-loading during serialization. Defaults to targetModel.collectionName. This is useful when the serializer needs to side-load relationships using a specific collection key.
 * @returns The relationship definition object.
 * @example
 * ```typescript
 * // Auto-detect inverse
 * posts: hasMany(postModel)
 *
 * // Explicit inverse
 * authoredPosts: hasMany(postModel, { inverse: 'author' })
 *
 * // No inverse (no synchronization)
 * archivedPosts: hasMany(postModel, { inverse: null })
 *
 * // Custom collection name for serialization
 * posts: hasMany(postModel, { collectionName: 'articles' })
 * ```
 */
export default function hasMany<
  TTarget extends ModelTemplate,
  const TOpts extends
    | { foreignKey?: string; inverse?: string | null; collectionName?: string }
    | undefined = undefined,
>(
  targetModel: TTarget,
  opts?: TOpts,
): HasMany<
  TTarget,
  TOpts extends { foreignKey: infer F extends string }
    ? F
    : `${ModelNameFor<TTarget>}Ids`
> {
  type ForeignKey = TOpts extends { foreignKey: infer F extends string }
    ? F
    : `${ModelNameFor<TTarget>}Ids`;

  const defaultForeignKey = `${targetModel.modelName}Ids` as const;
  const foreignKey = (opts?.foreignKey ?? defaultForeignKey) as ForeignKey;

  return {
    collectionName: opts?.collectionName ?? targetModel.collectionName,
    foreignKey,
    inverse: opts?.inverse,
    targetModel,
    type: 'hasMany',
  };
}
