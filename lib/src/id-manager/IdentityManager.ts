import { MirageError } from '../utils';

import type { IdType, IdGenerator, IdentityManagerConfig } from './types';

/**
 * Manages unique identifiers for database records.
 * Handles different types of IDs, ensuring uniqueness and proper sequencing.
 * @template T - The type of ID to manage (defaults to string)
 * @param options - Configuration options for the identity manager.
 * @param options.initialCounter - The initial counter value.
 * @param options.initialUsedIds - A set of initial used IDs.
 * @param options.idGenerator - Custom function to generate the next ID.
 * @example
 * const identityManager = new IdentityManager();
 * identityManager.get(); // => "1"
 * identityManager.set("1");
 * identityManager.get(); // => "2"
 * identityManager.fetch(); // => "2"
 * identityManager.get(); // => "3"
 * identityManager.reset(); // => "1"
 */
export default class IdentityManager<T extends IdType = string> {
  private _counter: T;
  private _idGenerator: IdGenerator<T>;
  private _initialCounter: T;
  private _usedIds: Set<T>;

  constructor(options: IdentityManagerConfig<T>) {
    this._initialCounter = options.initialCounter;
    this._counter = this._initialCounter;
    this._usedIds = options.initialUsedIds
      ? new Set<T>(options.initialUsedIds)
      : new Set<T>();
    this._idGenerator = options.idGenerator ?? this.getDefaultGenerator();
  }

  /**
   * Gets the next ID without incrementing the counter.
   * @returns The next ID.
   */
  get(): T {
    let nextId = this._counter;
    while (this._usedIds.has(nextId)) {
      nextId = this._idGenerator(nextId);
    }
    return nextId;
  }

  /**
   * Gets the next ID and increments the counter.
   * @returns The next ID.
   */
  fetch(): T {
    const nextId = this.get();
    this._usedIds.add(nextId);
    this._counter = this._idGenerator(nextId);
    return nextId;
  }

  /**
   * Marks an ID as used and updates the counter if necessary.
   * @param id - The ID to mark as used.
   */
  set(id: T): void {
    this._usedIds.add(id);
  }

  /**
   * Increments the counter.
   */
  inc(): void {
    this._counter = this._idGenerator(this._counter);
  }

  /**
   * Resets the counter to its initial value and clears used IDs.
   */
  reset(): void {
    this._counter = this._initialCounter;
    this._usedIds.clear();
  }

  /**
   * Gets the default generator for the ID type.
   * @returns The default generator function.
   */
  private getDefaultGenerator(): IdGenerator<T> {
    if (typeof this._initialCounter === 'string') {
      if (isNaN(Number(this._initialCounter))) {
        throw new MirageError(
          'Default ID generator only works with numeric string IDs',
        );
      }
      return ((current: string) => {
        if (isNaN(Number(current))) {
          throw new MirageError(
            'Default ID generator only works with numeric string IDs',
          );
        }
        return String(Number(current) + 1);
      }) as unknown as IdGenerator<T>;
    } else if (typeof this._initialCounter === 'number') {
      return ((current: number) => current + 1) as unknown as IdGenerator<T>;
    } else {
      throw new MirageError(
        'Unknown ID type. Please provide a custom idGenerator.',
      );
    }
  }
}

/**
 * String-based identity manager with sensible defaults.
 * @example
 * const identityManager = new StringIdentityManager();
 * identityManager.fetch(); // => "1"
 * identityManager.fetch(); // => "2"
 */
export class StringIdentityManager extends IdentityManager<string> {
  constructor(options?: Partial<IdentityManagerConfig<string>>) {
    super({
      initialCounter: '1',
      ...options,
    });
  }
}

/**
 * Number-based identity manager with sensible defaults.
 * @example
 * const identityManager = new NumberIdentityManager();
 * identityManager.fetch(); // => 1
 * identityManager.fetch(); // => 2
 */
export class NumberIdentityManager extends IdentityManager<number> {
  constructor(options?: Partial<IdentityManagerConfig<number>>) {
    super({
      initialCounter: 1,
      ...options,
    });
  }
}
