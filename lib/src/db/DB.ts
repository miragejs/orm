import { IdentityManager, type IdType } from '@src/id-manager';
import { MirageError } from '@src/utils';

import DbCollection, { type DbCollectionConfig } from './DbCollection';
import type { DbRecord } from './types';

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
export function createDatabase<TCollections extends Record<string, DbCollection<any>>>(
  config?: DbConfig<TCollections>,
): DbInstance<TCollections> {
  return new DB<TCollections>(config) as DbInstance<TCollections>;
}

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
export default class DB<TCollections extends Record<string, DbCollection<any>>> {
  private _collections: Map<keyof TCollections, DbCollection<any>> = new Map();

  constructor(config: DbConfig<TCollections> = {}) {
    const { initialData } = config;

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
  ): DbInstance<TCollections & { [K in keyof TCollections]: DbCollection<TAttrs> }> {
    const collectionName = String(name);

    if (this._collections.has(collectionName)) {
      throw new MirageError(`Collection ${collectionName} already exists`);
    }

    const collection = new DbCollection<TAttrs>(collectionName, {
      identityManager: config?.identityManager,
      initialData: config?.initialData,
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
  identityManagerFor(collectionName: keyof TCollections): IdentityManager<IdType> {
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
  ): DbInstance<TCollections & InferCollectionsFromData<TData>> {
    (Object.entries(data) as [keyof TCollections, TData[keyof TData]][]).forEach(
      ([name, records]) => {
        if (this.hasCollection(name)) {
          this.getCollection(name).insertMany(records);
        } else {
          this.createCollection(name, { initialData: records });
        }
      },
    );

    return this as unknown as DbInstance<TCollections & InferCollectionsFromData<TData>>;
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
      data[name] = collection.records as DbCollectionData<TCollections[typeof name]>;
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

// -- Types --

/**
 * Infers the collection type from data records
 * @template TData - The type of data records
 */
type InferCollectionFromData<TData> =
  TData extends Array<infer TRecord>
    ? TRecord extends DbRecord
      ? DbCollection<TRecord>
      : DbCollection<DbRecord>
    : DbCollection<DbRecord>;

/**
 * Infers collections map from data object
 * @template TData - The type of data object
 */
type InferCollectionsFromData<TData> = {
  [K in keyof TData]: InferCollectionFromData<TData[K]>;
};

/**
 * Gets the data of a collection
 * @template T - The type of the collection
 */
type DbCollectionData<T> = T extends DbCollection<infer TAttrs> ? TAttrs[] : never;

/**
 * Type for a database's data
 * @template TCollections - The type of collections in the database
 */
export type DbData<TCollections extends Record<string, DbCollection<any>>> = {
  [K in keyof TCollections]: DbCollectionData<TCollections[K]>;
};

/**
 * Configuration for creating a DB instance
 * @template TCollections - The type of collections in the database
 */
export type DbConfig<TCollections extends Record<string, DbCollection<any>>> = {
  initialData?: DbData<TCollections>;
};

/**
 * Type for a DB instance with collection accessors
 * @template TCollections - The type of collections in the database
 */
export type DbInstance<TCollections extends Record<string, DbCollection<any>>> =
  DB<TCollections> & {
    [K in keyof TCollections]: TCollections[K];
  };
