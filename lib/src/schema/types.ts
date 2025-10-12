import type { DbCollection } from '@src/db';
import type { Factory } from '@src/factory';
import type { IdentityManager, StringIdentityManager } from '@src/id-manager';
import type {
  ModelAttrs,
  ModelForeignKeys,
  ModelId,
  ModelTemplate,
  RelatedModelAttrs,
  RelationshipsByTemplate,
} from '@src/model';
import type { ModelRelationships } from '@src/model';

import type SchemaCollection from './SchemaCollection';

/**
 * Global schema configuration
 */
export interface SchemaConfig<TIdentityManager extends IdentityManager = StringIdentityManager> {
  identityManager?: TIdentityManager;
}

/**
 * Type for schema collection config
 * @template TTemplate - The model template
 * @template TRelationships - The model relationships
 * @template TFactory - The factory type
 */
export interface SchemaCollectionConfig<
  TTemplate extends ModelTemplate<any, any, any>,
  TRelationships extends ModelRelationships = {},
  TFactory extends Factory<TTemplate, any, any> | undefined = undefined,
> {
  model: TTemplate;
  factory?: TFactory;
  relationships?: TRelationships;
  identityManager?: IdentityManager<ModelId<TTemplate>>;
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
    infer TTemplate,
    infer TRelationships,
    infer TFactory
  >
    ? SchemaCollection<TCollections, TTemplate, TRelationships, TFactory>
    : never;
};

/**
 * Maps schema collection configs to database collections with inferred foreign keys
 * This ensures that database records include foreign key fields based on defined relationships
 */
export type SchemaDbCollections<TCollections extends SchemaCollections> = {
  [K in keyof TCollections]: TCollections[K] extends SchemaCollectionConfig<
    infer TTemplate,
    infer TRelationships,
    any
  >
    ? DbCollection<
        ModelAttrs<TTemplate> &
          (TRelationships extends ModelRelationships ? ModelForeignKeys<TRelationships> : {})
      >
    : never;
};

/**
 * Type for collection create/factory inputs - all attributes are optional
 * Used for passing attributes to create() methods where factory provides defaults
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 * @template TRelationships - The model relationships
 */
export type CollectionCreateInput<
  TTemplate extends ModelTemplate<any, any, any>,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<TTemplate, TSchema>,
> = Partial<ModelAttrs<TTemplate, TSchema>> &
  (keyof TRelationships extends never ? {} : Partial<RelatedModelAttrs<TSchema, TRelationships>>);
