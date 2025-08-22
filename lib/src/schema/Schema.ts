import { createDatabase, type DbInstance } from '@src/db';
import type { TraitMap } from '@src/factory';
import { StringIdentityManager, type IdentityManager } from '@src/id-manager';
import type { ModelToken } from '@src/model';

import SchemaCollection, { createSchemaCollection } from './SchemaCollection';
import type { SchemaCollectionConfig, SchemaConfig, InferDbCollections } from './types';

/**
 * Sets up a schema with collections and global configuration
 * @param collections - Collection configurations keyed by collection name
 * @param config - Global schema configuration (optional)
 * @returns A schema instance with collection properties
 */
export function setupSchema<TCollections extends Record<string, SchemaCollectionConfig<any, any>>>(
  collections: TCollections,
  config?: SchemaConfig<any>,
): SchemaInstance<TCollections> {
  return new Schema(collections, config ?? {}) as SchemaInstance<TCollections>;
}

/**
 * Schema class that manages database and collections
 * @template TCollections - The type map of collection names to their configurations
 */
export default class Schema<TCollections extends Record<string, SchemaCollectionConfig<any, any>>> {
  private _collections: Map<string, SchemaCollection<any, any>> = new Map();
  private _db: DbInstance<InferDbCollections<TCollections>>;
  private _identityManager: IdentityManager<any>;
  // private _serializer?: any; // Skip serializer for now

  constructor(collections: TCollections, config: SchemaConfig<any> = {}) {
    this._db = createDatabase<InferDbCollections<TCollections>>({});
    this._identityManager = config.identityManager ?? new StringIdentityManager();
    this._registerCollections(collections);
  }

  /**
   * Get the database instance
   * @returns The database instance with proper collection typing
   */
  get db(): DbInstance<InferDbCollections<TCollections>> {
    return this._db;
  }

  /**
   * Get the default identity manager
   * @returns The default identity manager with proper typing
   */
  get identityManager(): IdentityManager<any> {
    return this._identityManager;
  }

  /**
   * Get a schema collection by collection name
   * @param collectionName - The name of the collection
   * @returns The schema collection for the collection with proper typing
   */
  getCollection<K extends keyof TCollections>(
    collectionName: K,
  ): TCollections[K] extends SchemaCollectionConfig<infer TToken, infer TTraits>
    ? SchemaCollection<TToken, TTraits>
    : never {
    const collection = this._collections.get(collectionName as string);
    if (!collection) {
      throw new Error(`Collection '${String(collectionName)}' not found`);
    }

    return collection as TCollections[K] extends SchemaCollectionConfig<infer TToken, infer TTraits>
      ? SchemaCollection<TToken, TTraits>
      : never;
  }

  // -- PRIVATE METHODS --

  /**
   * Add a collection to the schema (internal method)
   * @param collectionName - The name of the collection
   * @param collection - The schema collection instance
   */
  private _addCollection<TToken extends ModelToken, TTraits extends TraitMap<TToken>>(
    collectionName: string,
    collection: SchemaCollection<TToken, TTraits>,
  ): void {
    this._collections.set(collectionName, collection);

    // Add collection as a property on the schema instance
    if (!Object.prototype.hasOwnProperty.call(this, collectionName)) {
      Object.defineProperty(this, collectionName, {
        configurable: true,
        enumerable: true,
        get: () => this._collections.get(collectionName),
      });
    }
  }

  /**
   * Register collections from the configuration
   * @param collections - Collection configurations to register
   */
  private _registerCollections(collections: TCollections): void {
    // Create collections and add them to the schema
    for (const [collectionName, collectionConfig] of Object.entries(collections)) {
      const identityManager = collectionConfig.identityManager ?? this._identityManager;
      const collection = createSchemaCollection(this, {
        ...collectionConfig,
        identityManager,
      });

      this._addCollection(collectionName, collection);
    }
  }
}

// -- TYPES --

/**
 * Schema instance type with collection properties
 * @template TCollections - The type map of collection names to their configurations
 */
export type SchemaInstance<TCollections extends Record<string, SchemaCollectionConfig<any, any>>> =
  Schema<TCollections> & {
    [K in keyof TCollections]: TCollections[K] extends SchemaCollectionConfig<
      infer TToken,
      infer TTraits
    >
      ? SchemaCollection<TToken, TTraits>
      : never;
  };
