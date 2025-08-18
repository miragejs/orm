import type { IdentityManager, StringIdentityManager, DbCollection } from '@src/db';
import type { Factory, TraitMap } from '@src/factory';
import type { ModelToken, InferTokenModel } from '@src/model';

export interface SchemaCollectionConfig<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
> {
  model: TToken;
  factory?: Factory<TToken, TTraits>;
  identityManager?: IdentityManager<InferTokenModel<TToken>['id']>;
  /** Skip serializer configuration until implemented */
  // serializer?: SerializerConfig;
}

/**
 * Global schema configuration
 */
export interface SchemaConfig<TIdentityManager extends IdentityManager = StringIdentityManager> {
  /** Default identity manager for collections that don't specify one (defaults to StringIdentityManager) */
  identityManager?: TIdentityManager;
  /** Skip serializer configuration until implemented */
  // serializer?: Serializer<any, any>;
}

/**
 * Maps schema collection configs to database collections
 */
export type InferDbCollections<TCollections extends Record<string, SchemaCollectionConfig<any, any>>> = {
  [K in keyof TCollections]: TCollections[K] extends SchemaCollectionConfig<infer TToken>
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
  TConfig extends SchemaCollectionConfig<any, any> = SchemaCollectionConfig<any, any>,
> = {
  [K in TName]: TConfig;
};

/**
 * Helper to merge multiple objects using intersection
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

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
