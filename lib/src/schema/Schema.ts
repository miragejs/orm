import { createDatabase, type DbInstance } from '@src/db';
import { StringIdentityManager } from '@src/id-manager';
import type { ModelTemplate } from '@src/model';
import {
  Serializer,
  type SerializerOptions,
  type StructuralSerializerOptions,
} from '@src/serializer';
import { Logger, MirageError } from '@src/utils';

import Collection, { createCollection } from './Collection';
import type {
  SchemaCollectionAccessors,
  CollectionConfig,
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
  public readonly logger?: Logger;

  private _collections: Map<string, Collection<any, any, any, any>> = new Map();
  private _globalSerializerConfig?: StructuralSerializerOptions;

  constructor(collections: TCollections, config?: TConfig) {
    // Create logger if logging is enabled
    if (config?.logging?.enabled) {
      this.logger = new Logger(config.logging);
    }

    this.db = createDatabase<SchemaDbCollections<TCollections>>({
      logger: this.logger,
    });
    this.identityManager = config?.identityManager ?? new StringIdentityManager();
    this._globalSerializerConfig = config?.globalSerializerConfig;

    this._registerCollections(collections);

    this.logger?.debug('Schema initialized', this.db.dump());
  }

  /**
   * Get a schema collection by collection name
   * @param collectionName - The name of the collection
   * @returns The schema collection for the collection with proper typing
   */
  getCollection<K extends keyof TCollections>(
    collectionName: K,
  ): TCollections[K] extends CollectionConfig<
    infer TTemplate,
    infer TRelationships,
    infer TFactory,
    any
  >
    ? Collection<TCollections, TTemplate, TRelationships, TFactory>
    : never {
    const collection = this._collections.get(collectionName as string);
    if (!collection) {
      throw new MirageError(`Collection '${String(collectionName)}' not found`);
    }
    // Type assertion needed: Map storage loses specific generic parameters
    // TypeScript can't verify stored collection matches complex conditional return type
    return collection as any;
  }

  /**
   * Load seeds for all collections or a specific collection in the schema.
   * This will run all seed scenarios for each collection.
   * To load specific scenarios, use collection.loadSeeds(scenarioId) on individual collections.
   * @example
   * ```typescript
   * // Load all seeds for all collections
   * await schema.loadSeeds();
   *
   * // Load seeds for a specific collection
   * await schema.loadSeeds('users');
   *
   * // Load only default scenarios for all collections
   * await schema.loadSeeds({ onlyDefault: true });
   *
   * // Load only default scenario for a specific collection
   * await schema.loadSeeds({ collectionName: 'users', onlyDefault: true });
   * ```
   */
  async loadSeeds(): Promise<void>;
  /**
   * Load seeds for a specific collection
   * @param collectionName - The name of the collection to load seeds for
   */
  async loadSeeds(collectionName: keyof TCollections): Promise<void>;
  /**
   * Load only default scenarios for all collections
   * @param options - Load options with onlyDefault flag
   */
  async loadSeeds(options: { onlyDefault: boolean }): Promise<void>;
  /**
   * Load seeds for a specific collection with options
   * @param options - Load options with collectionName and optional onlyDefault flag
   */
  async loadSeeds(options: {
    collectionName: keyof TCollections;
    onlyDefault?: boolean;
  }): Promise<void>;
  /**
   * Implementation method for loading seeds
   * @param collectionNameOrOptions - Collection name or options object
   */
  async loadSeeds(
    collectionNameOrOptions?:
      | keyof TCollections
      | { collectionName?: keyof TCollections; onlyDefault?: boolean },
  ): Promise<void> {
    // Parse arguments
    let collectionName: keyof TCollections | undefined;
    let onlyDefault = false;

    if (typeof collectionNameOrOptions === 'object') {
      // Object parameter: { collectionName?, onlyDefault? }
      collectionName = collectionNameOrOptions.collectionName;
      onlyDefault = collectionNameOrOptions.onlyDefault ?? false;
    } else {
      // String parameter: collectionName
      collectionName = collectionNameOrOptions;
    }

    if (collectionName) {
      this.logger?.info(
        `Loading seeds for '${String(collectionName)}'${onlyDefault ? ' (default only)' : ''}`,
      );

      const collection = this.getCollection(collectionName);
      await collection.loadSeeds(onlyDefault ? 'default' : undefined);

      this.logger?.info(`Seeds loaded for '${String(collectionName)}'`, this.db.dump());
    } else {
      this.logger?.info(`Loading all seeds${onlyDefault ? ' (default only)' : ''}`, {
        collections: Array.from(this._collections.keys()),
      });

      for (const [_, collection] of this._collections) {
        await collection.loadSeeds(onlyDefault ? 'default' : undefined);
      }

      this.logger?.info('All seeds loaded', this.db.dump());
    }
  }

  /**
   * Load fixtures for all collections or a specific collection in the schema.
   * This will insert all fixture records into each collection's database.
   * @param collectionName - Optional collection name to load fixtures for. If not provided, loads for all collections.
   * @example
   * ```typescript
   * // Load all fixtures for all collections
   * await schema.loadFixtures();
   *
   * // Load fixtures for a specific collection
   * await schema.loadFixtures('users');
   * ```
   */
  async loadFixtures(collectionName?: keyof TCollections): Promise<void> {
    if (collectionName) {
      this.logger?.info(`Loading fixtures for '${String(collectionName)}'`);

      const collection = this.getCollection(collectionName);
      await collection.loadFixtures();

      this.logger?.info(`Fixtures loaded for '${String(collectionName)}'`, this.db.dump());
    } else {
      this.logger?.info('Loading all fixtures', {
        collections: Array.from(this._collections.keys()),
      });

      for (const [_, collection] of this._collections) {
        await collection.loadFixtures();
      }

      this.logger?.info('All fixtures loaded', this.db.dump());
    }
  }

  /**
   * Register collections from the configuration
   * @param collections - Collection configurations to register
   */
  private _registerCollections(collections: TCollections): void {
    this.logger?.debug('Registering collections', {
      count: Object.keys(collections).length,
      names: Object.keys(collections),
    });

    // Track collections with auto-loading fixtures
    const autoLoadCollections: any[] = [];

    for (const collectionName in collections) {
      const collectionConfig = collections[collectionName];
      const {
        model,
        factory,
        relationships,
        serializerConfig,
        serializerInstance,
        seeds,
        fixtures,
      } = collectionConfig;
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
        seeds,
        fixtures,
      });
      this._collections.set(collectionName, collection);

      Object.defineProperty(this, collectionName, {
        configurable: true,
        enumerable: true,
        get: () => this._collections.get(collectionName),
      });

      // Track if fixtures should be auto-loaded
      if (fixtures?.strategy === 'auto') {
        autoLoadCollections.push(collection);
      }
    }

    this.logger?.debug('All collections registered', {
      count: this._collections.size,
    });

    // Validate inverse relationships after all collections are registered
    this._validateInverseRelationships(collections);

    // Auto-load fixtures for collections with 'auto' strategy
    // This is done synchronously after all collections are registered
    // to ensure relationships are set up properly
    if (autoLoadCollections.length > 0) {
      this.logger?.info('Auto-loading fixtures', {
        collections: autoLoadCollections.map((c) => c.collectionName),
      });
      for (const collection of autoLoadCollections) {
        // Load fixtures synchronously using a non-async approach
        // Since we're in a constructor context, we need to handle this carefully
        void collection.loadFixtures();
      }
    }
  }

  /**
   * Validate that all inverse relationships are correctly defined
   * This checks that explicit inverse relationships exist and point back correctly
   * @param collections - The schema collections to validate
   * @private
   */
  private _validateInverseRelationships(collections: TCollections): void {
    for (const collectionName in collections) {
      const collectionConfig = collections[collectionName];
      const relationships = collectionConfig.relationships;
      if (!relationships) continue;

      for (const relName in relationships) {
        const relationship = relationships[relName];

        // Skip if no explicit inverse is specified
        if (relationship.inverse === undefined) {
          continue;
        }

        // Skip if inverse is explicitly disabled
        if (relationship.inverse === null) {
          continue;
        }

        const inverseName = relationship.inverse as string;
        const targetCollectionName = relationship.targetModel.collectionName;
        const targetCollectionConfig = collections[targetCollectionName as keyof TCollections];

        if (!targetCollectionConfig) {
          throw new MirageError(
            `Invalid inverse relationship: '${collectionName}.${relName}' ` +
              `declares inverse '${inverseName}' but target collection '${targetCollectionName}' does not exist.`,
          );
        }

        const targetRelationships = targetCollectionConfig.relationships;
        if (!targetRelationships || !targetRelationships[inverseName]) {
          throw new MirageError(
            `Invalid inverse relationship: '${collectionName}.${relName}' ` +
              `declares inverse '${inverseName}' but '${targetCollectionName}.${inverseName}' does not exist.`,
          );
        }

        // Validate that inverse relationship points back to this collection
        const inverseRel = targetRelationships[inverseName];
        if (inverseRel.targetModel.collectionName !== collectionConfig.model.collectionName) {
          throw new MirageError(
            `Invalid inverse relationship: '${collectionName}.${relName}' ` +
              `declares inverse '${inverseName}', but '${targetCollectionName}.${inverseName}' ` +
              `points to '${inverseRel.targetModel.collectionName}', not '${collectionName}'.`,
          );
        }

        // Warn about asymmetric inverse relationships
        if (
          inverseRel.inverse !== undefined &&
          inverseRel.inverse !== null &&
          inverseRel.inverse !== relName
        ) {
          this.logger?.warn(
            `Asymmetric inverse relationship: '${collectionName}.${relName}' → '${inverseName}', ` +
              `but '${targetCollectionName}.${inverseName}' → '${inverseRel.inverse || 'auto'}'. ` +
              `Consider making inverses mutual for consistency.`,
          );
        }
      }
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
    collectionConfig?: SerializerOptions<TTemplate>,
  ): SerializerOptions<TTemplate> | undefined {
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
