import type { FactoryTraitNames } from '@src/factory';
import type {
  CollectionNameFor,
  ModelAttrsFor,
  ModelNameFor,
  ModelRelationships,
  ModelTemplate,
  RelationshipsByTemplate,
} from '@src/model';
import type { CollectionConfig, SchemaCollections } from '@src/schema';

// ============================================================================
// SCHEMA LOOKUP HELPERS
// ============================================================================

/**
 * Extract the collection config for a model from the schema
 * @template TSchema - The schema collections type
 * @template TModel - The model template
 * @internal
 */
type CollectionConfigFor<
  TSchema extends SchemaCollections,
  TModel extends ModelTemplate,
> = TSchema[CollectionNameFor<TModel>];

/**
 * Extract the factory from a model's collection in the schema
 * @template TSchema - The schema collections type
 * @template TModel - The model template
 * @internal
 */
type FactoryFor<
  TSchema extends SchemaCollections,
  TModel extends ModelTemplate,
> =
  CollectionConfigFor<TSchema, TModel> extends CollectionConfig<
    any,
    any,
    infer TFactory,
    any
  >
    ? TFactory
    : undefined;

/**
 * Extract valid trait names for a model from the schema
 * @template TSchema - The schema collections type
 * @template TModel - The model template
 * @internal
 */
type TraitNamesFor<
  TSchema extends SchemaCollections,
  TModel extends ModelTemplate,
> = FactoryTraitNames<FactoryFor<TSchema, TModel>>;

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

/**
 * BelongsTo relationship - this model contains a foreign key to another model
 * Example: Post belongsTo User (Post has authorId pointing to User.id)
 * @template TTarget - The target model template this relationship points to
 * @template TForeign - The foreign key field name (defaults to "{targetModelName}Id")
 */
export type BelongsTo<
  TTarget extends ModelTemplate,
  TForeign extends string = `${ModelNameFor<TTarget>}Id`,
> = {
  foreignKey: TForeign;
  targetModel: TTarget;
  type: 'belongsTo';
  /**
   * The name of the inverse relationship on the target model.
   * - `undefined`: Auto-detect inverse relationship (default behavior)
   * - `string`: Explicit inverse relationship name
   * - `null`: No inverse relationship (disable synchronization)
   */
  inverse?: string | null;
  /**
   * The collection name to use for side-loading during serialization.
   * Defaults to targetModel.collectionName.
   */
  collectionName: string;
};

/**
 * HasMany relationship - this model can have multiple related models
 * Example: User hasMany Posts (User has postIds array containing Post.id values)
 * @template TTarget - The target model template this relationship points to
 * @template TForeign - The foreign key array field name (defaults to "{targetModelName}Ids")
 */
export type HasMany<
  TTarget extends ModelTemplate,
  TForeign extends string = `${ModelNameFor<TTarget>}Ids`,
> = {
  foreignKey: TForeign;
  targetModel: TTarget;
  type: 'hasMany';
  /**
   * The name of the inverse relationship on the target model.
   * - `undefined`: Auto-detect inverse relationship (default behavior)
   * - `string`: Explicit inverse relationship name
   * - `null`: No inverse relationship (disable synchronization)
   */
  inverse?: string | null;
  /**
   * The collection name to use for side-loading during serialization.
   * Defaults to targetModel.collectionName.
   */
  collectionName: string;
};

/**
 * All relationship types
 */
export type Relationships = BelongsTo<any, any> | HasMany<any, any>;

// ============================================================================
// FACTORY ASSOCIATION TYPES
// ============================================================================

/**
 * The type of factory association
 */
export type AssociationType = 'create' | 'createMany' | 'link' | 'linkMany';

// TODO: Need to replace these custom query types with DbRecordInput or QueryOptions
/**
 * Predicate function for filtering models in link/linkMany associations
 * @template TModel - The model type to filter
 */
export type AssociationQueryPredicate<TModel> = (model: TModel) => boolean;

/**
 * Query for finding models - can be an attributes object or a predicate function
 * @template TModel - The model type to query
 */
export type AssociationQuery<TModel = any> =
  | Partial<TModel>
  | AssociationQueryPredicate<TModel>;

/**
 * Runtime storage for traits and defaults passed to factory associations.
 * Type validation happens at the factory level through typed builder functions.
 */
export type AssociationTraitsAndDefaults = Array<string | Record<string, any>>;

/**
 * Type-safe traits and defaults for a specific model in a schema.
 * Validates trait names against the model's factory and ensures defaults match model attributes.
 * @template TSchema - The schema collections type
 * @template TModel - The model template
 */
export type TypedAssociationTraitsAndDefaults<
  TSchema extends SchemaCollections,
  TModel extends ModelTemplate,
> = Array<TraitNamesFor<TSchema, TModel> | Partial<ModelAttrsFor<TModel>>>;

/**
 * Base interface for all factory associations
 * @template TModel - The model template to associate
 */
export interface BaseAssociation<TModel extends ModelTemplate = ModelTemplate> {
  /** The type of association */
  type: AssociationType;
  /** The model template to create or link */
  model: TModel;
  /** Optional relationship name - can be inferred from the key in FactoryAssociations */
  relationshipName?: string;
  /** Traits and defaults to apply when creating the associated model */
  traitsAndDefaults?: AssociationTraitsAndDefaults;
}

/**
 * Association that always creates one new related model
 * @template TModel - The model template to create
 */
export interface CreateAssociation<TModel extends ModelTemplate = ModelTemplate>
  extends BaseAssociation<TModel> {
  type: 'create';
}

/**
 * Association that always creates N new related models
 * @template TModel - The model template to create
 */
export interface CreateManyAssociation<
  TModel extends ModelTemplate = ModelTemplate,
> extends BaseAssociation<TModel> {
  type: 'createMany';
  /** Number of models to create (for identical models) */
  count?: number;
  /** Array of traits/defaults for each model (for different models) */
  models?: AssociationTraitsAndDefaults[];
}

/**
 * Association that tries to find an existing model, or creates one if not found
 * @template TModel - The model template to link or create
 */
export interface LinkAssociation<TModel extends ModelTemplate = ModelTemplate>
  extends BaseAssociation<TModel> {
  type: 'link';
  /** Optional query to find existing models */
  query?: AssociationQuery;
}

/**
 * Association that tries to find N existing models, or creates more if needed
 * @template TModel - The model template to link or create
 */
export interface LinkManyAssociation<
  TModel extends ModelTemplate = ModelTemplate,
> extends BaseAssociation<TModel> {
  type: 'linkMany';
  /** Number of models to link */
  count: number;
  /** Optional query to find existing models */
  query?: AssociationQuery;
}

/**
 * Union of all factory association types
 * @template TModel - The model template
 */
export type Association<TModel extends ModelTemplate = ModelTemplate> =
  | CreateAssociation<TModel>
  | CreateManyAssociation<TModel>
  | LinkAssociation<TModel>
  | LinkManyAssociation<TModel>;

/**
 * Extract the target model template from a relationship
 * @template TRelationship - The relationship type (BelongsTo or HasMany)
 * @internal
 */
type RelationshipTargetTemplate<TRelationship> = TRelationship extends {
  targetModel: infer TTarget;
}
  ? TTarget extends ModelTemplate
    ? TTarget
    : never
  : never;

/**
 * Map of relationship names to factory associations for a model.
 * Keys are constrained to actual relationship names defined for the model.
 * Values must be associations for the correct target model of each relationship.
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 * @example
 * ```typescript
 * // Post has relationships: { author: BelongsTo<UserModel>, comments: HasMany<CommentModel> }
 * const associations: FactoryAssociations<typeof postModel, AppSchema> = {
 *   author: associations.create(userModel),      // ✓ Valid: author relationship exists
 *   comments: associations.createMany(commentModel, 3), // ✓ Valid: comments relationship exists
 *   tags: associations.link(tagModel)            // ✗ Error: no 'tags' relationship
 * }
 * ```
 */
export type FactoryAssociations<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> =
  RelationshipsByTemplate<TTemplate, TSchema> extends ModelRelationships
    ? {
        [K in keyof RelationshipsByTemplate<TTemplate, TSchema>]?: Association<
          RelationshipTargetTemplate<
            RelationshipsByTemplate<TTemplate, TSchema>[K]
          >
        >;
      }
    : {};

/**
 * Type-safe factory associations that validate traits and defaults against the schema.
 * This ensures trait names and default attributes are valid for each associated model.
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 */
export type TypedFactoryAssociations<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> = {
  [K in string]?:
    | CreateAssociation<any>
    | CreateManyAssociation<any>
    | LinkAssociation<any>
    | LinkManyAssociation<any>;
};
