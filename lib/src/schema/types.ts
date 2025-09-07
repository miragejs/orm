import type { DbCollection } from '@src/db';
import type { Factory, ModelTraits } from '@src/factory';
import type { IdentityManager, StringIdentityManager } from '@src/id-manager';
import type { ModelToken, InferTokenModel, InferTokenId, InferTokenModelName } from '@src/model';
import type { ModelRelationships } from '@src/model';

import type SchemaCollection from './SchemaCollection';

/**
 * Type for schema collection config
 * @template TToken - The model token
 * @template TRelationships - The model relationships
 * @template TTraits - The model traits
 */
export interface SchemaCollectionConfig<
  TToken extends ModelToken,
  TRelationships extends ModelRelationships | undefined = undefined,
  TTraits extends ModelTraits<TToken, TRelationships> = ModelTraits<TToken, TRelationships>,
> {
  model: TToken;
  factory?: Factory<TToken, TRelationships, TTraits>;
  relationships?: TRelationships;
  identityManager?: IdentityManager<InferTokenId<TToken>>;
}

/**
 * Global schema configuration
 */
export interface SchemaConfig<TIdentityManager extends IdentityManager = StringIdentityManager> {
  identityManager?: TIdentityManager;
}

/**
 * Type for schema collections - provides both string-based property access and symbol-based relationship resolution
 * @template TCollections - The string-keyed schema collections config
 */
export type SchemaCollections = Record<string, SchemaCollectionConfig<any, any, any>>;

/**
 * Type for schema collections - provides string-based property access
 * @template TCollections - The string-keyed schema collections config
 */
export type SchemaCollectionAccessors<TCollections extends SchemaCollections> = {
  [K in keyof TCollections]: TCollections[K] extends SchemaCollectionConfig<
    infer TToken,
    infer TRelationships,
    infer TTraits
  >
    ? SchemaCollection<TCollections, TToken, TRelationships, TTraits>
    : never;
};

/**
 * Maps schema collection configs to database collections
 */
export type SchemaDbCollections<TCollections extends SchemaCollections> = {
  [K in keyof TCollections]: TCollections[K] extends SchemaCollectionConfig<infer TToken, any, any>
    ? DbCollection<InferTokenModel<TToken>>
    : never;
};

// -- COLLECTION UTILITIES TYPES --

/**
 * Represents a single collection module with a collection name as key
 * @template TName - The collection name
 * @template TConfig - The collection configuration
 */
export type CollectionModule<
  TName extends string = string,
  TConfig extends SchemaCollectionConfig<any, any, any> = SchemaCollectionConfig<any, any, any>,
> = {
  [K in TName]: TConfig;
};

/**
 * Converts an array of collection modules to a union of their types
 */
type CollectionModulesToUnion<T extends readonly CollectionModule[]> = T[number];

/**
 * Merges an array of collection modules into a single collections object
 */
export type ComposeCollections<T extends readonly CollectionModule[]> = UnionToIntersection<
  CollectionModulesToUnion<T>
>;
