import type { IdType } from '@src/id-manager';

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
