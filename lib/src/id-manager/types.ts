/**
 * Type for allowed ID types
 */
export type IdType = number | string;

/**
 * Type for ID generator function that takes current ID and returns next ID
 * @template T - The type of ID
 * @param currentId - The current ID
 * @returns The next ID
 */
export type IdGenerator<T> = (currentId: T) => T;

/**
 * Configuration options for the IdentityManager
 * @template T - The type of ID
 * @param initialCounter - The initial counter value
 * @param initialUsedIds - A set of initial used IDs
 * @param idGenerator - Custom function to generate the next ID
 */
export interface IdentityManagerConfig<T = string> {
  initialCounter: T;
  initialUsedIds?: T[];
  idGenerator?: IdGenerator<T>;
}
