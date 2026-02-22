import { IdentityManager, type IdType } from '@src/id-manager';
import { MirageError, type Logger } from '@src/utils';

import DbCollection from './DbCollection';
import type {
  DbCollectionConfig,
  DbCollectionData,
  DbCollections,
  DbCollectionsFromStaticData,
  DbConfig,
  DbData,
  DbRecord,
} from './types';

/**
 * A database for storing and managing collections of records.
 * @template TCollections - The type of collections in the database
 * @example
 * const db = DB.create({
 *   users: [{ id: "1", name: 'John' }],
 *   posts: [{ id: "1", title: 'Hello' }]
 * });
 * db.users.records;
 */
export default class DB<TCollections extends DbCollections> {
  private _collections: Map<keyof TCollections, DbCollection<any>> = new Map();
  private _logger?: Logger;

  constructor(config: DbConfig<TCollections> = {}) {
    const { initialData, logger } = config;
    this._logger = logger;

    if (initialData) {
      this.loadData(initialData);
    }

    this.initCollectionAccessors();
  }

  // -- COLLECTION MANAGEMENT --

  /**
   * Checks if a collection exists.
   * @param name - The name of the collection to check.
   * @returns `true` if the collection exists, `false` otherwise.
   */
  hasCollection(name: keyof TCollections): boolean {
    return this._collections.has(name);
  }

  /**
   * Creates a new collection with the given name and initial data.
   * @param name - The name of the collection to create.
   * @param config - The configuration for the collection.
   * @param config.initialData - The initial data to populate the collection with.
   * @param config.identityManager - The identity manager for the collection.
   * @returns The DB instance.
   */
  createCollection<TAttrs extends DbRecord>(
    name: keyof TCollections,
    config?: Omit<DbCollectionConfig<TAttrs>, 'name'>,
  ): DbInstance<
    TCollections & { [K in keyof TCollections]: DbCollection<TAttrs> }
  > {
    const collectionName = String(name);

    if (this._collections.has(collectionName)) {
      throw new MirageError(`Collection ${collectionName} already exists`);
    }

    const collection = new DbCollection<TAttrs>(collectionName, {
      identityManager: config?.identityManager,
      initialData: config?.initialData,
      logger: this._logger,
    });
    this._collections.set(collectionName, collection);
    this.initCollectionAccessors();

    return this as unknown as DbInstance<
      TCollections & { [K in keyof TCollections]: DbCollection<TAttrs> }
    >;
  }

  /**
   * Retrieves a collection by its name.
   * @template T - The collection key
   * @param name - The name of the collection to retrieve.
   * @returns The collection with the specified name.
   * @throws {Error} If the collection does not exist.
   */
  getCollection<T extends keyof TCollections>(name: T): TCollections[T] {
    const collection = this._collections.get(name);

    if (!collection) {
      throw new MirageError(`Collection ${String(name)} does not exist`);
    }

    return collection as TCollections[T];
  }

  /**
   * Retrieves the identity manager for a given collection name.
   * @param collectionName - The name of the collection to get the identity manager for.
   * @returns The identity manager for the given collection name.
   * @throws {Error} If the collection does not exist.
   */
  identityManagerFor(
    collectionName: keyof TCollections,
  ): IdentityManager<IdType> {
    const collection = this.getCollection(collectionName);
    return collection.identityManager;
  }

  // -- DATA MANAGEMENT --

  /**
   * Loads collections data from a record into the database.
   * @template TData - The type of data to load
   * @param data - Record of collection names and their initial data
   * @returns The DB instance with collection accessors for the loaded data.
   */
  loadData<TData extends Record<string, DbRecord[]>>(
    data: TData,
  ): DbInstance<TCollections & DbCollectionsFromStaticData<TData>> {
    type CollectionNames = keyof TCollections;

    for (const key in data) {
      const records = data[key];
      const name = key as CollectionNames;

      if (this.hasCollection(name)) {
        this.getCollection(name).insertMany(records);
      } else {
        this.createCollection(name, { initialData: records });
      }
    }

    return this as unknown as DbInstance<
      TCollections & DbCollectionsFromStaticData<TData>
    >;
  }

  /**
   * Empties the data from all collections in the database.
   */
  emptyData(): void {
    this._collections.forEach((collection) => collection.clear());
  }

  /**
   * Dumps the data from all collections in the database.
   * @returns A record of collection names and their data.
   */
  dump(): DbData<TCollections> {
    const data = {} as DbData<TCollections>;

    this._collections.forEach((collection, name) => {
      data[name] = collection.all() as DbCollectionData<
        TCollections[typeof name]
      >;
    });

    return data;
  }

  // -- PRIVATE METHODS --

  private initCollectionAccessors(): void {
    this._collections.forEach((collection, name) => {
      if (!Object.prototype.hasOwnProperty.call(this, name)) {
        Object.defineProperty(this, name, {
          get: () => collection,
          enumerable: true,
          configurable: true,
        });
      }
    });
  }
}

/**
 * Factory function for creating a DB instance with collection accessors
 * @template TCollections - The type of collections in the database
 * @param config - The configuration for the database
 * @param config.initialData - The initial data to populate collections
 * @returns A DB instance with typed collection accessors
 * @example
 * const db = createDatabase({
 *   users: [{ id: "1", name: 'John' }],
 *   posts: [{ id: "1", title: 'Hello world' }]
 * });
 *
 * db.users.records; // [{ id: "1", name: 'John' }]
 * db.posts.records; // [{ id: "1", title: 'Hello world' }]
 */
export function createDatabase<
  TCollections extends Record<string, DbCollection<any>>,
>(config?: DbConfig<TCollections>): DbInstance<TCollections> {
  return new DB<TCollections>(config) as DbInstance<TCollections>;
}

/**
 * Type for a DB instance with collection accessors
 * @template TCollections - The type of collections in the database
 */
export type DbInstance<TCollections extends Record<string, DbCollection<any>>> =
  DB<TCollections> & {
    [K in keyof TCollections]: TCollections[K];
  };
