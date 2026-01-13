import IdentityManager from '@src/id-manager/IdentityManager';
import type { Logger } from '@src/utils';

import QueryManager from './QueryManager';
import type {
  DbCollectionConfig,
  DbRecord,
  DbRecordInput,
  NewDbRecord,
  PaginatedResult,
  QueryOptions,
  Where,
} from './types';

/**
 * A collection of records in a database. Think of it as a table in a relational database.
 * @param config - Configuration for the collection.
 * @param config.name - The name of the collection.
 * @param config.identityManager - The identity manager instance for ID generation.
 * @param config.initialData - Initial data for the collection.
 * @example
 * const users = new DbCollection({ name: 'users' });
 * users.insert({ name: 'John' }); // => { id: "1", name: 'John' }
 */
export default class DbCollection<TRecord extends DbRecord = DbRecord> {
  name: string;
  identityManager: IdentityManager<TRecord['id']>;

  private _records: Map<TRecord['id'], TRecord> = new Map();
  private _queryManager: QueryManager<TRecord> = new QueryManager<TRecord>();
  private _logger?: Logger;

  constructor(name: string, config?: DbCollectionConfig<TRecord>) {
    this.name = name;
    this.identityManager =
      config?.identityManager ??
      new IdentityManager<TRecord['id']>({
        initialCounter: '1' as TRecord['id'],
      });
    this._logger = config?.logger;

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
   * Finds the first record that matches the given ID, predicate object, or query options.
   * @param input - ID, predicate object, or query options
   * @returns The first record that matches, or `null` if not found.
   * @example
   * ```typescript
   * // By ID
   * collection.find('user-1');
   *
   * // By predicate object (simple equality)
   * collection.find({ email: 'user@example.com' });
   *
   * // By query options (advanced filtering, sorting)
   * collection.find({
   *   where: { email: { ilike: '%@example.com' } },
   *   orderBy: { createdAt: 'desc' },
   * });
   * ```
   */
  find(
    input: TRecord['id'] | DbRecordInput<TRecord> | QueryOptions<TRecord>,
  ): TRecord | null {
    // 1. Handle ID-based lookup
    if (typeof input === 'string' || typeof input === 'number') {
      const record = this._records.get(input as TRecord['id']) ?? null;
      this._logger?.debug(`Found ${record ? 1 : 0} records in '${this.name}'`, {
        query: input,
        operation: 'find',
      });
      return record;
    }

    // 2. Check if it's QueryOptions (has where, orderBy, cursor, offset, or limit)
    const hasQueryKeys =
      typeof input === 'object' &&
      ('where' in input ||
        'orderBy' in input ||
        'cursor' in input ||
        'offset' in input ||
        'limit' in input);

    if (hasQueryKeys) {
      const query = { ...input, limit: 1 };
      const { records } = this._queryManager.query(this.all(), query);
      this._logger?.debug(`Found ${records.length} records in '${this.name}'`, {
        query,
        operation: 'find',
      });
      return records[0] ?? null;
    }

    // 3. Handle predicate object (simple equality matching)
    const predicate = input as DbRecordInput<TRecord>;
    const record =
      this.all().find((record) =>
        this._queryManager.matchesPredicateObject(record, predicate),
      ) ?? null;
    this._logger?.debug(`Found ${record ? 1 : 0} records in '${this.name}'`, {
      query: predicate,
      operation: 'find',
    });
    return record;
  }

  /**
   * Finds multiple records by IDs.
   * @param ids - Array of IDs to find
   * @returns An array of records that match
   */
  findMany(ids: TRecord['id'][]): TRecord[];

  /**
   * Finds multiple records by predicate object.
   * @param predicate - Predicate object for simple equality matching
   * @returns An array of records that match
   */
  findMany(predicate: DbRecordInput<TRecord>): TRecord[];

  /**
   * Finds multiple records by query options.
   * @param options - Query options for advanced filtering, sorting, pagination
   * @returns A paginated result with records and total count
   */
  findMany(options: QueryOptions<TRecord>): PaginatedResult<TRecord>;

  /**
   * Finds multiple records by IDs, predicate object, or query options.
   * @param input - Array of IDs, predicate object, or query options
   * @returns An array of records or paginated result depending on input type
   * @example
   * ```typescript
   * // By IDs - returns TRecord[]
   * collection.findMany(['user-1', 'user-2']);
   *
   * // By predicate object (simple equality) - returns TRecord[]
   * collection.findMany({ active: true });
   *
   * // By query options (advanced filtering, sorting, pagination) - returns PaginatedResult
   * collection.findMany({
   *   where: { age: { gte: 18 }, status: { in: ['active', 'pending'] } },
   *   orderBy: { createdAt: 'desc' },
   *   limit: 10,
   * });
   * // => { records: [...], total: 150 }
   * ```
   */
  findMany(
    input: TRecord['id'][] | DbRecordInput<TRecord> | QueryOptions<TRecord>,
  ): TRecord[] | PaginatedResult<TRecord> {
    // 1. Handle array of IDs
    if (Array.isArray(input)) {
      const records = input
        .map((id) => this._records.get(id))
        .filter(Boolean) as TRecord[];
      this._logger?.debug(`Found ${records.length} records in '${this.name}'`, {
        query: input,
        operation: 'findMany',
      });
      return records;
    }

    // 2. Check if it's QueryOptions (has where, orderBy, cursor, offset, or limit)
    const hasQueryKeys =
      typeof input === 'object' &&
      ('where' in input ||
        'orderBy' in input ||
        'cursor' in input ||
        'offset' in input ||
        'limit' in input);

    if (hasQueryKeys) {
      const query = input as QueryOptions<TRecord>;
      const result = this._queryManager.query(this.all(), query);
      this._logger?.debug(
        `Found ${result.records.length} records in '${this.name}'`,
        {
          query,
          total: result.total,
          operation: 'findMany',
        },
      );
      return result;
    }

    // 3. Handle predicate object (simple equality matching)
    const predicate = input as DbRecordInput<TRecord>;
    const records = this.all().filter((record) =>
      this._queryManager.matchesPredicateObject(record, predicate),
    );
    this._logger?.debug(`Found ${records.length} records in '${this.name}'`, {
      query: predicate,
      operation: 'findMany',
    });
    return records;
  }

  /**
   * Count records matching a where clause.
   * @param where - Optional where clause to filter records
   * @returns Number of matching records
   * @example
   * ```typescript
   * collection.count({ status: 'active' });
   * collection.count({ age: { gte: 18, lte: 65 } });
   * ```
   */
  count(where?: Where<TRecord>): number {
    if (!where) {
      return this.size;
    }
    return this._queryManager.query(this.all(), { where }).total;
  }

  /**
   * Check if any records match a where clause.
   * @param where - Optional where clause to filter records
   * @returns True if at least one record matches
   * @example
   * ```typescript
   * collection.exists({ email: 'user@example.com' });
   * collection.exists({ status: { in: ['active', 'pending'] } });
   * ```
   */
  exists(where?: Where<TRecord>): boolean {
    if (!where) {
      return !this.isEmpty;
    }
    return (
      this._queryManager.query(this.all(), { where, limit: 1 }).records.length >
      0
    );
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
    this._logger?.debug(`Inserted record into '${this.name}'`, {
      id: record.id,
      record,
    });

    return record;
  }

  /**
   * Inserts multiple records into the collection.
   * @param data - An array of record data to insert.
   * @returns An array of the inserted records.
   */
  insertMany(data: NewDbRecord<TRecord>[]): TRecord[] {
    const records = data.map((record) => this.insert(record));
    const ids = records.map((r) => r.id);

    this._logger?.debug(
      `Inserted ${records.length} records into '${this.name}'`,
      {
        ids,
        operation: 'insertMany',
      },
    );

    return records;
  }

  /**
   * Updates a single record by ID.
   * @param id - The record ID to update.
   * @param patch - The data to update the record with.
   * @returns The updated record, or `null` if the record was not found.
   */
  update(
    id: TRecord['id'],
    patch: TRecord | DbRecordInput<TRecord>,
  ): TRecord | null {
    const existingRecord = this._records.get(id);
    if (!existingRecord) {
      return null;
    }

    const updatedRecord = { ...existingRecord, ...patch } as TRecord;

    this._records.set(id, updatedRecord);
    this._logger?.debug(`Updated record in '${this.name}'`, {
      id,
      patch,
    });

    return updatedRecord;
  }

  /**
   * Updates multiple records by IDs, predicate object, or query options.
   * @param input - Array of IDs, predicate object, or query options to find records.
   * @param patch - The data to update the records with.
   * @returns Array of updated records.
   */
  updateMany(
    input: TRecord['id'][] | DbRecordInput<TRecord> | QueryOptions<TRecord>,
    patch: TRecord | DbRecordInput<TRecord>,
  ): TRecord[] {
    const recordsToUpdate = this._getRecordsFromFindMany(input);
    const updatedRecords = recordsToUpdate.map((record) => {
      const updated = { ...record, ...patch } as TRecord;
      this._records.set(record.id, updated);
      return updated;
    });
    const updatedIds = updatedRecords.map((r) => r.id);

    this._logger?.debug(
      `${updatedIds.length} records updated in '${this.name}'`,
      {
        ids: updatedIds,
        patch,
      },
    );

    return updatedRecords;
  }

  /**
   * Deletes a record from the collection by its ID.
   * @param id - The ID of the record to delete.
   * @returns `true` if the record was deleted, `false` if it was not found.
   */
  delete(id: TRecord['id']): boolean {
    const deleted = this._records.delete(id);
    if (deleted) {
      this._logger?.debug(`Deleted record from '${this.name}'`, { id });
    }
    return deleted;
  }

  /**
   * Deletes multiple records by IDs, predicate object, or query options.
   * @param input - Array of IDs, predicate object, or query options to find records.
   * @returns The number of records that were deleted.
   */
  deleteMany(
    input: TRecord['id'][] | DbRecordInput<TRecord> | QueryOptions<TRecord>,
  ): number {
    const recordsToDelete = this._getRecordsFromFindMany(input);
    const ids = recordsToDelete.map((r) => r.id);

    recordsToDelete.forEach((record) => this._records.delete(record.id));
    this._logger?.debug(`${ids.length} records deleted from '${this.name}'`, {
      ids,
    });

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
   * Extracts records from findMany result, handling both array and PaginatedResult.
   * @param input - Input to pass to findMany
   * @returns Array of records
   */
  private _getRecordsFromFindMany(
    input: TRecord['id'][] | DbRecordInput<TRecord> | QueryOptions<TRecord>,
  ): TRecord[] {
    // Handle each input type explicitly to avoid type narrowing issues
    if (Array.isArray(input)) {
      return this.findMany(input);
    }
    // Check if it's QueryOptions
    const hasQueryKeys =
      typeof input === 'object' &&
      ('where' in input ||
        'orderBy' in input ||
        'cursor' in input ||
        'offset' in input ||
        'limit' in input);
    if (hasQueryKeys) {
      return this.findMany(input as QueryOptions<TRecord>).records;
    }
    // Must be predicate object
    return this.findMany(input as DbRecordInput<TRecord>);
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
