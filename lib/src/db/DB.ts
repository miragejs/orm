import { MirageError } from '../utils';

import DbCollection, { type DbRecord } from './DbCollection';
import IdentityManager, { type AllowedIdTypes } from './IdentityManager';

/**
 * A database for storing and managing collections of records.
 * @template TCollections - The type of collections in the database
 * @example
 * const db = DB.create({
 *   users: [{ id: 1, name: 'John' }],
 *   posts: [{ id: 1, title: 'Hello' }]
 * });
 * db.users.all();
 */
export default class DB<TCollections extends Record<string, DbCollection<any, any>>> {
  private _collections: Map<keyof TCollections, DbCollection<any, any>> = new Map();
  private _identityManagers: Map<string, IdentityManager<any>> = new Map();

  constructor(options: DbOptions<TCollections> = {}) {
    const { identityManagers, initialData } = options;

    this._identityManagers = identityManagers ?? new Map();
    if (!this._identityManagers.has('application')) {
      this._identityManagers.set('application', new IdentityManager());
    }

    if (initialData) {
      this.loadData(initialData);
    }

    this.initCollectionAccessors();
  }

  /**
   * Factory method for creating a DB instance with collection accessors
   * @template T - The type of initial data
   * @param options - The options for the database
   * @param options.identityManagers - The identity managers to use for the database
   * @param options.initialData - The initial data to populate collections
   * @returns A DB instance with typed collection accessors
   * @example
   * const db = DB.create({
   *   users: [{ id: 1, name: 'John' }],
   *   posts: [{ id: 1, title: 'Hello world' }]
   * });
   *
   * db.users.all(); // [{ id: 1, name: 'John' }]
   * db.posts.all(); // [{ id: 1, title: 'Hello world' }]
   */
  static create<T extends Record<string, DbRecord<any, any>[]>>(
    options?: DbOptions<{ [K in keyof T]: DbCollection<any, any> }>,
  ): DbInstance<{ [K in keyof T]: DbCollection<any, any> }> {
    return new DB<{ [K in keyof T]: DbCollection<any, any> }>(options) as DbInstance<{
      [K in keyof T]: DbCollection<any, any>;
    }>;
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
   * @template TId - The type of the collection's ID
   * @template TAttributes - The type of the collection's attributes
   * @param name - The name of the collection to create.
   * @param initialData - The initial data to populate the collection with.
   * @returns The newly created collection.
   */
  createCollection<TId extends AllowedIdTypes = number, TAttributes = Record<string, any>>(
    name: keyof TCollections,
    initialData?: DbRecord<TId, TAttributes>[],
  ): DbCollection<TId, TAttributes> {
    if (this._collections.has(name)) {
      throw new Error(`Collection ${String(name)} already exists`);
    }

    const identityManager = this.identityManagerFor(name as string) as IdentityManager<TId>;
    const collection = new DbCollection<TId, TAttributes>({
      identityManager,
      initialData,
      name: name as string,
    });

    this._collections.set(name, collection);
    this.initCollectionAccessors();

    return collection;
  }

  /**
   * Retrieves a collection by its name.
   * @template TId - The type of the collection's ID
   * @template TAttributes - The type of the collection's attributes
   * @param name - The name of the collection to retrieve.
   * @returns The collection with the specified name.
   * @throws {Error} If the collection does not exist.
   */
  getCollection<TId extends AllowedIdTypes = number, TAttributes = Record<string, any>>(
    name: keyof TCollections,
  ): DbCollection<TId, TAttributes> {
    const collection = this._collections.get(name);
    if (!collection) {
      throw new MirageError(`Collection ${String(name)} does not exist`);
    }
    return collection as DbCollection<TId, TAttributes>;
  }

  // -- DATA MANAGEMENT --

  /**
   * Dumps the data from all collections in the database.
   * @returns A record of collection names and their data.
   */
  dump(): Record<string, DbRecord<any, any>[]> {
    const data: Record<string, DbRecord<any, any>[]> = {};
    this._collections.forEach((collection, name) => {
      data[name as string] = collection.all();
    });
    return data;
  }

  /**
   * Empties the data from all collections in the database.
   */
  emptyData(): void {
    this._collections.forEach((collection) => collection.clear());
  }

  /**
   * Loads collections data from a record into the database.
   * @param data - Record of collection names and their initial data
   */
  loadData(data: Record<keyof TCollections, DbRecord<any, any>[]>): void {
    Object.entries(data).forEach(([name, records]) => {
      if (this.hasCollection(name)) {
        this.getCollection(name).insertMany(records);
      } else {
        this.createCollection(name, records);
      }
    });
  }

  // -- IDENTITY MANAGEMENT --

  /**
   * Retrieves the identity manager for a given collection name.
   * @param collectionName - The name of the collection to get the identity manager for.
   * @returns The identity manager for the given collection name or the application identity manager if no specific manager is found.
   */
  identityManagerFor(collectionName: string): IdentityManager<any> | undefined {
    if (!this._identityManagers.has(collectionName)) {
      return this._identityManagers.get('application');
    }
    return this._identityManagers.get(collectionName);
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

// -- TYPES --

/**
 * Options for creating a DB instance
 * @template TCollections - The type of collections in the database
 */
export type DbOptions<TCollections extends Record<string, DbCollection<any, any>>> = {
  identityManagers?: Map<string, IdentityManager<any>>;
  initialData?: Record<keyof TCollections, DbRecord<any, any>[]>;
};

/**
 * Type for a DB instance with collection accessors
 * @template TCollections - The type of collections in the database
 */
export type DbInstance<TCollections extends Record<string, DbCollection<any, any>>> =
  DB<TCollections> & {
    [K in keyof TCollections]: TCollections[K];
  };
