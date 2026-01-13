import type { IdentityManager, IdType } from '@src/id-manager';
import type { Logger } from '@src/utils';

import type DbCollection from './DbCollection';

/**
 * Base record type with an ID field
 * @template TId - The type of the ID field
 */
export type DbRecord<TId = IdType> = {
  id: TId;
};

/**
 * Type for input data when creating or updating a record
 * @template TRecord - The type of the record's attributes
 */
export type DbRecordInput<TRecord extends DbRecord> = Partial<TRecord>;

/**
 * Type for new record with optional id
 * @template TRecord - The type of the record's attributes
 */
export type NewDbRecord<TRecord extends DbRecord> = Omit<TRecord, 'id'> & {
  id?: TRecord['id'] | null;
};

/**
 * Type for query conditions that can be used to find records
 * @template TRecord - The type of the record's attributes
 */
export type DbQuery<TRecord extends DbRecord> =
  | DbRecordInput<TRecord>
  | ((record: TRecord) => boolean);

/**
 * Type for update operations
 * @template TRecord - The type of the record's attributes
 */
export type DbUpdateInput<TRecord extends DbRecord> =
  | TRecord['id']
  | DbRecordInput<TRecord>;

/**
 * Type for database collections
 */
export type DbCollections = Record<string, DbCollection<any>>;

/**
 * Infers the collection type from data records
 * @template TData - The type of data records
 */
export type DbCollectionFromStaticData<TData> =
  TData extends Array<infer TRecord>
    ? TRecord extends DbRecord
      ? DbCollection<TRecord>
      : DbCollection<DbRecord>
    : DbCollection<DbRecord>;

/**
 * Infers collections map from data object
 * @template TData - The type of data object
 */
export type DbCollectionsFromStaticData<TData> = {
  [K in keyof TData]: DbCollectionFromStaticData<TData[K]>;
};

/**
 * Gets the data of a collection
 * @template T - The type of the collection
 */
export type DbCollectionData<T> =
  T extends DbCollection<infer TAttrs> ? TAttrs[] : never;

/**
 * Configuration for creating a database collection
 * @template TRecord - The type of the record's attributes
 */
export interface DbCollectionConfig<TRecord extends DbRecord> {
  /**
   * Identity manager instance for ID generation.
   * If not provided, a default manager with string IDs starting from "1" will be used.
   */
  identityManager?: IdentityManager<TRecord['id']>;
  initialData?: TRecord[];
  logger?: Logger;
}

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
  logger?: Logger;
};

// -- QUERY API TYPES --

/**
 * Primitive types that support comparison operations
 */
export type Primitive = string | number | boolean | Date;

/**
 * Order direction for sorting
 */
export type OrderDirection = 'asc' | 'desc';

/**
 * Defines ordering for query results
 * Can be an object mapping fields to directions, or an array of [field, direction] tuples
 * @template TRecord - The record type
 */
export type OrderBy<TRecord> =
  | Partial<Record<keyof TRecord, OrderDirection>>
  | Array<readonly [keyof TRecord, OrderDirection]>;

/**
 * Equality and membership operations
 * @template T - The field type
 */
export type EqualityOps<T> = {
  /** Equals */
  eq?: T;
  /** Not equals */
  ne?: T;
  /** In array */
  in?: T[];
  /** Not in array */
  nin?: T[];
  /** Is null or undefined */
  isNull?: boolean;
};

/**
 * Range comparison operations for primitive types
 * @template T - The primitive field type
 */
export type RangeOps<T extends Primitive> = {
  /** Less than */
  lt?: T;
  /** Less than or equal */
  lte?: T;
  /** Greater than */
  gt?: T;
  /** Greater than or equal */
  gte?: T;
  /** Between two values (inclusive) */
  between?: readonly [T, T];
};

/**
 * String-specific operations
 */
export type StringOps = {
  /** SQL-like pattern matching with % wildcards */
  like?: string;
  /** Case-insensitive like */
  ilike?: string;
  /** Starts with prefix */
  startsWith?: string;
  /** Ends with suffix */
  endsWith?: string;
  /** Contains substring */
  contains?: string;
};

/**
 * Array-specific operations
 * @template E - The array element type
 */
export type ArrayOps<E> = {
  /** Array contains element(s) */
  contains?: E | E[];
  /** Array length operations */
  length?: RangeOps<number>;
};

/**
 * All available field operations based on field type
 * @template T - The field type
 */
export type FieldOps<T> = EqualityOps<T> &
  (T extends string ? StringOps : {}) &
  (T extends Primitive ? RangeOps<T> : {}) &
  (T extends readonly (infer E)[] ? ArrayOps<E> : {});

/**
 * Leaf-level where clause for field matching
 * Fields can be matched by direct value or by field operations
 * @template TRecord - The record type
 */
export type WhereLeaf<TRecord> = {
  [K in keyof TRecord]?: TRecord[K] | FieldOps<TRecord[K]>;
};

/**
 * Complete where clause with logical operators
 * @template TRecord - The record type
 */
export type Where<TRecord> = WhereLeaf<TRecord> & {
  /** Logical AND - all conditions must match */
  AND?: Where<TRecord>[];
  /** Logical OR - at least one condition must match */
  OR?: Where<TRecord>[];
  /** Logical NOT - condition must not match */
  NOT?: Where<TRecord>;
};

/**
 * Simple predicate object for equality matching
 * @template TRecord - The record type
 */
export type PredicateObject<TRecord> = Partial<TRecord>;

/**
 * Helper functions for use in where callback predicates
 * These are comparison utilities - users access record values and pass them to helpers
 * @template TRecord - The record type
 */
export type WhereHelperFns<TRecord> = {
  // Logical operators
  /** Logical AND - all conditions must be true */
  and: (...conditions: boolean[]) => boolean;
  /** Logical OR - at least one condition must be true */
  or: (...conditions: boolean[]) => boolean;
  /** Logical NOT - inverts the condition */
  not: (condition: boolean) => boolean;

  // Comparison operators
  /** Check equality */
  eq: (value: any, compareWith: any) => boolean;
  /** Check inequality */
  ne: (value: any, compareWith: any) => boolean;
  /** Greater than */
  gt: (value: any, compareWith: any) => boolean;
  /** Greater than or equal */
  gte: (value: any, compareWith: any) => boolean;
  /** Less than */
  lt: (value: any, compareWith: any) => boolean;
  /** Less than or equal */
  lte: (value: any, compareWith: any) => boolean;
  /** Between two values (inclusive) */
  between: (value: any, min: any, max: any) => boolean;

  // String operators
  /** SQL-like pattern matching */
  like: (value: string, pattern: string) => boolean;
  /** Case-insensitive like */
  ilike: (value: string, pattern: string) => boolean;
  /** Starts with string */
  startsWith: (value: string, prefix: string) => boolean;
  /** Ends with string */
  endsWith: (value: string, suffix: string) => boolean;
  /** Contains substring */
  containsText: (value: string, substring: string) => boolean;

  // Array operators
  /** In array */
  inArray: (value: any, values: any[]) => boolean;
  /** Not in array */
  notInArray: (value: any, values: any[]) => boolean;

  // Null checks
  /** Is null or undefined */
  isNull: (value: any) => boolean;
  /** Is not null and not undefined */
  isNotNull: (value: any) => boolean;
};

/**
 * Query options for finding records
 * @template TRecord - The record type
 */
export interface QueryOptions<TRecord> {
  /** Filter criteria - object DSL or callback function */
  where?:
    | Where<TRecord>
    | ((record: TRecord, helpers: WhereHelperFns<TRecord>) => boolean);
  /** Sorting specification */
  orderBy?: OrderBy<TRecord>;
  /** Number of records to skip (offset pagination) */
  offset?: number;
  /** Maximum number of records to return */
  limit?: number;
  /** Cursor for keyset pagination (must align with orderBy fields) */
  cursor?: Partial<TRecord>;
}

/**
 * Result type for paginated queries
 * @template TRecord - The record type
 */
export interface PaginatedResult<TRecord> {
  /** The matching records (after pagination applied) */
  records: TRecord[];
  /** Total count of records matching the where clause (before pagination) */
  total: number;
}
