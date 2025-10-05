import type { IdentityManager, IdType } from '@src/id-manager';

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
export type DbUpdateInput<TRecord extends DbRecord> = TRecord['id'] | DbRecordInput<TRecord>;

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
export type DbCollectionData<T> = T extends DbCollection<infer TAttrs> ? TAttrs[] : never;

/**
 * Configuration for creating a database collection
 * @template TRecord - The type of the record's attributes
 */
export interface DbCollectionConfig<TRecord extends DbRecord> {
  identityManager?: IdentityManager<TRecord['id']>;
  initialData?: TRecord[];
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
};
