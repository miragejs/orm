import type { BelongsTo, HasMany, Relationships } from '@src/associations';
import type { DbCollection } from '@src/db';
import type { IdType } from '@src/id-manager';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

import type Model from './Model';
import type ModelCollection from './ModelCollection';

/**
 * Base model attributes type
 */
export type BaseModelAttrs<TId extends IdType> = {
  [key: string]: any;
  id: TId;
};

// -- Token Types --

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

// -- ATTRIBUTE TYPES --

/**
 * Type for model id
 * @template TToken - The model token
 */
export type ModelId<TToken extends ModelToken> = InferTokenId<TToken>;

/**
 * Type for full model attributes
 * @template TToken - The model token
 */
export type ModelAttrs<TToken extends ModelToken> = InferTokenModel<TToken>;

/**
 * Type for new model attributes (allowing null id for unsaved models)
 * @template TToken - The model token
 */
export type NewModelAttrs<TToken extends ModelToken> = Omit<ModelAttrs<TToken>, 'id'> & {
  id: ModelAttrs<TToken>['id'] | null;
};

/**
 * Type for partial model attributes (all fields optional, id excluded)
 * @template TToken - The model token
 */
export type PartialModelAttrs<TToken extends ModelToken> = Partial<Omit<ModelAttrs<TToken>, 'id'>>;

/**
 * Type for update method that includes attributes, foreign keys, and relationship model instances
 * @template TToken - The model token
 * @template TSchema - The schema collections type
 */
export type ModelUpdateAttrs<
  TToken extends ModelToken,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByToken<TSchema, TToken>,
> =
  // Regular attributes (partial, excluding id)
  TRelationships extends ModelRelationships
    ? Partial<Omit<ModelAttrs<TToken>, 'id'>> & // Foreign key direct updates (e.g., authorId: "123", postIds: ["1", "2"])
        Partial<ModelForeignKeys<TRelationships>> &
        // Relationship model instance updates (e.g., author: userInstance, posts: [post1, post2])
        Partial<RelationshipUpdateValues<TRelationships, TSchema>>
    : Partial<Omit<ModelAttrs<TToken>, 'id'>>;

/**
 * Type for model attribute getters/setters
 * @template TToken - The model token
 */
export type ModelAttrAccessors<TToken extends ModelToken> = {
  [K in keyof Omit<ModelAttrs<TToken>, 'id'>]: ModelAttrs<TToken>[K];
};

export type SerializedModel<TToken extends ModelToken> = InferTokenSerializedModel<TToken>;

// -- DEPTH COUNTER TO PREVENT INFINITE RECURSION FOR RELATIONSHIPS --
export type Depth = readonly unknown[];
type Next<T extends Depth> = readonly [unknown, ...T];
type MaxDepth = readonly [unknown, unknown, unknown, unknown, unknown];

// -- RELATIONSHIP TYPES --

/**
 * Internal relationship definition with inverse relationship information
 * Used internally by Model to track bidirectional relationships
 */
export interface RelationshipDef {
  /** The original relationship configuration */
  relationship: Relationships;
  /** The inverse relationship information, if it exists */
  inverse?: {
    /** The target model token that has the inverse relationship */
    targetToken: ModelToken;
    /** The name of the inverse relationship in the target model */
    relationshipName: string;
    /** The type of the inverse relationship */
    type: 'belongsTo' | 'hasMany';
    /** The foreign key used by the inverse relationship */
    foreignKey: string;
  };
}

/**
 * Parsed relationship definitions for internal use by Model class
 * Maps relationship names to their definitions including inverse information
 */
export type RelationshipDefs = Record<string, RelationshipDef>;

/**
 * Model relationships configuration object
 * @example { posts: HasMany<PostToken>, author: BelongsTo<UserToken, 'authorId'> }
 */
export type ModelRelationships = Record<string, Relationships>;

/**
 * Extract foreign key properties for BelongsTo relationships
 * @template TRelationships - The relationships configuration object
 */
type BelongsToForeignKeys<TRelationships extends ModelRelationships> = UnionToIntersection<
  {
    [K in keyof TRelationships]: TRelationships[K] extends BelongsTo<infer TTarget, infer TForeign>
      ? { [FK in NonNullable<TForeign>]: ModelId<TTarget> | null }
      : never;
  }[keyof TRelationships]
>;

/**
 * Extract foreign key properties for HasMany relationships
 * @template TRelationships - The relationships configuration object
 */
type HasManyForeignKeys<TRelationships extends ModelRelationships> = UnionToIntersection<
  {
    [K in keyof TRelationships]: TRelationships[K] extends HasMany<infer TTarget, infer TForeign>
      ? { [FK in NonNullable<TForeign>]: ModelId<TTarget>[] }
      : never;
  }[keyof TRelationships]
>;

/**
 * Infer foreign key properties from relationships configuration
 * Creates properties like: authorId: string | null, postIds: string[]
 * @template TRelationships - The relationships configuration object
 */
export type ModelForeignKeys<TRelationships extends ModelRelationships> =
  keyof TRelationships extends never
    ? {}
    : BelongsToForeignKeys<TRelationships> & HasManyForeignKeys<TRelationships>;

/**
 * Extract relationship names from relationships type
 * @template TRelationships - The relationships type
 */
export type RelationshipNames<TRelationships extends ModelRelationships> = keyof TRelationships;

/**
 * Extract the target model instance type for a specific relationship
 * @template TSchema - The schema collections type
 * @template TRelationships - The relationships type
 * @template K - The relationship name
 */
export type RelationshipTargetModel<
  TSchema extends SchemaCollections,
  TRelationships extends ModelRelationships,
  K extends keyof TRelationships,
> =
  TRelationships[K] extends BelongsTo<infer TTarget, any>
    ? ModelInstance<TTarget, TSchema> | null
    : TRelationships[K] extends HasMany<infer TTarget, any>
      ? ModelInstance<TTarget, TSchema> | ModelInstance<TTarget, TSchema>[] | null
      : never;

/**
 * Type for relationship update values in the update method
 * @template TRelationships - The relationships configuration
 * @template TSchema - The schema collections type
 */
export type RelationshipUpdateValues<
  TRelationships extends ModelRelationships,
  TSchema extends SchemaCollections,
> = keyof TRelationships extends never
  ? {}
  : {
      [K in keyof TRelationships]: TRelationships[K] extends BelongsTo<infer TTarget, any>
        ? ModelInstance<TTarget, TSchema> | null
        : TRelationships[K] extends HasMany<infer TTarget, any>
          ? ModelInstance<TTarget, TSchema>[] | ModelCollection<TTarget, TSchema> | null
          : never;
    };

/**
 * Type for related model
 * @template TSchema - The schema collections
 * @template TRelationship - The relationship
 * @template TDepth - The depth
 */
type RelatedModel<
  TSchema extends SchemaCollections,
  TRelationship extends Relationships,
  TDepth extends Depth = [],
> = TDepth extends MaxDepth
  ? any // Stop recursion at max depth
  : TRelationship extends BelongsTo<infer TTarget, any>
    ? ModelInstance<TTarget, TSchema, Next<TDepth>> | null
    : TRelationship extends HasMany<infer TTarget, any>
      ? ModelCollection<TTarget, TSchema, Next<TDepth>>
      : never;

/**
 * Infer relationship accessor properties that can be updated
 * @template TSchema - The schema collections
 * @template TRelationships - The relationships configuration
 * @template TDepth - The recursion depth counter (internal)
 */
export type ModelRelationshipAccessors<
  TRelationships extends ModelRelationships,
  TSchema extends SchemaCollections,
  TDepth extends Depth = [],
> = keyof TRelationships extends never
  ? {}
  : {
      [K in keyof TRelationships]: RelatedModel<TSchema, TRelationships[K], TDepth>;
    };

/**
 * Type for collection by token model
 * @template TSchema - The schema collections
 * @template TToken - The model token
 */
export type CollectionByToken<TSchema extends SchemaCollections, TToken extends ModelToken> = {
  [K in keyof TSchema]: InferTokenModel<TSchema[K]['model']> extends InferTokenModel<TToken>
    ? K
    : never;
}[keyof TSchema];

/**
 * Type for relationships by token model
 * @template TSchema - The schema collections
 * @template TToken - The model token
 */
export type RelationshipsByToken<
  TSchema extends SchemaCollections,
  TToken extends ModelToken,
> = TSchema[CollectionByToken<TSchema, TToken>]['relationships'] extends ModelRelationships
  ? TSchema[CollectionByToken<TSchema, TToken>]['relationships']
  : {}; // Default to empty object instead of using NonNullable

// -- MODEL CLASS TYPES --

/**
 * Type for new model instance with accessors for the attributes (nullable id)
 * @template TToken - The model token (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TDepth - The recursion depth counter (internal)
 */
export type NewModelInstance<
  TToken extends ModelToken,
  TSchema extends SchemaCollections = SchemaCollections,
  TDepth extends Depth = [],
> = Model<TToken, TSchema> &
  ModelAttrAccessors<TToken> &
  ModelForeignKeys<RelationshipsByToken<TSchema, TToken>> &
  ModelRelationshipAccessors<RelationshipsByToken<TSchema, TToken>, TSchema, TDepth>;

/**
 * Type for model instance with accessors for the attributes (required ID)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TToken - The model token
 * @template TRelationships - The relationships configuration
 * @template TDepth - The recursion depth counter (internal)
 */
export type ModelInstance<
  TToken extends ModelToken,
  TSchema extends SchemaCollections,
  TDepth extends Depth = [],
> = Model<TToken, TSchema> & {
  // Required id for saved models
  id: ModelId<TToken>;
} & ModelAttrAccessors<TToken> &
  ModelForeignKeys<RelationshipsByToken<TSchema, TToken>> &
  ModelRelationshipAccessors<RelationshipsByToken<TSchema, TToken>, TSchema, TDepth>;

/**
 * Configuration for creating a model
 * @template TToken - The model token (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TRelationships - The relationships configuration (inferred from usage)
 */
export interface ModelConfig<
  TToken extends ModelToken,
  TSchema extends SchemaCollections = SchemaCollections,
> {
  attrs?: PartialModelAttrs<TToken>;
  collection?: DbCollection<InferTokenModel<TToken>>;
  relationships?: RelationshipsByToken<TSchema, TToken>;
  schema?: SchemaInstance<TSchema>;
}

/**
 * Type for model class with attribute accessors
 * @template TToken - The model token (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TRelationships - The relationships configuration
 */
export type ModelClass<
  TToken extends ModelToken,
  TSchema extends SchemaCollections = SchemaCollections,
> = {
  new (config: ModelConfig<TToken, TSchema>): NewModelInstance<TToken, TSchema>;
};
