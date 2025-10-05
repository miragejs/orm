import { IdentityManager, StringIdentityManager } from '@src/id-manager';

import type { DbCollectionConfig, DbRecord, DbRecordInput, DbQuery, NewDbRecord } from './types';

/**
 * A collection of records in a database. Think of it as a table in a relational database.
 * @param config - Configuration for the collection.
 * @param config.name - The name of the collection.
 * @param config.identityManager - The identity manager for the collection.
 * @param config.initialData - Initial data for the collection.
 * @example
 * const users = new DbCollection({ name: 'users' });
 * users.insert({ name: 'John' }); // => { id: "1", name: 'John' }
 */
export default class DbCollection<TRecord extends DbRecord = DbRecord> {
  name: string;
  identityManager: IdentityManager<TRecord['id']>;

  private _records: Map<TRecord['id'], TRecord> = new Map();

  constructor(name: string, config?: DbCollectionConfig<TRecord>) {
    this.name = name;
    this.identityManager =
      config?.identityManager ?? (new StringIdentityManager() as IdentityManager<TRecord['id']>);

    if (config?.initialData) {
      this.insertMany(config.initialData);
    }
  }

  // -- UTILITY METHODS --

  /**
   * The next ID for the collection.
   * @returns The next ID for the collection.
   */
  get nextId(): TRecord['id'] {
    return this.identityManager.fetch();
  }

  /**
   * Returns the number of records in the collection.
   * @returns The number of records in the collection.
   */
  get size(): number {
    return this._records.size;
  }

  /**
   * Checks if the collection is empty.
   * @returns `true` if the collection is empty, `false` otherwise.
   */
  get isEmpty(): boolean {
    return this._records.size === 0;
  }

  // -- RECORDS ACCESSOR --

  /**
   * Returns all records in the collection
   * @returns An array of all records in the collection.
   */
  all(): TRecord[] {
    return Array.from(this._records.values());
  }

  /**
   * Gets a record by its index position in the collection.
   * @param index - The index of the record to get.
   * @returns The record at the specified index, or `undefined` if out of bounds.
   */
  at(index: number): TRecord | undefined {
    return this.all()[index];
  }

  /**
   * Returns the first record in the collection.
   * @returns The first record in the collection, or `undefined` if the collection is empty.
   */
  first(): TRecord | undefined {
    return this.all()[0];
  }

  /**
   * Returns the last record in the collection.
   * @returns The last record in the collection, or `undefined` if the collection is empty.
   */
  last(): TRecord | undefined {
    const records = this.all();
    return records[records.length - 1];
  }

  /**
   * Checks if a record exists in the collection.
   * @param id - The ID of the record to check.
   * @returns `true` if the record exists, `false` otherwise.
   */
  has(id: TRecord['id']): boolean {
    return this._records.has(id);
  }

  // -- QUERY METHODS --

  /**
   * Finds the first record that matches the given ID or query.
   * @param idOrQuery - The ID or query to match against.
   * @returns The first record that matches, or `null` if not found.
   */
  find(idOrQuery: TRecord['id'] | DbQuery<TRecord>): TRecord | null {
    // Handle ID-based lookup
    if (typeof idOrQuery === 'string' || typeof idOrQuery === 'number') {
      return this._records.get(idOrQuery as TRecord['id']) ?? null;
    }

    // Handle query-based lookup
    const query = idOrQuery as DbQuery<TRecord>;
    if (typeof query === 'function') {
      return this.all().find(query) ?? null;
    }

    // Handle object-based query
    return this.all().find((record) => this._matchesQuery(record, query)) ?? null;
  }

  /**
   * Finds multiple records by their IDs or query.
   * @param idsOrQuery - Array of IDs or a query to match against.
   * @returns An array of records that match the IDs or query.
   */
  findMany(idsOrQuery: TRecord['id'][] | DbQuery<TRecord>): TRecord[] {
    // Handle multiple ID lookup
    if (Array.isArray(idsOrQuery)) {
      return idsOrQuery.map((id) => this._records.get(id)).filter(Boolean) as TRecord[];
    }

    // Handle query-based lookup
    const query = idsOrQuery as DbQuery<TRecord>;
    if (typeof query === 'function') {
      return this.all().filter(query);
    }

    // Handle object-based query
    return this.all().filter((record) => this._matchesQuery(record, query));
  }

  // -- MUTATION METHODS --

  /**
   * Inserts a new record into the collection.
   * @param data - The record data to insert.
   * @returns The inserted record.
   */
  insert(data: NewDbRecord<TRecord>): TRecord {
    const record = this._prepareRecord(data);
    this._records.set(record.id, record);
    return record;
  }

  /**
   * Inserts multiple records into the collection.
   * @param data - An array of record data to insert.
   * @returns An array of the inserted records.
   */
  insertMany(data: NewDbRecord<TRecord>[]): TRecord[] {
    return data.map((record) => this.insert(record));
  }

  /**
   * Updates a single record by ID.
   * @param id - The record ID to update.
   * @param patch - The data to update the record with.
   * @returns The updated record, or `null` if the record was not found.
   */
  update(id: TRecord['id'], patch: TRecord | DbRecordInput<TRecord>): TRecord | null {
    const existingRecord = this._records.get(id);
    if (!existingRecord) {
      return null;
    }
    const updatedRecord = { ...existingRecord, ...patch } as TRecord;
    this._records.set(id, updatedRecord);
    return updatedRecord;
  }

  /**
   * Updates multiple records by IDs or query.
   * @param idsOrQuery - Array of IDs or query to find records to update.
   * @param patch - The data to update the records with.
   * @returns Array of updated records.
   */
  updateMany(
    idsOrQuery: TRecord['id'][] | DbQuery<TRecord>,
    patch: TRecord | DbRecordInput<TRecord>,
  ): TRecord[] {
    const recordsToUpdate = this.findMany(idsOrQuery);
    const updatedRecords = recordsToUpdate.map((record) => {
      const updated = { ...record, ...patch } as TRecord;
      this._records.set(record.id, updated);
      return updated;
    });
    return updatedRecords;
  }

  /**
   * Deletes a record from the collection by its ID.
   * @param id - The ID of the record to delete.
   * @returns `true` if the record was deleted, `false` if it was not found.
   */
  delete(id: TRecord['id']): boolean {
    return this._records.delete(id);
  }

  /**
   * Deletes multiple records by IDs or query.
   * @param idsOrQuery - Array of IDs or query to find records to delete.
   * @returns The number of records that were deleted.
   */
  deleteMany(idsOrQuery: TRecord['id'][] | DbQuery<TRecord>): number {
    const recordsToDelete = this.findMany(idsOrQuery);
    recordsToDelete.forEach((record) => this.delete(record.id));
    return recordsToDelete.length;
  }

  /**
   * Removes all records from the collection.
   */
  clear(): void {
    this._records.clear();
    this.identityManager.reset();
  }

  // -- PRIVATE METHODS --

  /**
   * Checks if a record matches the given query.
   * @param record - The record to check.
   * @param query - The query to match against.
   * @returns `true` if the record matches the query, `false` otherwise.
   */
  private _matchesQuery(record: TRecord, query: DbRecordInput<TRecord>): boolean {
    return Object.entries(query).every(
      ([key, value]) => String(record[key as keyof TRecord]) === String(value),
    );
  }

  /**
   * Prepares a record for insertion by generating an ID if it doesn't exist.
   * @param data - The record to prepare.
   * @returns The prepared record.
   */
  private _prepareRecord(data: NewDbRecord<TRecord>): TRecord {
    const record = { ...data } as TRecord;
    if (!record.id) {
      record.id = this.identityManager.fetch();
    } else {
      this.identityManager.set(record.id);
    }
    return record;
  }
}
