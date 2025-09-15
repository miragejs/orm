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

// -- TEMPLATE TYPES --

/**
 * Model template interface
 * @template TModel - The model attributes type
 * @template TModelName - The key/identifier for the model
 * @template TCollectionName - The collection name
 */
export interface ModelTemplate<
  TModel extends { id: any } = { id: any },
  TModelName extends string = string,
  TCollectionName extends string = string,
> {
  readonly key: symbol;
  readonly attrs: Partial<TModel>;
  readonly collectionName: TCollectionName;
  readonly modelName: TModelName;
}

// -- INFERENCE TEMPLATE TYPES --

export type InferTemplateModel<T> = T extends ModelTemplate<infer M, any, any> ? M : never;
export type InferTemplateId<T> = InferTemplateModel<T>['id'];
export type InferTemplateModelName<T> =
  T extends ModelTemplate<any, infer Name, any> ? Name : never;
export type InferTemplateCollectionName<T> =
  T extends ModelTemplate<any, any, infer Name> ? Name : never;
export type InferTemplateAttrs<T> = T extends ModelTemplate<any, any, any> ? T['attrs'] : never;

// -- ATTRIBUTE TYPES --

/**
 * Type for model id
 * @template TTemplate - The model template
 */
export type ModelId<TTemplate extends ModelTemplate> = InferTemplateId<TTemplate>;

/**
 * Type for full model attributes
 * @template TTemplate - The model template
 */
export type ModelAttrs<TTemplate extends ModelTemplate> = InferTemplateModel<TTemplate>;

/**
 * Type for new model attributes (allowing null id for unsaved models)
 * @template TTemplate - The model template
 */
export type NewModelAttrs<TTemplate extends ModelTemplate> = Omit<ModelAttrs<TTemplate>, 'id'> & {
  id: ModelAttrs<TTemplate>['id'] | null;
};

export type InitialModelAttrs<TTemplate extends ModelTemplate> = Omit<
  ModelAttrs<TTemplate>,
  'id'
> & {
  id?: ModelAttrs<TTemplate>['id'];
};

/**
 * Type for partial model attributes (all fields optional, id excluded)
 * @template TTemplate - The model template
 */
export type PartialModelAttrs<TTemplate extends ModelTemplate> = Partial<
  Omit<ModelAttrs<TTemplate>, 'id'>
>;

/**
 * Type for update method that includes attributes, foreign keys, and relationship model instances
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 */
export type ModelUpdateAttrs<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<TSchema, TTemplate>,
> =
  // Regular attributes (partial, excluding id)
  TRelationships extends ModelRelationships
    ? Partial<Omit<ModelAttrs<TTemplate>, 'id'>> & // Foreign key direct updates (e.g., authorId: "123", postIds: ["1", "2"])
        Partial<ModelForeignKeys<TRelationships>> &
        // Relationship model instance updates (e.g., author: userInstance, posts: [post1, post2])
        Partial<RelationshipUpdateValues<TRelationships, TSchema>>
    : Partial<Omit<ModelAttrs<TTemplate>, 'id'>>;

/**
 * Type for model attribute getters/setters
 * @template TTemplate - The model template
 */
export type ModelAttrAccessors<TTemplate extends ModelTemplate> = {
  [K in keyof Omit<ModelAttrs<TTemplate>, 'id'>]: ModelAttrs<TTemplate>[K];
};

// -- DEPTH COUNTER TO PREVENT INFINITE RECURSION FOR RELATIONSHIPS --
export type Depth = readonly unknown[];
type Next<T extends Depth> = readonly [unknown, ...T];
type MaxDepth = readonly [unknown, unknown, unknown, unknown, unknown];

// -- UTILITY TYPES --

/**
 * Utility type to convert union to intersection
 * @template U - The union type to convert
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

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
    /** The target model template that has the inverse relationship */
    targetModel: ModelTemplate;
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
 * @example { posts: HasMany<PostTemplate>, author: BelongsTo<UserTemplate, 'authorId'> }
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
 * Type for collection by template model
 * @template TSchema - The schema collections
 * @template TTemplate - The model template
 */
export type CollectionByTemplate<
  TSchema extends SchemaCollections,
  TTemplate extends ModelTemplate,
> = {
  [K in keyof TSchema]: InferTemplateModel<
    TSchema[K]['model']
  > extends InferTemplateModel<TTemplate>
    ? K
    : never;
}[keyof TSchema];

/**
 * Type for relationships by template model
 * @template TSchema - The schema collections
 * @template TTemplate - The model template
 */
export type RelationshipsByTemplate<
  TSchema extends SchemaCollections,
  TTemplate extends ModelTemplate,
> = TSchema[CollectionByTemplate<TSchema, TTemplate>]['relationships'] extends ModelRelationships
  ? TSchema[CollectionByTemplate<TSchema, TTemplate>]['relationships']
  : {}; // Default to empty object instead of using NonNullable

// -- MODEL CLASS TYPES --

/**
 * Type for new model instance with accessors for the attributes (nullable id)
 * @template TTemplate - The model template (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TDepth - The recursion depth counter (internal)
 */
export type NewModelInstance<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TDepth extends Depth = [],
> = Model<TTemplate, TSchema> &
  ModelAttrAccessors<TTemplate> &
  ModelForeignKeys<RelationshipsByTemplate<TSchema, TTemplate>> &
  ModelRelationshipAccessors<RelationshipsByTemplate<TSchema, TTemplate>, TSchema, TDepth>;

/**
 * Type for model instance with accessors for the attributes (required ID)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TTemplate - The model template
 * @template TRelationships - The relationships configuration
 * @template TDepth - The recursion depth counter (internal)
 */
export type ModelInstance<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TDepth extends Depth = [],
> = Model<TTemplate, TSchema> & {
  // Required id for saved models
  id: ModelId<TTemplate>;
} & ModelAttrAccessors<TTemplate> &
  ModelForeignKeys<RelationshipsByTemplate<TSchema, TTemplate>> &
  ModelRelationshipAccessors<RelationshipsByTemplate<TSchema, TTemplate>, TSchema, TDepth>;

/**
 * Configuration for creating a model
 * @template TTemplate - The model template (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TRelationships - The relationships configuration (inferred from usage)
 */
export interface ModelConfig<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> {
  attrs?: InitialModelAttrs<TTemplate>;
  dbCollection?: DbCollection<ModelAttrs<TTemplate>>;
  relationships?: RelationshipsByTemplate<TSchema, TTemplate>;
  schema?: SchemaInstance<TSchema>;
}

/**
 * Type for model class with attribute accessors
 * @template TTemplate - The model template (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TRelationships - The relationships configuration
 */
export type ModelClass<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> = {
  new (config: ModelConfig<TTemplate, TSchema>): NewModelInstance<TTemplate, TSchema>;
};
