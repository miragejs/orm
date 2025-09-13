import { createDatabase, type DbInstance } from '@src/db';
import { StringIdentityManager } from '@src/id-manager';

import SchemaCollection, { createSchemaCollection } from './SchemaCollection';
import type {
  SchemaCollectionAccessors,
  SchemaCollectionConfig,
  SchemaCollections,
  SchemaConfig,
  SchemaDbCollections,
} from './types';

/**
 * Schema class that manages database and collections
 * @template TCollections - The type map of collection names to their configurations
 * @template TConfig - The schema configuration type with identity manager
 */
export default class Schema<
  TCollections extends SchemaCollections,
  TConfig extends SchemaConfig<any> = SchemaConfig<StringIdentityManager>,
> {
  public readonly db: DbInstance<SchemaDbCollections<TCollections>>;
  public readonly identityManager: TConfig extends SchemaConfig<infer TIdentityManager>
    ? TIdentityManager
    : StringIdentityManager;
  private _collections: Map<string, SchemaCollection<any, any, any, any>> = new Map();

  constructor(collections: TCollections, config?: TConfig) {
    this.db = createDatabase<SchemaDbCollections<TCollections>>();

    this.identityManager = (config?.identityManager ??
      new StringIdentityManager()) as TConfig extends SchemaConfig<infer TIdentityManager>
      ? TIdentityManager
      : StringIdentityManager;

    this._registerCollections(collections);
  }

  /**
   * Get a schema collection by collection name
   * @param collectionName - The name of the collection
   * @returns The schema collection for the collection with proper typing
   */
  getCollection<K extends keyof TCollections>(
    collectionName: K,
  ): TCollections[K] extends SchemaCollectionConfig<
    infer TToken,
    infer TRelationships,
    infer TFactory
  >
    ? SchemaCollection<TCollections, TToken, TRelationships, TFactory>
    : never {
    const collection = this._collections.get(collectionName as string);
    if (!collection) {
      throw new Error(`Collection '${String(collectionName)}' not found`);
    }
    return collection as any;
  }

  /**
   * Register collections from the configuration
   * @param collections - Collection configurations to register
   */
  private _registerCollections(collections: TCollections): void {
    for (const [collectionName, collectionConfig] of Object.entries(collections)) {
      const { model, factory, relationships } = collectionConfig;
      const identityManager = collectionConfig.identityManager ?? this.identityManager;

      const collection = createSchemaCollection(this as SchemaInstance<TCollections>, {
        model,
        factory,
        identityManager,
        relationships,
      });
      this._collections.set(collectionName, collection);

      Object.defineProperty(this, collectionName, {
        configurable: true,
        enumerable: true,
        get: () => this._collections.get(collectionName),
      });
    }
  }
}

/**
 * Sets up a schema with collections and global configuration
 * @param collections - Collection configurations keyed by collection name
 * @param config - Global schema configuration (optional)
 * @returns A complete schema instance with collection properties
 */
export function setupSchema<
  TCollections extends SchemaCollections,
  TConfig extends SchemaConfig<any> = SchemaConfig<StringIdentityManager>,
>(collections: TCollections, config?: TConfig): SchemaInstance<TCollections, TConfig> {
  return new Schema(collections, config) as SchemaInstance<TCollections, TConfig>;
}

/**
 * Type for a complete schema instance with collections
 * Provides both string-based property access and symbol-based relationship resolution
 */
export type SchemaInstance<
  TCollections extends SchemaCollections,
  TConfig extends SchemaConfig<any> = SchemaConfig<StringIdentityManager>,
> = Schema<TCollections, TConfig> & SchemaCollectionAccessors<TCollections>;
