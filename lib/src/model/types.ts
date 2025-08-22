import type { DbCollection } from '@src/db';
import type { IdType } from '@src/id-manager';

// -- BASE TYPES --

/**
 * Base model attributes type
 */
export type BaseModelAttrs<TId extends IdType> = {
  [key: string]: any;
  id: TId;
};

/**
 * Model metadata containing names
 */
export interface ModelMeta {
  modelName: string;
  collectionName: string;
}

// -- TOKEN TYPES --

/**
 * Model token interface
 * @template TModel - The model attributes type
 * @template TSerialized - The serialized type
 * @template TMeta - The metadata type containing model and collection names
 */
export interface ModelToken<
  TModel extends { id: any } = BaseModelAttrs<string>,
  _TSerialized = TModel,
  TMeta extends ModelMeta = ModelMeta,
> {
  readonly modelName: TMeta['modelName'];
  readonly collectionName: TMeta['collectionName'];
  readonly key: unique symbol;
}

// -- INFERENCE TYPES --

export type InferTokenModel<T> = T extends ModelToken<infer M, any, any> ? M : never;
export type InferTokenId<T> = InferTokenModel<T>['id'];
export type InferTokenSerialized<T> = T extends ModelToken<any, infer S, any> ? S : never;
export type InferTokenMeta<T> = T extends ModelToken<any, any, infer Meta> ? Meta : never;
export type InferTokenModelName<T> = InferTokenMeta<T>['modelName'];
export type InferTokenCollectionName<T> = InferTokenMeta<T>['collectionName'];

// -- MODEL TYPES --

// Forward declaration to avoid circular dependency
declare class Model<TToken extends ModelToken> {
  readonly modelName: string;
  readonly id: InferTokenModel<TToken>['id'] | null;
  readonly attrs: NewModelAttrs<TToken>;

  destroy(): NewModelInstance<TToken>;
  reload(): ModelInstance<TToken>;
  save(): ModelInstance<TToken>;
  update(attrs: PartialModelAttrs<TToken>): ModelInstance<TToken>;
  isNew(): boolean;
  isSaved(): boolean;
  toJSON(): any;
  toString(): string;
}

/**
 * Type for full model attributes (wrapper around InferTokenModel for consistency)
 * @template TToken - The model token
 */
export type ModelAttrs<TToken extends ModelToken> = InferTokenModel<TToken>;

/**
 * Type for new model attributes (allowing null id for unsaved models)
 * @template TToken - The model token
 */
export type NewModelAttrs<TToken extends ModelToken> = Omit<InferTokenModel<TToken>, 'id'> & {
  id: InferTokenModel<TToken>['id'] | null;
};

/**
 * Type for partial model attributes (all fields optional except id which can be undefined)
 * @template TToken - The model token
 */
export type PartialModelAttrs<TToken extends ModelToken> = Partial<
  Omit<NewModelAttrs<TToken>, 'id'>
>;

/**
 * Configuration for creating a model
 * @template TToken - The model token
 * @param config.attrs - The attributes for the model
 * @param config.collection - The collection to use for the model
 */
export interface ModelConfig<TToken extends ModelToken> {
  attrs?: PartialModelAttrs<TToken>;
  collection?: DbCollection<InferTokenModel<TToken>>;
}

/**
 * Type for new model instance with accessors for the attributes (nullable id)
 * @template TToken - The model token
 */
export type NewModelInstance<TToken extends ModelToken> = Model<TToken> & {
  [K in keyof NewModelAttrs<TToken>]: NewModelAttrs<TToken>[K];
};

/**
 * Type for model instance with accessors for the attributes (required ID)
 * @template TToken - The model token
 */
export type ModelInstance<TToken extends ModelToken> = Model<TToken> & {
  [K in keyof ModelAttrs<TToken>]: ModelAttrs<TToken>[K];
} & {
  id: InferTokenModel<TToken>['id'];
};

/**
 * Type for model class with attribute accessors
 * @template TToken - The model token
 */
export type ModelClass<TToken extends ModelToken> = {
  new (config: ModelConfig<TToken>): NewModelInstance<TToken>;
};
