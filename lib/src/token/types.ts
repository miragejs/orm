import { IdType } from '@src/id-manager';

/**
 * Base model attributes type
 */
export type BaseModelAttrs<TId extends IdType> = {
  [key: string]: any;
  id: TId;
};

/**
 * Serialization types for model and collection
 * @template TSerializedModel - The serialized model type
 * @template TSerializedCollection - The serialized collection type (defaults to TSerializedModel[])
 */
export interface ModelSerialization<
  TSerializedModel = any,
  TSerializedCollection = TSerializedModel[],
> {
  model: TSerializedModel;
  collection: TSerializedCollection;
}

/**
 * Model token interface
 * @template TModel - The model attributes type
 * @template TSerializationTypes - The serialization types (model and collection)
 * @template TModelName - The key/identifier for the model
 */
export interface ModelToken<
  TModel extends { id: any } = BaseModelAttrs<string>,
  _TSerialization extends ModelSerialization<any, any> = ModelSerialization<TModel, TModel[]>,
  TModelName extends string = string,
  TCollectionName extends string = string,
> {
  readonly modelName: TModelName;
  readonly collectionName: TCollectionName;
  readonly key: symbol;
}

// -- INFERENCE TOKEN TYPES --

export type InferTokenModel<T> = T extends ModelToken<infer M, any, any> ? M : never;
export type InferTokenId<T> = InferTokenModel<T>['id'];
export type InferTokenModelName<T> = T extends ModelToken<any, any, infer Name, any> ? Name : never;
export type InferTokenCollectionName<T> =
  T extends ModelToken<any, any, any, infer Name> ? Name : never;
export type InferTokenSerializationTypes<T> = T extends ModelToken<any, infer S, any> ? S : never;
export type InferTokenSerializedModel<T> = InferTokenSerializationTypes<T>['model'];
export type InferTokenSerializedCollection<T> = InferTokenSerializationTypes<T>['collection'];
