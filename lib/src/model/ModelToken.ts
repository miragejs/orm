import type { BaseModelAttrs, ModelToken, ModelSerialization } from './types';

/**
 * Define a model token
 * @param modelName - The name of the model
 * @param collectionName - The name of the collection
 * @returns The model token
 */
export function defineToken<
  TModel extends { id: any } = BaseModelAttrs<string>,
  TSerialization extends ModelSerialization<TModel, TModel[]> = ModelSerialization<
    TModel,
    TModel[]
  >,
  const TModelName extends string = string,
  const TCollectionName extends string = string,
>(
  modelName: TModelName,
  collectionName: TCollectionName,
): ModelToken<TModel, TSerialization, TModelName, TCollectionName> {
  return {
    modelName,
    collectionName,
    key: Symbol(modelName),
  };
}
