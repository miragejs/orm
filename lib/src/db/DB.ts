import { MirageError } from '../utils';

import DbCollection, { type DbRecord } from './DbCollection';
import IdentityManager from './IdentityManager';

/**
 * A database for storing and managing collections of records.
 * @param options - Options for the database.
 * @param options.identityManagers - A record of collection names and their identity managers.
 * @param options.initialData - A record of collection names and their initial data.
 * @example
 * const db = new DB();
 * // Create a collection
 * db.createCollection('users', [{ id: 1, name: 'John' }]);
 * // Get a collection
 * db.getCollection('users').insert({ name: 'Jane' });
 * // Register an identity manager for a collection
 * db.registerIdentityManager('users', new IdentityManager());
 * // Load data into the database
 * db.loadData({
 *   users: [{ id: 1, name: 'John' }],
 * });
 * // Empty the database
 * db.emptyData();
 * // Dump the database
 * const data = db.dump();
 * console.log(data); // { users: [{ id: 1, name: 'John' }] }
 */
export default class DB {
  private collections: Map<string, DbCollection<any>> = new Map();
  private identityManagers: Map<string, IdentityManager<any>> = new Map();

  constructor(options: DbOptions = {}) {
    if (options.identityManagers) {
      this.registerIdentityManagers(options.identityManagers);
    }

    if (options.initialData) {
      this.loadData(options.initialData);
    }
  }

  // -- Identity Management --

  /**
   * Registers identity managers for the database.
   * @param identityManagers - A record of collection names and their identity managers.
   */
  registerIdentityManagers(identityManagers: Record<string, IdentityManager<any>>): void {
    Object.entries(identityManagers).forEach(([name, manager]) => {
      this.identityManagers.set(name, manager);
    });
  }

  /**
   * Retrieves the identity manager for a given collection name.
   * @param collectionName - The name of the collection to get the identity manager for.
   * @returns The identity manager for the given collection name or the application identity manager if no specific manager is found.
   */
  identityManagerFor(collectionName: string): IdentityManager<any> {
    return (
      this.identityManagers.get(collectionName) ||
      this.identityManagers.get('application') ||
      new IdentityManager()
    );
  }

  // -- Collection Management --

  /**
   * Creates a new collection with the given name and initial data.
   * @param name - The name of the collection to create.
   * @param initialData - The initial data to populate the collection with.
   * @returns The newly created collection.
   */
  createCollection<TId = number>(name: string, initialData?: DbRecord<TId>[]): DbCollection<TId> {
    if (this.collections.has(name)) {
      throw new Error(`Collection ${name} already exists`);
    }

    const identityManager = this.identityManagerFor(name) as IdentityManager<TId>;
    const collection = new DbCollection<TId>({
      identityManager,
      initialData,
      name,
    });

    this.collections.set(name, collection);
    return collection;
  }

  /**
   * Retrieves a collection by its name.
   * @param name - The name of the collection to retrieve.
   * @returns The collection with the specified name.
   * @throws {Error} If the collection does not exist.
   */
  getCollection<TId = number>(name: string): DbCollection<TId> {
    const collection = this.collections.get(name);
    if (!collection) {
      throw new MirageError(`Collection ${name} does not exist`);
    }
    return collection as DbCollection<TId>;
  }

  // -- Data Management --

  /**
   * Loads collections data from a record into the database.
   * @param data - Record of collection names and their initial data
   * @example
   * ```ts
   * db.loadData({
   *   users: [{ id: 1, name: 'John' }],
   *   posts: [{ id: 1, title: 'Post 1' }],
   * });
   * ```
   */
  loadData(data: Record<string, DbRecord<any>[]>): void {
    for (const name in data) {
      this.createCollection(name, data[name]);
    }
  }

  /**
   * Empties the data from all collections in the database.
   * @example
   * ```ts
   * db.emptyData();
   * ```
   */
  emptyData(): void {
    this.collections.forEach((collection) => collection.clear());
  }

  /**
   * Logs the data from all collections in the database.
   * @returns A record of collection names and their data.
   * @example
   * ```ts
   * db.loadData({
   *   users: [{ id: 1, name: 'John' }],
   *   posts: [{ id: 1, title: 'Post 1' }],
   * });
   * const data = db.dump();
   * console.log(data); // { users: [{ id: 1, name: 'John' }], posts: [{ id: 1, title: 'Post 1' }] }
   * ```
   */
  dump(): Record<string, DbRecord<any>[]> {
    const data: Record<string, DbRecord<any>[]> = {};
    this.collections.forEach((collection, name) => {
      data[name] = collection.all();
    });
    return data;
  }
}

// -- Types --

export interface DbOptions {
  identityManagers?: Record<string, IdentityManager<any>>;
  initialData?: Record<string, DbRecord<any>[]>;
}
