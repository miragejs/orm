import type {
  DbRecord,
  FieldOps,
  OrderBy,
  Primitive,
  QueryOptions,
  Where,
  WhereHelperFns,
} from './types';

/**
 * QueryManager handles advanced querying, filtering, sorting, and pagination for DbCollection.
 * Separates query logic from storage management.
 * @template TRecord - The record type
 */
export default class QueryManager<TRecord extends DbRecord> {
  /**
   * Executes a query against a set of records.
   * @param records - All records to query
   * @param options - Query options
   * @returns Object containing filtered/paginated records and total count before pagination
   */
  query(
    records: TRecord[],
    options: QueryOptions<TRecord>,
  ): { records: TRecord[]; total: number } {
    let results = records;
    const { cursor, limit, offset, orderBy, where } = options;

    // Apply where filter
    if (where) {
      if (typeof where === 'function') {
        const helpers = this._buildWhereHelpers();
        results = results.filter((record) => where(record, helpers));
      } else {
        results = results.filter((record) => this.matchesWhere(record, where));
      }
    }

    // Apply sorting
    if (orderBy) {
      results = this._applyOrder(results, orderBy);
    }

    // Capture total count BEFORE pagination (after filtering and sorting)
    const total = results.length;

    // Apply cursor-based pagination (keyset)
    if (cursor && orderBy) {
      results = this._applyCursor(results, orderBy, cursor);
    }

    // Apply offset pagination
    if (typeof offset === 'number' && offset > 0) {
      results = results.slice(offset);
    }

    // Apply limit
    if (typeof limit === 'number') {
      if (limit === 0) {
        return { records: [], total };
      }
      if (limit > 0) {
        results = results.slice(0, limit);
      }
    }

    return { records: results, total };
  }

  /**
   * Checks if a record matches a simple predicate object (equality matching).
   * @param record - The record to check
   * @param predicate - The predicate object with field-value pairs
   * @returns True if all predicate fields match the record
   */
  matchesPredicateObject(
    record: TRecord,
    predicate: Partial<TRecord>,
  ): boolean {
    return Object.entries(predicate).every(
      ([key, value]) => String(record[key as keyof TRecord]) === String(value),
    );
  }

  /**
   * Checks if a record matches a Where clause with logical operators.
   * @param record - The record to check
   * @param where - The where clause
   * @returns True if the record matches
   */
  matchesWhere(record: TRecord, where: Where<TRecord>): boolean {
    const { AND, OR, NOT, ...fields } = where as Record<string, unknown>;

    // Check field-level conditions
    for (const key in fields) {
      const fieldValue = record[key as keyof TRecord];
      const condition = fields[key];

      // Direct equality check or field operations
      if (
        condition !== null &&
        typeof condition === 'object' &&
        !Array.isArray(condition)
      ) {
        if (!this._matchesField(fieldValue, condition as FieldOps<unknown>)) {
          return false;
        }
      } else {
        // Simple equality
        if (fieldValue !== condition) {
          return false;
        }
      }
    }

    // Logical AND
    if (
      Array.isArray(AND) &&
      !AND.every((w: Where<TRecord>) => this.matchesWhere(record, w))
    ) {
      return false;
    }

    // Logical OR
    if (
      Array.isArray(OR) &&
      !OR.some((w: Where<TRecord>) => this.matchesWhere(record, w))
    ) {
      return false;
    }

    // Logical NOT
    if (NOT && this.matchesWhere(record, NOT)) {
      return false;
    }

    return true;
  }

  /**
   * Checks if a field value matches field operations (eq, ne, gt, lt, like, etc.).
   * @param value - The field value
   * @param ops - The field operations
   * @returns True if the value matches the operations
   */
  private _matchesField(value: unknown, ops: FieldOps<unknown>): boolean {
    // Equality operations
    if ('eq' in ops && value !== ops.eq) return false;
    if ('ne' in ops && value === ops.ne) return false;
    if ('in' in ops && ops.in && !ops.in.includes(value as never)) return false;
    if ('nin' in ops && ops.nin && ops.nin.includes(value as never))
      return false;
    if ('isNull' in ops) {
      const isNull = value == null;
      if (ops.isNull && !isNull) return false;
      if (!ops.isNull && isNull) return false;
    }

    // Range operations
    if (
      'lt' in ops &&
      ops.lt != null &&
      !this._compareValues(value, ops.lt, '<')
    )
      return false;
    if (
      'lte' in ops &&
      ops.lte != null &&
      !this._compareValues(value, ops.lte, '<=')
    )
      return false;
    if (
      'gt' in ops &&
      ops.gt != null &&
      !this._compareValues(value, ops.gt, '>')
    )
      return false;
    if (
      'gte' in ops &&
      ops.gte != null &&
      !this._compareValues(value, ops.gte, '>=')
    )
      return false;
    if (
      'between' in ops &&
      ops.between &&
      Array.isArray(ops.between) &&
      ops.between.length === 2
    ) {
      const [min, max] = ops.between;
      if (
        !this._compareValues(value, min, '>=') ||
        !this._compareValues(value, max, '<=')
      ) {
        return false;
      }
    }

    // String operations
    if ('like' in ops && typeof ops.like === 'string') {
      const regex = this._likeToRegex(ops.like, false);
      if (!regex.test(String(value))) return false;
    }
    if ('ilike' in ops && typeof ops.ilike === 'string') {
      const regex = this._likeToRegex(ops.ilike, true);
      if (!regex.test(String(value))) return false;
    }
    if ('startsWith' in ops && typeof ops.startsWith === 'string') {
      if (!String(value).startsWith(ops.startsWith)) return false;
    }
    if ('endsWith' in ops && typeof ops.endsWith === 'string') {
      if (!String(value).endsWith(ops.endsWith)) return false;
    }
    if ('contains' in ops && ops.contains && typeof ops.contains === 'string') {
      if (!String(value).includes(ops.contains)) return false;
    }

    // Array operations
    if ('contains' in ops && Array.isArray(value)) {
      const needle = ops.contains;
      if (Array.isArray(needle)) {
        if (!needle.every((item) => value.includes(item))) return false;
      } else {
        if (!value.includes(needle as never)) return false;
      }
    }
    if ('length' in ops && ops.length && Array.isArray(value)) {
      if (!this._matchesField(value.length, ops.length as FieldOps<unknown>))
        return false;
    }

    return true;
  }

  /**
   * Compare two values with an operator.
   * @param a - First value
   * @param b - Second value
   * @param op - Comparison operator
   * @returns True if the comparison holds
   */
  private _compareValues(
    a: unknown,
    b: unknown,
    op: '<' | '<=' | '>' | '>=',
  ): boolean {
    // Handle null/undefined
    if (a == null || b == null) return false;

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      const aTime = a.getTime();
      const bTime = b.getTime();
      switch (op) {
        case '<':
          return aTime < bTime;
        case '<=':
          return aTime <= bTime;
        case '>':
          return aTime > bTime;
        case '>=':
          return aTime >= bTime;
      }
    }

    // Handle numbers and strings
    switch (op) {
      case '<':
        return (a as Primitive) < (b as Primitive);
      case '<=':
        return (a as Primitive) <= (b as Primitive);
      case '>':
        return (a as Primitive) > (b as Primitive);
      case '>=':
        return (a as Primitive) >= (b as Primitive);
    }
  }

  /**
   * Converts SQL LIKE pattern to RegExp.
   * @param pattern - SQL LIKE pattern with % wildcards
   * @param caseInsensitive - Whether to match case-insensitively
   * @returns Regular expression
   */
  private _likeToRegex(pattern: string, caseInsensitive: boolean): RegExp {
    // Escape special regex characters except %
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Replace % with .*
    const regexPattern = '^' + escaped.replace(/%/g, '.*') + '$';
    return new RegExp(regexPattern, caseInsensitive ? 'i' : '');
  }

  /**
   * Sorts records by orderBy specification.
   * @param records - Records to sort
   * @param orderBy - Order specification
   * @returns Sorted records
   */
  private _applyOrder(
    records: TRecord[],
    orderBy: OrderBy<TRecord>,
  ): TRecord[] {
    // Convert orderBy to array of [field, direction] tuples
    const pairs: Array<readonly [keyof TRecord, 'asc' | 'desc']> =
      Array.isArray(orderBy)
        ? orderBy
        : (() => {
            const result: Array<[keyof TRecord, 'asc' | 'desc']> = [];
            for (const key in orderBy) {
              const direction = orderBy[key];
              if (direction) {
                result.push([key as keyof TRecord, direction]);
              }
            }
            return result;
          })();

    return [...records].sort((a, b) => {
      for (const [field, direction] of pairs) {
        const aVal = a[field];
        const bVal = b[field];

        // Handle nulls - nulls last
        if (aVal == null && bVal == null) continue;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Handle dates
        if (aVal instanceof Date && bVal instanceof Date) {
          const diff = aVal.getTime() - bVal.getTime();
          if (diff !== 0) return direction === 'desc' ? -diff : diff;
          continue;
        }

        // Handle primitives
        if (aVal < bVal) return direction === 'desc' ? 1 : -1;
        if (aVal > bVal) return direction === 'desc' ? -1 : 1;
      }
      return 0;
    });
  }

  /**
   * Applies cursor-based (keyset) pagination.
   * Filters records to those that come after the cursor position in the sort order.
   * @param records - Sorted records
   * @param orderBy - Order specification (must match cursor fields)
   * @param cursor - Cursor position
   * @returns Records after the cursor
   */
  private _applyCursor(
    records: TRecord[],
    orderBy: OrderBy<TRecord>,
    cursor: Partial<TRecord>,
  ): TRecord[] {
    const pairs: Array<readonly [keyof TRecord, 'asc' | 'desc']> =
      Array.isArray(orderBy)
        ? orderBy
        : (() => {
            const result: Array<[keyof TRecord, 'asc' | 'desc']> = [];
            for (const key in orderBy) {
              const direction = orderBy[key];
              if (direction) {
                result.push([key as keyof TRecord, direction]);
              }
            }
            return result;
          })();

    return records.filter((record) => {
      for (const [field, direction] of pairs) {
        const recordVal = record[field];
        const cursorVal = cursor[field];

        // If cursor doesn't specify this field, continue to next
        if (cursorVal === undefined) continue;

        // Compare values
        if (recordVal == null && cursorVal == null) continue;
        if (recordVal == null) return false; // null comes last, so it's not after cursor
        if (cursorVal == null) return true; // record is after null cursor

        // Handle dates
        if (recordVal instanceof Date && cursorVal instanceof Date) {
          const diff = recordVal.getTime() - cursorVal.getTime();
          if (diff === 0) continue; // Equal, check next field
          return direction === 'desc' ? diff < 0 : diff > 0;
        }

        // Handle primitives
        if (recordVal === cursorVal) continue; // Equal, check next field
        if (recordVal < cursorVal) return direction === 'desc'; // desc: keep smaller, asc: skip smaller
        if (recordVal > cursorVal) return direction === 'asc'; // asc: keep larger, desc: skip larger
      }

      // All fields matched cursor exactly, exclude this record (cursor is inclusive boundary)
      return false;
    });
  }

  /**
   * Builds helper functions for where callback predicates.
   * These are pure comparison utilities - users access record values themselves.
   * @returns Helper functions for comparisons
   */
  private _buildWhereHelpers(): WhereHelperFns<TRecord> {
    return {
      // Logical operators
      and: (...conditions) => conditions.every((c) => c),
      or: (...conditions) => conditions.some((c) => c),
      not: (condition) => !condition,

      // Comparison operators
      eq: (value, compareWith) => value === compareWith,
      ne: (value, compareWith) => value !== compareWith,
      gt: (value, compareWith) =>
        value != null &&
        compareWith != null &&
        (value as Primitive) > (compareWith as Primitive),
      gte: (value, compareWith) =>
        value != null &&
        compareWith != null &&
        (value as Primitive) >= (compareWith as Primitive),
      lt: (value, compareWith) =>
        value != null &&
        compareWith != null &&
        (value as Primitive) < (compareWith as Primitive),
      lte: (value, compareWith) =>
        value != null &&
        compareWith != null &&
        (value as Primitive) <= (compareWith as Primitive),
      between: (value, min, max) =>
        value != null &&
        min != null &&
        max != null &&
        (value as Primitive) >= (min as Primitive) &&
        (value as Primitive) <= (max as Primitive),

      // String operators
      like: (value, pattern) => {
        const regex = this._likeToRegex(pattern, false);
        return regex.test(String(value));
      },
      ilike: (value, pattern) => {
        const regex = this._likeToRegex(pattern, true);
        return regex.test(String(value));
      },
      startsWith: (value, prefix) => String(value).startsWith(prefix),
      endsWith: (value, suffix) => String(value).endsWith(suffix),
      containsText: (value, substring) => String(value).includes(substring),

      // Array operators
      inArray: (value, values) => values.some((v) => v === value),
      notInArray: (value, values) => !values.some((v) => v === value),

      // Null checks
      isNull: (value) => value == null,
      isNotNull: (value) => value != null,
    };
  }
}
