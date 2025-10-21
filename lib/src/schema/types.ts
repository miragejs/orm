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
import type { SerializerOptions, StructuralSerializerOptions } from '@src/serializer';

import type Collection from './Collection';
import type { SchemaInstance } from './Schema';

/**
 * Seed function that accepts a schema instance
 * @template TSchema - The schema collections type
 */
export type SeedFunction<TSchema extends SchemaCollections = SchemaCollections> = (
  schema: SchemaInstance<TSchema>,
) => void | Promise<void>;

/**
 * Named seed scenarios - object with named seed methods
 * @template TSchema - The schema collections type
 */
export type SeedScenarios<TSchema extends SchemaCollections = SchemaCollections> = Record<
  string,
  SeedFunction<TSchema>
>;

/**
 * Seeds configuration - can be a function or object with named scenarios
 * @template TSchema - The schema collections type
 */
export type Seeds<TSchema extends SchemaCollections = SchemaCollections> =
  | SeedFunction<TSchema>
  | SeedScenarios<TSchema>;

/**
 * Global schema configuration
 * @template TIdentityManager - The identity manager type
 * @template TGlobalConfig - The global serializer configuration type
 */
export interface SchemaConfig<
  TIdentityManager extends IdentityManager = StringIdentityManager,
  TGlobalConfig extends StructuralSerializerOptions | undefined = undefined,
> {
  identityManager?: TIdentityManager;
  globalSerializerConfig?: TGlobalConfig;
}

/**
 * Type for collection config
 * @template TTemplate - The model template
 * @template TRelationships - The model relationships
 * @template TFactory - The factory type
 * @template TSerializer - The serializer instance type
 * @template TSchema - The schema collections type for seeds typing
 */
export interface CollectionConfig<
  TTemplate extends ModelTemplate,
  TRelationships extends ModelRelationships = {},
  TFactory extends Factory<TTemplate, any, any> | undefined = undefined,
  TSerializer = undefined,
  TSchema extends SchemaCollections = SchemaCollections,
> {
  model: TTemplate;
  factory?: TFactory;
  relationships?: TRelationships;
  identityManager?: IdentityManager<ModelId<TTemplate>>;
  /**
   * Serializer configuration object (attrs, root, embed, include)
   * Used when collection().serializer({...config}) is called
   */
  serializerConfig?: SerializerOptions<TTemplate>;
  /**
   * Serializer instance (custom serializer class)
   * Used when collection().serializer(instance) is called
   */
  serializerInstance?: TSerializer;
  /**
   * Seeds configuration - can be a function or object with named scenarios
   * Used when collection().seeds(...) is called
   */
  seeds?: Seeds<TSchema>;
}

/**
 * Type for schema collections - provides both string-based property access and symbol-based relationship resolution
 * @template TCollections - The string-keyed schema collections config
 */
export type SchemaCollections = Record<string, CollectionConfig<any, any, any, any, any>>;

/**
 * Type for schema collections - provides string-based property access
 * @template TCollections - The string-keyed schema collections config
 */
export type SchemaCollectionAccessors<TCollections extends SchemaCollections> = {
  [K in keyof TCollections]: TCollections[K] extends CollectionConfig<
    infer TTemplate,
    infer TRelationships,
    infer TFactory,
    infer TSerializer,
    any
  >
    ? Collection<TCollections, TTemplate, TRelationships, TFactory, TSerializer>
    : never;
};

/**
 * Maps schema collection configs to database collections with inferred foreign keys
 * This ensures that database records include foreign key fields based on defined relationships
 */
export type SchemaDbCollections<TCollections extends SchemaCollections> = {
  [K in keyof TCollections]: TCollections[K] extends CollectionConfig<
    infer TTemplate,
    infer TRelationships,
    any,
    any,
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
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<TTemplate, TSchema>,
> = Partial<ModelAttrs<TTemplate, TSchema>> &
  (Record<string, never> extends TRelationships
    ? {}
    : Partial<RelatedModelAttrs<TSchema, TRelationships>>);
