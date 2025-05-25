import IdentityManager from './IdentityManager';

/**
 * A collection of records in a database. Think of it as a table in a relational database.
 * @param options - Options for the collection.
 * @param options.name - The name of the collection.
 * @param options.identityManager - The identity manager for the collection.
 * @param options.initialData - Initial data for the collection.
 * @example
 * const users = new DbCollection({ name: 'users' });
 * users.insert({ name: 'John' }); // => { id: 1, name: 'John' }
 */
export default class DbCollection<TId = number> {
  name: string;
  private records: Map<TId, DbRecord<TId>> = new Map();
  private identityManager: IdentityManager<TId>;

  constructor(options: DbCollectionOptions<TId>) {
    this.name = options.name;
    this.identityManager = options.identityManager || new IdentityManager<TId>();

    if (options.initialData) {
      this.insertMany(options.initialData);
    }
  }

  /**
   * Returns the number of records in the collection.
   * @returns The number of records in the collection
   */
  get size() {
    return this.records.size;
  }

  // -- Query Methods --

  /**
   * Returns all records in the collection.
   * @returns Array of all records
   */
  all(): DbRecord<TId>[] {
    return Array.from(this.records.values());
  }

  /**
   * Finds records by their IDs.
   * @param ids - One or more record IDs to find
   * @returns The found record or null if not found
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.find(1); // => { id: 1, name: 'John' }
   * users.find(1, 2, 3); // => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   */
  find(...ids: TId[]): null | DbRecord<TId> | DbRecord<TId>[] {
    const records = ids.map((id) => this.records.get(id)).filter(Boolean) as DbRecord<TId>[];

    if (ids.length === 1) {
      return records[0] || null;
    }
    return records;
  }

  /**
   * Finds the first record matching the query.
   * @param query - Query attributes to match the record
   * @returns The first matching record or null
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.findBy({ name: 'John' }); // => { id: 1, name: 'John' }
   * users.findBy({ name: 'John', age: 30 }); // => null
   */
  findBy(query: Partial<DbRecord<TId>>): DbRecord<TId> | null {
    return this.all().find((record) => this.matchesQuery(record, query)) || null;
  }

  /**
   * Finds records matching the given query.
   * @param query - Either an object with model attributes to match or a predicate function
   * @returns Array of matching records
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.where({ name: 'John' }); // => [{ id: 1, name: 'John' }]
   * users.where((record) => record.name === 'John' || record.name === 'Jane'); // => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   */
  where(query: Partial<DbRecord<TId>> | ((record: DbRecord<TId>) => boolean)): DbRecord<TId>[] {
    return this.all().filter((record) => {
      if (typeof query === 'function') {
        return query(record);
      }
      return this.matchesQuery(record, query);
    });
  }

  // -- Mutation Methods --

  /**
   * Finds the first record matching the query or creates a new one.
   * @param query - Query attributes to match the record
   * @param attrs - Attributes to use when creating a new record
   * @returns The found or newly created record
   */
  firstOrCreate(query: Partial<DbRecord<TId>>, attrs: Partial<DbRecord<TId>> = {}): DbRecord<TId> {
    const existingRecord = this.findBy(query);
    if (existingRecord) {
      return existingRecord;
    }

    const newRecord = this.prepareRecord(attrs);
    this.records.set(newRecord.id, newRecord);
    return newRecord;
  }

  /**
   * Inserts a single record into the collection.
   * @param data - The record to insert.
   * @returns The inserted record.
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.insert({ name: 'John' }); // => { id: 1, name: 'John' }
   */
  insert(data: Partial<DbRecord<TId>>): DbRecord<TId> {
    const record = this.prepareRecord(data);
    this.records.set(record.id, record);
    return record;
  }

  /**
   * Inserts multiple records into the collection in a single operation.
   * @param data - Array of records to insert.
   * @returns Array of inserted records.
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.insertMany([{ name: 'John' }, { name: 'Jane' }]); // => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   */
  insertMany(data: Partial<DbRecord<TId>>[]): DbRecord<TId>[] {
    const records = data.map((record) => this.prepareRecord(record));
    records.forEach((record) => this.records.set(record.id, record));
    return records;
  }

  /**
   * Updates records in the collection.
   * @param idOrData - Either the ID of the record to update, or data object that may include an ID or query
   * @param attrs - The attributes to update the record(s) with
   * @returns The updated record(s) or null if not found
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.update({ name: 'John' }); // => [{ id: 1, name: 'John' }, { id: 2, name: 'John' }]
   * users.update(1, { name: 'John' }); // => { id: 1, name: 'John' }
   * users.update({ name: 'John' }, { age: 30 }); // => [{ id: 1, name: 'John', age: 30 }]
   */
  update(
    idOrData: TId | Partial<DbRecord<TId>>,
    attrs?: Partial<DbRecord<TId>>,
  ): DbRecord<TId> | DbRecord<TId>[] | null {
    // Case 1: Only attrs are passed - update all records
    if (!attrs) {
      if (typeof idOrData !== 'object' || idOrData === null) {
        throw new Error('The first argument must be an object if no attrs are provided');
      }

      if (this.records.size === 0) return [];

      const updatedRecords = this.all();
      updatedRecords.forEach((record) => Object.assign(record, idOrData));
      return updatedRecords;
    }

    // Case 2: ID and attrs are passed - update specific record by ID
    if (typeof idOrData !== 'object' || idOrData === null) {
      const record = this.records.get(idOrData as TId);
      if (!record) return null;

      Object.assign(record, attrs);
      return record;
    }

    // Case 3: Query and attrs are passed - update first matching record
    const record = this.findBy(idOrData);
    if (!record) return null;

    Object.assign(record, attrs);
    return record;
  }

  /**
   * Removes records from the collection.
   * If an ID is provided, removes that specific record.
   * If a query is provided, removes all records matching the query.
   * @param idOrQuery - Either the ID of the record to remove or query attributes to match
   * @returns Array of remaining records in the collection
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.remove(1); // => [{ id: 2, name: 'Jane' }]
   * users.remove({ name: 'John' }); // => [{ id: 2, name: 'Jane' }]
   */
  remove(idOrQuery: TId | Partial<DbRecord<TId>>): DbRecord<TId>[] {
    // Case 1: ID is passed - remove specific record
    if (typeof idOrQuery !== 'object' || idOrQuery === null) {
      this.records.delete(idOrQuery as TId);
      return this.all();
    }

    // Case 2: Query attributes are passed - remove all matching records
    const matchingRecords = this.where(idOrQuery);
    matchingRecords.forEach((record) => {
      this.records.delete(record.id);
    });

    return this.all();
  }

  /**
   * Clears the collection.
   */
  clear(): void {
    this.records.clear();
  }

  // -- Utility Private Methods --

  /**
   * Prepares a record for insertion by generating an ID if it doesn't exist.
   * @param data - The record to prepare.
   * @returns The prepared record.
   */
  private prepareRecord(data: Partial<DbRecord<TId>>): DbRecord<TId> {
    const record = { ...data };
    if (!record.id) {
      record.id = this.identityManager.fetch();
    } else {
      this.identityManager.set(record.id);
    }
    return record as DbRecord<TId>;
  }

  /**
   * Checks if a record matches a query.
   * @param record - The record to check.
   * @param query - The query to match against.
   * @returns true if the record matches the query, false otherwise.
   */
  private matchesQuery(record: DbRecord<TId>, query: Partial<DbRecord<TId>>): boolean {
    return Object.entries(query).every(([key, value]) => String(record[key]) === String(value));
  }
}

// -- Types --

export interface DbRecord<TId = number> {
  id: TId;
  [key: string]: any;
}

export interface DbCollectionOptions<TId = number> {
  identityManager?: IdentityManager<TId>;
  initialData?: DbRecord<TId>[];
  name: string;
}
