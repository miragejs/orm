import { MirageError } from '../utils';

/**
 * Manages unique identifiers for database records.
 * Handles different types of IDs, ensuring uniqueness and proper sequencing.
 * @template T - The type of ID to manage (defaults to number)
 * @param config - Configuration options for the identity manager.
 * @param config.initialCounter - The initial counter value.
 * @param config.initialUsedIds - A set of initial used IDs.
 * @param config.idGenerator - Custom function to generate the next ID.
 * @example
 * const identityManager = new IdentityManager();
 * identityManager.get(); // => 1
 * identityManager.set(2); // => 2
 * identityManager.fetch(); // => 3
 * identityManager.reset(); // => 1
 */
export default class IdentityManager<T extends AllowedIdTypes = number> {
  private initialCounter: T;
  private counter: T;
  private usedIds: Set<T>;
  private idGenerator: IdGenerator<T>;

  constructor(config: IdentityManagerConfig<T> = {}) {
    this.initialCounter = config.initialCounter ?? (1 as T);
    this.counter = this.initialCounter;
    this.usedIds = config.initialUsedIds ?? new Set<T>();
    this.idGenerator = config.idGenerator ?? this.getDefaultGenerator();
  }

  /**
   * Gets the next available ID.
   * @returns The next available ID
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.get(); // => 1
   */
  get(): T {
    let nextId = this.counter;

    while (this.usedIds.has(nextId)) {
      nextId = this.generateNextId(nextId);
    }

    return nextId;
  }

  /**
   * Marks an ID as used and updates the counter.
   * @param id - The ID to mark as used
   * @throws Error if the ID is already in use
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.set(2); // => 2
   */
  set(id: T): void {
    if (this.usedIds.has(id)) {
      throw new MirageError(`Attempting to use the ID ${id}, but it's already been used`);
    }

    this.usedIds.add(id);
  }

  /**
   * Fetches the next available ID and marks it as used.
   * @returns The next available ID
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.fetch(); // => 1
   */
  fetch(): T {
    const id = this.get();
    this.set(id);
    this.counter = this.generateNextId(id);
    return id;
  }

  /**
   * Resets the manager's state, clearing all used IDs and resetting the counter.
   */
  reset(): void {
    this.counter = this.initialCounter;
    this.usedIds.clear();
  }

  // -- Private methods -- //

  /**
   * Returns the default ID generator for numeric IDs
   * @returns The default ID generator
   * @throws Error if used with non-numeric types
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.getDefaultGenerator(); // => (currentId) => currentId + 1
   */
  private getDefaultGenerator(): IdGenerator<T> {
    return (currentId: T) => {
      if (typeof currentId === 'number') {
        return (currentId + 1) as T;
      }
      throw new MirageError(
        'Default ID generator only works with numbers. Provide a custom idGenerator for other types.',
      );
    };
  }

  /**
   * Generates the next ID using the configured generator
   * @param currentId - The current ID
   * @returns The next ID
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.generateNextId(1); // => 2
   */
  private generateNextId(currentId: T): T {
    return this.idGenerator(currentId);
  }
}

// -- Types -- //

/**
 * Type for allowed ID types
 */
export type AllowedIdTypes = number | string;

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
export interface IdentityManagerConfig<T = number> {
  initialCounter?: T;
  initialUsedIds?: Set<T>;
  idGenerator?: IdGenerator<T>;
}
