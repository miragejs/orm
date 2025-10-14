import { createDatabase, type DbInstance } from '@src/db';
import { StringIdentityManager } from '@src/id-manager';
import type { ModelTemplate } from '@src/model';
import { Serializer, type GlobalSerializerConfig, type SerializerConfig } from '@src/serializer';

import SchemaCollection, { createCollection } from './SchemaCollection';
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
 * @template TConfig - The schema configuration type with identity manager and global serializer config
 */
export default class Schema<
  TCollections extends SchemaCollections,
  TConfig extends SchemaConfig<any, any> = SchemaConfig<StringIdentityManager, undefined>,
> {
  public readonly db: DbInstance<SchemaDbCollections<TCollections>>;
  public readonly identityManager: TConfig extends SchemaConfig<infer TIdentityManager, any>
    ? TIdentityManager
    : StringIdentityManager;

  private _collections: Map<string, SchemaCollection<any, any, any, any, any>> = new Map();
  private _globalSerializerConfig?: GlobalSerializerConfig;

  constructor(collections: TCollections, config?: TConfig) {
    this.db = createDatabase<SchemaDbCollections<TCollections>>();
    this.identityManager = config?.identityManager ?? new StringIdentityManager();
    this._globalSerializerConfig = config?.globalSerializerConfig;
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
    infer TTemplate,
    infer TRelationships,
    infer TFactory,
    infer TSerializer
  >
    ? SchemaCollection<TCollections, TTemplate, TRelationships, TFactory, TSerializer>
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
      const { model, factory, relationships, serializerConfig, serializerInstance } =
        collectionConfig;
      const identityManager = collectionConfig.identityManager ?? this.identityManager;

      // Determine the final serializer to use
      let finalSerializer: any;

      if (serializerInstance) {
        // 1. Collection-level instance has highest priority (no merging)
        finalSerializer = serializerInstance;
      } else {
        // 2. Merge global config with collection config
        const mergedConfig = this._mergeConfigs(model, serializerConfig);

        // Only create serializer if there's a config
        if (mergedConfig) {
          finalSerializer = new Serializer(model, mergedConfig);
        }
      }

      const collection = createCollection(this as SchemaInstance<TCollections, TConfig>, {
        model,
        factory,
        identityManager,
        relationships,
        serializer: finalSerializer,
      });
      this._collections.set(collectionName, collection);

      Object.defineProperty(this, collectionName, {
        configurable: true,
        enumerable: true,
        get: () => this._collections.get(collectionName),
      });
    }
  }

  /**
   * Merge global serializer config with collection-specific config
   * Collection config values override global config values
   * @param _template - The model template (used for type inference only)
   * @param collectionConfig - Collection-specific serializer config
   * @returns Merged serializer config or undefined if both are undefined
   */
  private _mergeConfigs<TTemplate extends ModelTemplate>(
    _template: TTemplate,
    collectionConfig?: SerializerConfig<TTemplate>,
  ): SerializerConfig<TTemplate> | undefined {
    const global = this._globalSerializerConfig;

    if (!global && !collectionConfig) {
      return undefined;
    }

    return {
      // Structural options: collection overrides global
      root: collectionConfig?.root ?? global?.root,
      embed: collectionConfig?.embed ?? global?.embed,
      // Model-specific options: only from collection level
      attrs: collectionConfig?.attrs,
      include: collectionConfig?.include,
    };
  }
}

/**
 * Type for a complete schema instance with collections
 * Provides both string-based property access and symbol-based relationship resolution
 */
export type SchemaInstance<
  TCollections extends SchemaCollections,
  TConfig extends SchemaConfig<any, any> = SchemaConfig<StringIdentityManager, undefined>,
> = Schema<TCollections, TConfig> & SchemaCollectionAccessors<TCollections>;
