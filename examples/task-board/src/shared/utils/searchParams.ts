/**
 * Schema definition for search params parsing
 * Maps param keys to their types: 'string' | 'number'
 */
export type ParamsSchema = Record<string, 'string' | 'number'>;

/**
 * Infer TypeScript type from schema
 */
export type InferParams<TSchema extends ParamsSchema> = {
  [K in keyof TSchema]: TSchema[K] extends 'number' ? number : string;
};

/**
 * Parse URL search params using a schema and defaults
 *
 * @param searchParams - URLSearchParams to parse
 * @param schema - Schema defining param types
 * @param defaults - Default values for each param
 * @returns Parsed params object with correct types
 *
 * @example
 * const schema = { page: 'number', sortBy: 'string' } as const;
 * const defaults = { page: 0, sortBy: 'name' };
 * const params = parseSearchParams(url.searchParams, schema, defaults);
 * // params: { page: number, sortBy: string }
 */
export function parseSearchParams<TSchema extends ParamsSchema>(
  searchParams: URLSearchParams,
  schema: TSchema,
  defaults: InferParams<TSchema>,
): InferParams<TSchema> {
  const result = { ...defaults };

  for (const key in schema) {
    const rawValue = searchParams.get(key);
    if (rawValue !== null) {
      if (schema[key] === 'number') {
        (result as Record<string, unknown>)[key] = parseInt(rawValue, 10);
      } else {
        (result as Record<string, unknown>)[key] = rawValue;
      }
    }
  }

  return result;
}

/**
 * Stringify params to URLSearchParams, omitting default values
 *
 * @param params - Params object to stringify
 * @param defaults - Default values (these will be omitted from output)
 * @returns URLSearchParams with non-default values
 *
 * @example
 * const defaults = { page: 0, sortBy: 'name' };
 * const params = { page: 2, sortBy: 'name' };
 * stringifySearchParams(params, defaults); // "page=2" (sortBy omitted as it's default)
 */
export function stringifySearchParams<T extends Record<string, string | number>>(
  params: T,
  defaults: T,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const key in params) {
    const value = params[key];
    if (value !== defaults[key]) {
      searchParams.set(key, String(value));
    }
  }

  return searchParams;
}

/**
 * Update existing URLSearchParams with new values, removing defaults
 *
 * @param current - Current URLSearchParams
 * @param updates - Partial updates to apply
 * @param defaults - Default values (updated values matching defaults are removed)
 * @returns New URLSearchParams with updates applied
 *
 * @example
 * const current = new URLSearchParams('page=1');
 * const defaults = { page: 0, sortBy: 'name' };
 * updateSearchParams(current, { page: 0, sortBy: 'email' }, defaults);
 * // Returns URLSearchParams with "sortBy=email" (page removed as it's now default)
 */
export function updateSearchParams<T extends object>(
  current: URLSearchParams,
  updates: Partial<T>,
  defaults: T,
): URLSearchParams {
  const next = new URLSearchParams(current);

  for (const key in updates) {
    const value = updates[key as keyof T];
    if (value === defaults[key as keyof T]) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }

  return next;
}
