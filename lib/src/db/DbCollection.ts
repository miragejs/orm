import { IdentityManager, StringIdentityManager } from '@src/id-manager';

import type { DbRecord, DbRecordInput, DbQuery } from './types';

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

  // -- RECORDS ACCESSOR --

  /**
   * The next ID for the collection.
   * @returns The next ID for the collection.
   */
  get nextId(): TRecord['id'] {
    return this.identityManager.fetch();
  }

  /**
   * All records in the collection.
   * @returns An array of all records in the collection.
   */
  get records(): TRecord[] {
    return Array.from(this._records.values());
  }

  // -- QUERY METHODS --

  /**
   * Returns all records in the collection
   * @returns An array of all records in the collection.
   */
  all(): TRecord[] {
    return this.records;
  }

  /**
   * Finds a record by its ID.
   * @param id - The ID of the record to find.
   * @returns The record with the specified ID, or `undefined` if not found.
   */
  find(id: TRecord['id']): TRecord | undefined;

  /**
   * Finds multiple records by their IDs.
   * @param ids - The IDs of the records to find.
   * @returns An array of records that match the IDs.
   */
  find(...ids: TRecord['id'][]): TRecord[];

  /**
   * Finds all records that match the given query.
   * @param query - The query to match against.
   * @returns An array of records that match the query.
   */
  find(query: DbQuery<TRecord>): TRecord[];

  /**
   * Finds a record or multiple records based on the query provided.
   * @param queryOrId - The query or ID to match against.
   * @param additionalIds - Additional IDs to find.
   * @returns The record or records that match the query or ID.
   */
  find(
    queryOrId: TRecord['id'] | DbQuery<TRecord>,
    ...additionalIds: TRecord['id'][]
  ): TRecord | TRecord[] | null {
    // Handle multiple ID lookup
    if (
      (typeof queryOrId === 'string' || typeof queryOrId === 'number') &&
      additionalIds.length > 0
    ) {
      const allIds = [queryOrId as TRecord['id'], ...additionalIds];
      return allIds.map((id) => this._records.get(id)).filter(Boolean) as TRecord[];
    }

    // Handle single ID-based lookup
    if (typeof queryOrId === 'string' || typeof queryOrId === 'number') {
      return this._records.get(queryOrId as TRecord['id']) ?? null;
    }

    // Handle query-based lookup
    const query = queryOrId as DbQuery<TRecord>;
    if (typeof query === 'function') {
      return this.records.filter(query);
    }

    // Handle object-based query
    return this.records.filter((record) => this._matchesQuery(record, query));
  }

  /**
   * Finds the first record that matches the given query.
   * @param query - The query to match against.
   * @returns The first record that matches the query, or `null` if not found.
   */
  findBy(query: DbQuery<TRecord>): TRecord | null {
    if (typeof query === 'function') {
      return this.records.find(query) ?? null;
    }

    return this.records.find((record) => this._matchesQuery(record, query)) ?? null;
  }

  /**
   * Finds all records that match the given query.
   * @param query - The query to match against.
   * @returns An array of records that match the query.
   */
  where(query: DbQuery<TRecord>): TRecord[] {
    if (typeof query === 'function') {
      return this.records.filter(query);
    }

    return this.records.filter((record) => this._matchesQuery(record, query));
  }

  // -- MUTATION METHODS --

  /**
   * Inserts a new record into the collection.
   * @param data - The record data to insert.
   * @returns The inserted record.
   */
  insert(data: DbRecordInput<TRecord>): TRecord {
    const record = this._prepareRecord(data);
    this._records.set(record.id, record);
    return record;
  }

  /**
   * Inserts multiple records into the collection.
   * @param data - An array of record data to insert.
   * @returns An array of the inserted records.
   */
  insertMany(data: DbRecordInput<TRecord>[]): TRecord[] {
    return data.map((record) => this.insert(record));
  }

  /**
   * Updates a record by ID.
   * @param id - The record ID to update.
   * @param data - The new data to update the record with.
   * @returns The updated record, or `undefined` if the record was not found.
   */
  update(id: TRecord['id'], data: DbRecordInput<TRecord>): TRecord | undefined;

  /**
   * Updates a record using partial data (must include ID).
   * @param data - The partial record data including ID to update.
   * @returns The updated record, or `undefined` if the record was not found.
   */
  update(data: DbRecordInput<TRecord> & { id: TRecord['id'] }): TRecord | undefined;

  /**
   * Updates records by query.
   * @param query - The query to find records to update.
   * @param data - The new data to update the records with.
   * @returns Array of updated records.
   */
  update(query: DbRecordInput<TRecord>, data: DbRecordInput<TRecord>): TRecord[];

  /**
   * Updates all records with the provided data.
   * @param data - The data to update all records with.
   * @returns Array of all updated records.
   */
  update(data: DbRecordInput<TRecord>): TRecord[];

  /**
   * Updates a record or multiple records by ID or query.
   * @param updateInputOrData - The ID or query to update.
   * @param newData - The new data to update the record with.
   * @returns The updated record or records, or `undefined` if the record was not found.
   */
  update(
    updateInputOrData: TRecord['id'] | DbRecordInput<TRecord>,
    newData?: DbRecordInput<TRecord>,
  ): TRecord | TRecord[] | undefined {
    // Case 1: update by ID with data
    if (typeof updateInputOrData === 'string' || typeof updateInputOrData === 'number') {
      if (!newData) {
        throw new Error('New data is required when updating by ID');
      }
      const id = updateInputOrData as TRecord['id'];
      const existingRecord = this._records.get(id);
      if (!existingRecord) {
        return undefined;
      }
      const updatedRecord = { ...existingRecord, ...newData } as TRecord;
      this._records.set(id, updatedRecord);
      return updatedRecord;
    }

    const updateObj = updateInputOrData as DbRecordInput<TRecord>;

    // Case 2: update with object that has ID
    if (updateObj.id && !newData) {
      const id = updateObj.id;
      const existingRecord = this._records.get(id);
      if (!existingRecord) {
        return undefined;
      }
      const updatedRecord = { ...existingRecord, ...updateObj } as TRecord;
      this._records.set(id, updatedRecord);
      return updatedRecord;
    }

    // Case 3: update by query with data
    if (newData) {
      const matchingRecords = this.where(updateObj);
      const updatedRecords = matchingRecords.map((record) => {
        const updated = { ...record, ...newData } as TRecord;
        this._records.set(record.id, updated);
        return updated;
      });
      return updatedRecords;
    }

    // Case 4: update all records with data
    const allRecords = this.records;
    const updatedRecords = allRecords.map((record) => {
      const updated = { ...record, ...updateObj } as TRecord;
      this._records.set(record.id, updated);
      return updated;
    });
    return updatedRecords;
  }

  /**
   * Removes a record from the collection by its ID.
   * @param id - The ID of the record to remove.
   * @returns `true` if the record was removed, `false` if it was not found.
   */
  remove(id: TRecord['id']): boolean {
    return this._records.delete(id);
  }

  /**
   * Removes all records that match the given query.
   * @param query - The query to match against.
   * @returns The number of records that were removed.
   */
  removeWhere(query: DbQuery<TRecord>): number {
    const recordsToRemove = this.where(query);
    recordsToRemove.forEach((record) => this.remove(record.id));
    return recordsToRemove.length;
  }

  /**
   * Removes all records from the collection.
   */
  clear(): void {
    this._records.clear();
    this.identityManager.reset();
  }

  // -- UTILITY METHODS --

  /**
   * Returns the number of records in the collection.
   * @returns The number of records in the collection.
   */
  get length(): number {
    return this._records.size;
  }

  /**
   * Checks if the collection is empty.
   * @returns `true` if the collection is empty, `false` otherwise.
   */
  get isEmpty(): boolean {
    return this._records.size === 0;
  }

  /**
   * Checks if a record exists in the collection.
   * @param id - The ID of the record to check.
   * @returns `true` if the record exists, `false` otherwise.
   */
  has(id: TRecord['id']): boolean {
    return this._records.has(id);
  }

  /**
   * Returns the first record in the collection.
   * @returns The first record in the collection, or `undefined` if the collection is empty.
   */
  first(): TRecord | undefined {
    return this.records[0];
  }

  /**
   * Returns the last record in the collection.
   * @returns The last record in the collection, or `undefined` if the collection is empty.
   */
  last(): TRecord | undefined {
    const records = this.records;
    return records[records.length - 1];
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
  private _prepareRecord(data: DbRecordInput<TRecord>): TRecord {
    const record = { ...data } as TRecord;
    if (!record.id) {
      record.id = this.identityManager.fetch();
    } else {
      this.identityManager.set(record.id);
    }
    return record;
  }
}

// -- Types --

/**
 * Configuration for creating a database collection
 * @template TRecord - The type of the record's attributes
 */
export interface DbCollectionConfig<TRecord extends DbRecord> {
  identityManager?: IdentityManager<TRecord['id']>;
  initialData?: TRecord[];
}
