export type SortDirection = 'asc' | 'desc';

/**
 * Common table params interface for pagination and sorting
 */
export interface TableParams<TSortBy extends string = string> {
  page: number;
  pageSize: number;
  sortBy: TSortBy;
  sortOrder: SortDirection;
}

/**
 * Build URLSearchParams from table state (for API calls)
 *
 * @example
 * // In API function
 * const searchParams = buildTableQuery(params);
 * fetch(`/api/members?${searchParams}`);
 */
export function buildTableQuery<T extends TableParams>(params: T): URLSearchParams {
  return new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });
}

/**
 * Parse table params from URL (for server handlers)
 *
 * @example
 * // In MSW handler
 * http.get('/api/members', ({ request }) => {
 *   const params = parseTableQuery(request.url, defaults);
 *   // params: { page: 0, pageSize: 5, sortBy: 'name', sortOrder: 'asc' }
 * });
 */
export function parseTableQuery<TSortBy extends string>(
  url: string | URL,
  defaults: TableParams<TSortBy>,
): TableParams<TSortBy> {
  const searchParams =
    typeof url === 'string' ? new URL(url).searchParams : url.searchParams;

  return {
    page: parseInt(searchParams.get('page') || String(defaults.page), 10),
    pageSize: parseInt(searchParams.get('pageSize') || String(defaults.pageSize), 10),
    sortBy: (searchParams.get('sortBy') || defaults.sortBy) as TSortBy,
    sortOrder: (searchParams.get('sortOrder') || defaults.sortOrder) as SortDirection,
  };
}
