import type { IdType } from '@src/db';

import type { BaseModelAttrs, ModelMeta, ModelToken } from './types';

/**
 * Define a model token
 * @param modelName - The name of the model
 * @param collectionName - The name of the collection
 * @returns The model token
 */
export function defineToken<
  TModel extends BaseModelAttrs<IdType> = BaseModelAttrs<string>,
  TSerialized = TModel,
  TMeta extends ModelMeta = ModelMeta,
>(
  modelName: TMeta['modelName'],
  collectionName: TMeta['collectionName'],
): ModelToken<TModel, TSerialized, TMeta> {
  return {
    modelName,
    collectionName,
    key: Symbol(modelName),
  } as ModelToken<TModel, TSerialized, TMeta>;
}
