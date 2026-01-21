import { createDatabase, type DbInstance } from '@src/db';
import {
  IdentityManager,
  type IdentityManagerConfig,
  type IdType,
} from '@src/id-manager';
import { Logger, MirageError } from '@src/utils';

import Collection, { createCollection } from './Collection';
import type {
  CollectionConfig,
  SchemaCollectionAccessors,
  SchemaCollections,
  SchemaConfig,
  SchemaDbCollections,
} from './types';

/**
 * Schema class that manages database and collections.
 *
 * You can set a default identity manager configuration at the schema level,
 * which individual collections can override with their own configuration.
 * By default, collections use string IDs starting from "1".
 * @template TCollections - The type map of collection names to their configurations
 * @template TIdType - The default ID type for collections (defaults to string)
 */
export default class Schema<
  TCollections extends SchemaCollections,
  TIdType extends IdType = string,
> {
  public readonly db: DbInstance<SchemaDbCollections<TCollections>>;
  public readonly logger?: Logger;

  private _collections: Map<string, Collection<any, any, any, any>> = new Map();
  private _defaultIdentityManagerConfig?: IdentityManagerConfig<TIdType>;

  constructor(collections: TCollections, config?: SchemaConfig<TIdType>) {
    // Create logger if logging is enabled
    if (config?.logging?.enabled) {
      this.logger = new Logger(config.logging);
    }

    // Store the default identity manager config for later merging with collection configs
    this._defaultIdentityManagerConfig = config?.identityManager;

    // Create database instance
    this.db = createDatabase<SchemaDbCollections<TCollections>>({
      logger: this.logger,
    });

    // Register collections
    this._registerCollections(collections);

    if (this.logger) {
      this.logger.debug('Schema initialized', this.db.dump());
    }
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
      this.logger?.log(
        `Loading seeds for '${String(collectionName)}'${onlyDefault ? ' (default only)' : ''}`,
      );

      const collection = this.getCollection(collectionName);
      await collection.loadSeeds(onlyDefault ? 'default' : undefined);

      this.logger?.info(
        `Seeds loaded for '${String(collectionName)}'`,
        this.db.dump(),
      );
    } else {
      this.logger?.log(
        `Loading all seeds${onlyDefault ? ' (default only)' : ''}`,
        {
          collections: Array.from(this._collections.keys()),
        },
      );

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
      this.logger?.log(`Loading fixtures for '${String(collectionName)}'`);

      const collection = this.getCollection(collectionName);
      await collection.loadFixtures();

      this.logger?.info(
        `Fixtures loaded for '${String(collectionName)}'`,
        this.db.dump(),
      );
    } else {
      this.logger?.log('Loading all fixtures', {
        collections: Array.from(this._collections.keys()),
      });

      for (const [_, collection] of this._collections) {
        await collection.loadFixtures();
      }

      this.logger?.info('All fixtures loaded', this.db.dump());
    }
  }

  /**
   * Resets seed tracking for all collections, allowing seeds to be reloaded.
   * Call this after db.emptyData() if you need to reload seeds.
   * @example
   * ```typescript
   * schema.db.emptyData();
   * schema.resetSeedTracking();
   * await schema.loadSeeds(); // Seeds can now be loaded again
   * ```
   */
  resetSeedTracking(): void {
    for (const [_, collection] of this._collections) {
      collection.resetSeedTracking();
    }
    this.logger?.log('Seed tracking reset for all collections');
  }

  /**
   * Register collections from the configuration
   * @param collections - Collection configurations to register
   */
  private _registerCollections(collections: TCollections): void {
    this.logger?.log('Registering collections', {
      count: Object.keys(collections).length,
      names: Object.keys(collections),
    });

    // Track collections with auto-loading fixtures
    const autoLoadCollections: Collection<TCollections>[] = [];

    for (const collectionName in collections) {
      const collectionConfig = collections[collectionName];
      const {
        factory,
        fixtures,
        identityManager,
        model,
        relationships,
        seeds,
        serializer,
      } = collectionConfig;

      const mergedIdentityManager = this._mergeIdentityManager(identityManager);

      const collection = createCollection(
        this as SchemaInstance<TCollections>,
        {
          model,
          relationships,
          factory,
          identityManager: mergedIdentityManager,
          serializer,
          seeds,
          fixtures,
        } as CollectionConfig<
          typeof model,
          typeof relationships,
          typeof factory,
          TCollections
        >,
      );
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

    this.logger?.info('All collections registered', {
      count: Object.keys(collections).length,
      names: Object.keys(collections),
    });

    // Validate inverse relationships after all collections are registered
    this._validateInverseRelationships(collections);

    // Auto-load fixtures for collections with 'auto' strategy
    // This is done synchronously after all collections are registered
    // to ensure relationships are set up properly
    if (autoLoadCollections.length > 0) {
      this.logger?.log('Auto-loading fixtures', {
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
   * Merge identity manager from collection config with schema defaults.
   * Collection-level config/instance takes priority over schema-level default.
   * @param collectionIdentityManager - The identity manager from collection config (config or instance)
   * @returns The merged identity manager config or instance, or undefined
   * @private
   */
  private _mergeIdentityManager<TId extends IdType>(
    collectionIdentityManager?:
      | IdentityManagerConfig<TId>
      | IdentityManager<TId>,
  ): IdentityManagerConfig<TId> | IdentityManager<TId> | undefined {
    // If collection has an IdentityManager instance, use it directly (highest priority)
    if (collectionIdentityManager instanceof IdentityManager) {
      return collectionIdentityManager;
    }

    // If collection has a config, use it (takes priority over schema default)
    if (collectionIdentityManager) {
      return collectionIdentityManager;
    }

    // Fall back to schema default config (cast needed as schema default may have different ID type)
    return this._defaultIdentityManagerConfig as
      | IdentityManagerConfig<TId>
      | undefined;
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
        const targetCollectionConfig =
          collections[targetCollectionName as keyof TCollections];

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
        if (
          inverseRel.targetModel.collectionName !==
          collectionConfig.model.collectionName
        ) {
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
}

/**
 * Type for a complete schema instance with collections
 * Provides both string-based property access and symbol-based relationship resolution
 */
export type SchemaInstance<TCollections extends SchemaCollections> =
  Schema<TCollections> & SchemaCollectionAccessors<TCollections>;
