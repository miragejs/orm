import type { DbCollection } from '@src/db';
import type { Factory } from '@src/factory';
import type {
  IdentityManager,
  IdentityManagerConfig,
  IdType,
} from '@src/id-manager';
import type {
  ModelAttrs,
  ModelForeignKeys,
  ModelIdFor,
  ModelTemplate,
  RelatedModelAttrs,
  RelationshipsByTemplate,
} from '@src/model';
import type { ModelRelationships } from '@src/model';
import type { Serializer, SerializerConfig } from '@src/serializer';
import type { LoggerConfig } from '@src/utils';

import type Collection from './Collection';
import type { SchemaInstance } from './Schema';

/**
 * Seed function that accepts a schema instance
 * @template TSchema - The schema collections type
 */
export type SeedFunction<
  TSchema extends SchemaCollections = SchemaCollections,
> = (schema: SchemaInstance<TSchema>) => void | Promise<void>;

/**
 * Named seed scenarios - object with named seed methods
 * @template TSchema - The schema collections type
 */
export type SeedScenarios<
  TSchema extends SchemaCollections = SchemaCollections,
> = Record<string, SeedFunction<TSchema>>;

/**
 * Seeds configuration - can be a function or object with named scenarios
 * @template TSchema - The schema collections type
 */
export type Seeds<TSchema extends SchemaCollections = SchemaCollections> =
  | SeedFunction<TSchema>
  | SeedScenarios<TSchema>;

/**
 * Strategy for loading fixtures
 * - 'auto': Load fixtures automatically during schema setup
 * - 'manual': Load fixtures manually by calling loadFixtures()
 */
export type FixtureLoadStrategy = 'auto' | 'manual';

/**
 * A single fixture attributes object - matches the model attributes with optional foreign keys
 * @template TTemplate - The model template
 * @template TRelationships - The model relationships
 */
export type FixtureAttrs<
  TTemplate extends ModelTemplate,
  TRelationships extends ModelRelationships = {},
> = ModelAttrs<TTemplate> &
  (Record<string, never> extends TRelationships
    ? {}
    : Partial<ModelForeignKeys<TRelationships, TTemplate>>);

/**
 * Fixture configuration for a collection
 * @template TTemplate - The model template
 * @template TRelationships - The model relationships
 */
export interface FixtureConfig<
  TTemplate extends ModelTemplate,
  TRelationships extends ModelRelationships = {},
> {
  /**
   * Array of fixture attributes to load
   */
  records: FixtureAttrs<TTemplate, TRelationships>[];
  /**
   * When to load the fixtures (default: 'manual')
   */
  strategy?: FixtureLoadStrategy;
}

/**
 * Global schema configuration
 * @template TIdType - The default ID type for collections (inferred from identityManager.initialCounter)
 */
export interface SchemaConfig<TIdType extends IdType = string> {
  /**
   * Default identity manager configuration for all collections.
   * Individual collections can override this with their own configuration.
   */
  identityManager?: IdentityManagerConfig<TIdType>;
  logging?: LoggerConfig;
}

/**
 * Type for collection config
 * @template TTemplate - The model template
 * @template TRelationships - The model relationships
 * @template TFactory - The factory type
 * @template TSchema - The schema collections type for seeds typing
 */
export interface CollectionConfig<
  TTemplate extends ModelTemplate,
  TRelationships extends ModelRelationships = {},
  TFactory extends Factory<TTemplate, any, any> = Factory<
    TTemplate,
    string,
    SchemaCollections
  >,
  TSchema extends SchemaCollections = SchemaCollections,
  TSerializer extends Serializer<TTemplate, TSchema> = Serializer<
    TTemplate,
    TSchema
  >,
> {
  model: TTemplate;
  factory?: TFactory;
  relationships?: TRelationships;
  /**
   * Identity manager configuration or instance for this collection.
   * Can be either an IdentityManagerConfig object or an IdentityManager instance.
   * The ID type must match the model template's ID type.
   */
  identityManager?:
    | IdentityManagerConfig<ModelIdFor<TTemplate>>
    | IdentityManager<ModelIdFor<TTemplate>>;
  /**
   * Serializer configuration or instance for this collection.
   * Can be either a SerializerConfig config object or a Serializer instance.
   */
  serializer?: SerializerConfig<TTemplate, TSchema> | TSerializer;
  /**
   * Seeds configuration - can be a function or object with named scenarios
   * Used when collection().seeds(...) is called
   */
  seeds?: Seeds<TSchema>;
  /**
   * Fixtures configuration - static data to load into the collection
   * Used when collection().fixtures(...) is called
   */
  fixtures?: FixtureConfig<TTemplate, TRelationships>;
}

/**
 * Type for schema collections - provides both string-based property access and symbol-based relationship resolution
 * @template TCollections - The string-keyed schema collections config
 */
export type SchemaCollections = Record<
  string,
  CollectionConfig<any, any, any, any, any>
>;

/**
 * Type for schema collections - provides string-based property access
 * @template TCollections - The string-keyed schema collections config
 */
export type SchemaCollectionAccessors<TCollections extends SchemaCollections> =
  {
    [K in keyof TCollections]: TCollections[K] extends CollectionConfig<
      infer TTemplate,
      infer TRelationships,
      infer TFactory,
      any,
      any
    >
      ? Collection<TCollections, TTemplate, TRelationships, TFactory>
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
          (TRelationships extends ModelRelationships
            ? ModelForeignKeys<TRelationships, TTemplate>
            : {})
      >
    : never;
};

/**
 * Type for collection create/factory attributes - all attributes are optional
 * Used for passing attributes to create() methods where factory provides defaults
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 * @template TRelationships - The model relationships
 */
export type CollectionCreateAttrs<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TRelationships extends ModelRelationships = RelationshipsByTemplate<
    TTemplate,
    TSchema
  >,
> = Partial<ModelAttrs<TTemplate, TSchema>> &
  Partial<RelatedModelAttrs<TSchema, TRelationships>>;
