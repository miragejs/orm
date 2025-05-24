import { MirageError } from "../utils";

interface IdentityManagerConfig {
  initialCounter?: number;
  initialUsedIds?: Set<number>;
}

/**
 * Manages unique identifiers for database records.
 * Handles both numeric and string-based IDs, ensuring uniqueness
 * and proper sequencing of numeric IDs.
 * 
 * @param config - Configuration options for the identity manager.
 * @param config.initialCounter - The initial counter value.
 * @param config.initialUsedIds - A set of initial used IDs.
 */
export default class IdentityManager {
  private counter: number = 1;
  private usedIds: Set<number> = new Set();

  constructor(config: IdentityManagerConfig = {}) {
    this.counter = config.initialCounter ?? 1;
    this.usedIds = config.initialUsedIds ?? new Set();
  }

  /**
   * Gets the next available ID.
   */
  get(): number {
    let nextId = this.counter;

    while (this.usedIds.has(nextId)) {
      nextId++;
    }

    this.counter = nextId + 1;

    return nextId;
  }

  /**
   * Marks an ID as used and updates the counter.
   * @throws Error if the ID is already in use
   */
  set(id: number): void {
    if (this.usedIds.has(id)) {
      throw new MirageError(`Attempting to use the ID ${id}, but it's already been used`);
    }
    
    this.usedIds.add(id);
  }

  /**
   * Fetches the next available ID.
   */
  fetch(): number {
    const id = this.get();
    this.set(id);
    return id;
  }

  /**
   * Resets the manager's state, clearing all used IDs and resetting the counter.
   */
  reset(): void {
    this.counter = 1;
    this.usedIds.clear();
  }
}
