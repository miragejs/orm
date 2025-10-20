import type { BelongsTo, HasMany, Relationships } from '@src/associations';
import type { CollectionConfig, SchemaCollections, SchemaInstance } from '@src/schema';

import type BaseModel from './BaseModel';
import type Model from './Model';
import type ModelCollection from './ModelCollection';

// ============================================================================
// CORE TEMPLATE TYPES
// ============================================================================

export type DefaultModelAttrs = { id: string };

/**
 * Model template interface with hidden type properties
 *
 * This interface uses only 2 generics for clean type signatures,
 * while storing additional type metadata in hidden properties (__attrs, __json).
 * These hidden properties exist only in TypeScript's type system with zero runtime cost.
 *
 * @template TModelName - The string literal type for the model name
 * @template TCollectionName - The string literal type for the collection name
 */
export interface ModelTemplate<
  TModelName extends string = string,
  TCollectionName extends string = string,
> {
  readonly key: symbol;
  readonly modelName: TModelName;
  readonly collectionName: TCollectionName;

  // Hidden type properties (compile-time only, no runtime cost)
  readonly __attrs: { id: any }; // Type metadata for model attributes
  readonly __json: {
    readonly model: any; // Type metadata for serialized model
    readonly collection: any; // Type metadata for serialized collection
  };
}

// ============================================================================
// TEMPLATE INFERENCE UTILITIES
// ============================================================================

/**
 * Infer model attributes from template
 * @template T - The model template
 */
export type InferModelAttrs<T> = T extends ModelTemplate<any, any> ? T['__attrs'] : never;

/**
 * Infer model ID type from template
 * @template T - The model template
 */
export type ModelId<T> = InferModelAttrs<T>['id'];

/**
 * Infer model name from template
 * @template T - The model template
 */
export type InferModelName<T> = T extends ModelTemplate<infer Name, any> ? Name : never;

/**
 * Infer collection name from template
 * @template T - The model template
 */
export type InferCollectionName<T> = T extends ModelTemplate<any, infer Name> ? Name : never;

/**
 * Infer serialized model type from template
 * @template T - The model template
 */
export type InferSerializedModel<T> =
  T extends ModelTemplate<any, any> ? T['__json']['model'] : never;

/**
 * Infer serialized collection type from template
 * @template T - The model template
 */
export type InferSerializedCollection<T> =
  T extends ModelTemplate<any, any> ? T['__json']['collection'] : never;

/**
 * Check if template has custom JSON types (not default)
 * @template T - The model template
 */
export type HasCustomJSON<T extends ModelTemplate> =
  InferSerializedModel<T> extends InferModelAttrs<T> ? false : true;

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

/**
 * Pending relationship operation type
 */
export interface PendingRelationshipOperation {
  relationshipName: string; // The relationship name
  unlink: boolean; // Should we unlink the old relationship?
  link: boolean; // Should we link the new relationship?
  value?: unknown; // The relationship value (for linking or unlinking)
}

/**
 * Model relationships configuration object
 * @example { posts: HasMany<PostTemplate>, author: BelongsTo<UserTemplate, 'authorId'> }
 */
export type ModelRelationships = Record<string, Relationships>;

/**
 * Type for foreign key values - either a single ID or array of IDs
 */
export type ForeignKeyValue = string | number | string[] | number[] | null | undefined;

/**
 * Result of a relationship operation (link/unlink)
 * Contains foreign key updates for the current model
 */
export interface RelationshipUpdateResult {
  /** Foreign key updates to apply to the current model */
  foreignKeyUpdates: Record<string, ForeignKeyValue>;
}

/**
 * Internal relationship definition with inverse relationship information
 * Used internally by Model to track bidirectional relationships
 * @template TRelationship - The specific relationship type
 */
export interface RelationshipDef<TRelationship extends Relationships = Relationships> {
  /** The original relationship configuration */
  relationship: TRelationship;
  /** The inverse relationship information, if it exists */
  inverse?: {
    /** The foreign key used by the inverse relationship */
    foreignKey: string;
    /** The name of the inverse relationship in the target model */
    relationshipName: string;
    /** The target model template that has the inverse relationship */
    targetModel: ModelTemplate;
    /** The type of the inverse relationship */
    type: 'belongsTo' | 'hasMany';
  };
}

/**
 * Relationship definitions for internal use by Model class
 * Maps relationship names to their definitions including inverse information
 * Preserves specific relationship types from the input relationships configuration
 * @template TRelationships - The model relationships configuration
 * @example
 * // Input: { posts: HasMany<PostTemplate>, author: BelongsTo<UserTemplate> }
 * // Output: {
 * //   posts: RelationshipDef<HasMany<PostTemplate>>,
 * //   author: RelationshipDef<BelongsTo<UserTemplate>>
 * // }
 */
export type RelationshipDefs<TRelationships extends ModelRelationships = ModelRelationships> = {
  [K in keyof TRelationships]: RelationshipDef<TRelationships[K]>;
};

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
  K extends keyof TRelationships = keyof TRelationships,
> =
  TRelationships[K] extends BelongsTo<infer TTarget, any>
    ? ModelInstance<TTarget, TSchema> | null
    : TRelationships[K] extends HasMany<infer TTarget, any>
      ? ModelCollection<TTarget, TSchema> | ModelInstance<TTarget, TSchema>[] | null
      : never;

/**
 * Type for collection by template model
 * @template TSchema - The schema collections
 * @template TTemplate - The model template
 */
export type CollectionByTemplate<
  TSchema extends SchemaCollections,
  TTemplate extends ModelTemplate,
> = {
  [K in keyof TSchema]: TSchema[K] extends CollectionConfig<infer TModel, any, any>
    ? TModel extends TTemplate
      ? K
      : never
    : never;
}[keyof TSchema];

/**
 * Type for relationships by template model
 * @template TSchema - The schema collections
 * @template TTemplate - The model template
 */
export type RelationshipsByTemplate<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections,
> =
  TSchema[CollectionByTemplate<TSchema, TTemplate>] extends CollectionConfig<
    any,
    infer TRelationships,
    any,
    any
  >
    ? TRelationships extends ModelRelationships
      ? TRelationships
      : {}
    : {};

// ============================================================================
// FOREIGN KEY TYPES
// ============================================================================

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
  TRelationships extends never
    ? {}
    : BelongsToForeignKeys<TRelationships> & HasManyForeignKeys<TRelationships>;

// ============================================================================
// RELATIONSHIP ACCESSOR TYPES
// ============================================================================

/**
 * Type for related model
 * @template TSchema - The schema collections
 * @template TRelationship - The relationship
 */
type RelatedModel<TSchema extends SchemaCollections, TRelationship extends Relationships> =
  TRelationship extends BelongsTo<infer TTarget, any>
    ? ModelInstance<TTarget, TSchema> | null
    : TRelationship extends HasMany<infer TTarget, any>
      ? ModelCollection<TTarget, TSchema>
      : never;

export type RelatedModelAttrs<
  TSchema extends SchemaCollections,
  TRelationships extends ModelRelationships,
> = TRelationships extends ModelRelationships
  ? {
      [K in keyof TRelationships]: TRelationships[K] extends BelongsTo<infer TTarget, any>
        ? ModelInstance<TTarget, TSchema> | null
        : TRelationships[K] extends HasMany<infer TTarget, any>
          ? ModelCollection<TTarget, TSchema> | ModelInstance<TTarget, TSchema>[]
          : never;
    }
  : {};

export type ForeignKeyAttrs<TRelationships extends ModelRelationships> = Partial<
  ModelForeignKeys<TRelationships>
>;

/**
 * Infer relationship accessor properties that can be updated
 * @template TSchema - The schema collections
 * @template TRelationships - The relationships configuration
 */
export type ModelRelationshipAccessors<
  TSchema extends SchemaCollections,
  TRelationships extends ModelRelationships,
> = keyof TRelationships extends never
  ? {}
  : {
      [K in keyof TRelationships]: RelatedModel<TSchema, TRelationships[K]>;
    };

// ============================================================================
// BASE MODEL TYPES
// ============================================================================

/**
 * Type for base model attributes (allowing null id for unsaved models)
 * @template TTemplate - The model template
 */
export type NewModelAttrs<TAttrs extends { id: any }> =
  | TAttrs
  | (Omit<TAttrs, 'id'> & {
      id?: TAttrs['id'] | null;
    });

/**
 * Type for new base model instance with nullable ID
 * @template TAttrs - The model attributes type
 * @template TSerializer - The serializer type
 */
export type NewBaseModelInstance<TAttrs extends { id: any }, TSerializer = undefined> = BaseModel<
  TAttrs,
  TSerializer
> & {
  attrs: NewModelAttrs<TAttrs>;
  id: TAttrs['id'] | null;
};

/**
 * Type for base model instance with required ID
 * @template TAttrs - The model attributes type
 * @template TSerializer - The serializer type
 */
export type BaseModelInstance<TAttrs extends { id: any }, TSerializer = undefined> = BaseModel<
  TAttrs,
  TSerializer
> & {
  attrs: TAttrs;
  id: TAttrs['id'];
};

// ============================================================================
// ATTRIBUTE TYPES
// ============================================================================

/**
 * Type for model attribute getters/setters
 * @template TTemplate - The model template
 */
export type ModelAttrAccessors<TTemplate extends ModelTemplate> = {
  [K in keyof Omit<InferModelAttrs<TTemplate>, 'id'>]: InferModelAttrs<TTemplate>[K];
};

/**
 * Type for model attributes that includes regular attributes, foreign keys, and relationship model instances
 * Only relationship-related properties are optional
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 */
export type ModelAttrs<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<TTemplate, TSchema>,
> = Omit<InferModelAttrs<TTemplate>, 'id'> &
  ModelForeignKeys<TRelationships> & {
    id: ModelId<TTemplate>;
  };

/**
 * Type for partial model attributes
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 */
export type PartialModelAttrs<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> = Partial<ModelAttrs<TTemplate, TSchema>>;

/**
 * Type for constructor attributes that includes regular attributes and relationship model instances
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 */
export type ModelCreateAttrs<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<TTemplate, TSchema>,
> = Omit<InferModelAttrs<TTemplate>, 'id'> & {
  id?: ModelId<TTemplate> | null;
} & (Record<string, never> extends TRelationships
    ? {}
    : ForeignKeyAttrs<TRelationships> & Partial<RelatedModelAttrs<TSchema, TRelationships>>);

/**
 * Type for update method that includes attributes, foreign keys, and relationship model instances
 * All properties are optional for updates
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 */
export type ModelUpdateAttrs<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<TTemplate, TSchema>,
> = Partial<ModelAttrs<TTemplate, TSchema, TRelationships>> &
  (Record<string, never> extends TRelationships
    ? {}
    : Partial<RelatedModelAttrs<TSchema, TRelationships>>);

// ============================================================================
// SCHEMA-AWARE MODEL TYPES
// ============================================================================

/**
 * Configuration for creating a schema-aware model
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 * @template TRelationships - The model relationships
 * @template TSerializer - The serializer type
 */
export type ModelConfig<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<TTemplate, TSchema>,
  TSerializer = undefined,
> = {
  attrs: ModelCreateAttrs<TTemplate, TSchema, TRelationships>;
  schema: SchemaInstance<TSchema>;
  serializer?: TSerializer;
} & (Record<string, never> extends TRelationships
  ? { relationships?: undefined }
  : { relationships: TRelationships });

/**
 * Type for model class with attribute accessors (direct Model constructor)
 * @template TTemplate - The model template (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TSerializer - The serializer type
 */
export type ModelClass<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TSerializer = undefined,
> = {
  new (
    config: ModelConfig<
      TTemplate,
      TSchema,
      RelationshipsByTemplate<TTemplate, TSchema>,
      TSerializer
    >,
  ): NewModelInstance<TTemplate, TSchema, TSerializer>;
};

/**
 * Type for new model instance with accessors for the attributes (nullable id)
 * @template TTemplate - The model template (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TSerializer - The serializer type
 */
export type NewModelInstance<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TSerializer = undefined,
> = Model<TTemplate, TSchema, TSerializer> & {
  attrs: ModelAttrs<TTemplate, TSchema>;
  id: ModelAttrs<TTemplate, TSchema>['id'] | null;
} & ModelAttrAccessors<TTemplate> &
  ModelForeignKeys<RelationshipsByTemplate<TTemplate, TSchema>> &
  ModelRelationshipAccessors<TSchema, RelationshipsByTemplate<TTemplate, TSchema>>;

/**
 * Type for model instance with accessors for the attributes (required ID)
 * @template TTemplate - The model template (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TSerializer - The serializer type
 */
export type ModelInstance<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TSerializer = undefined,
> = Model<TTemplate, TSchema, TSerializer> & {
  attrs: ModelAttrs<TTemplate, TSchema>;
  id: ModelAttrs<TTemplate, TSchema>['id'];
} & ModelAttrAccessors<TTemplate> &
  ModelForeignKeys<RelationshipsByTemplate<TTemplate, TSchema>> &
  ModelRelationshipAccessors<TSchema, RelationshipsByTemplate<TTemplate, TSchema>>;

// ============================================================================
// STATUS TYPES
// ============================================================================

/**
 * Model status type
 */
export type ModelStatus = 'new' | 'saved';
