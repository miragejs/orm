import { MirageError } from '../utils';

/**
 * Manages unique identifiers for database records.
 * Handles different types of IDs, ensuring uniqueness and proper sequencing.
 *
 * @template T - The type of ID to manage (defaults to number)
 * @param config - Configuration options for the identity manager.
 * @param config.initialCounter - The initial counter value.
 * @param config.initialUsedIds - A set of initial used IDs.
 * @param config.idGenerator - Custom function to generate the next ID.
 */
export default class IdentityManager<T = number> {
  private counter: T;
  private usedIds: Set<T>;
  private idGenerator: IdGenerator<T>;

  constructor(config: IdentityManagerConfig<T> = {}) {
    this.counter = config.initialCounter ?? (1 as T);
    this.usedIds = config.initialUsedIds ?? new Set<T>();
    this.idGenerator = config.idGenerator ?? this.getDefaultGenerator();
  }

  /**
   * Gets the next available ID.
   */
  get(): T {
    let nextId = this.counter;

    while (this.usedIds.has(nextId)) {
      nextId = this.generateNextId(nextId);
    }

    this.counter = this.generateNextId(nextId);
    return nextId;
  }

  /**
   * Marks an ID as used and updates the counter.
   * @throws Error if the ID is already in use
   */
  set(id: T): void {
    if (this.usedIds.has(id)) {
      throw new MirageError(`Attempting to use the ID ${id}, but it's already been used`);
    }

    this.usedIds.add(id);
  }

  /**
   * Fetches the next available ID.
   */
  fetch(): T {
    const id = this.get();
    this.set(id);
    return id;
  }

  /**
   * Resets the manager's state, clearing all used IDs and resetting the counter.
   */
  reset(): void {
    this.counter = 1 as T;
    this.usedIds.clear();
  }

  // -- Private methods -- //

  /**
   * Returns the default ID generator for numeric IDs
   * @throws Error if used with non-numeric types
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
   */
  private generateNextId(currentId: T): T {
    return this.idGenerator(currentId);
  }
}

// -- Types -- //

/**
 * Type for ID generator function that takes current ID and returns next ID
 */
export type IdGenerator<T> = (currentId: T) => T;

/**
 * Configuration options for the IdentityManager
 */
export interface IdentityManagerConfig<T = number> {
  initialCounter?: T;
  initialUsedIds?: Set<T>;
  idGenerator?: IdGenerator<T>;
}
