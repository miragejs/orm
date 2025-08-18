import type { ModelInstance, ModelToken, PartialModelAttrs, NewModelInstance } from './types';

/**
 * Base model collection with core functionality
 * @template TToken - The model token
 */
abstract class BaseModelCollection<TToken extends ModelToken> {
  public readonly token: TToken;
  public readonly collectionName: string;
  public models: Array<ModelInstance<TToken>>;

  constructor(token: TToken, models: Array<ModelInstance<TToken>> = []) {
    this.token = token;
    this.collectionName = token.collectionName;
    this.models = [...models];
  }

  /**
   * Get the length of the collection
   * @returns The number of models in the collection
   */
  get length(): number {
    return this.models.length;
  }

  /**
   * Set the length of the collection
   * @param newLength - The new length
   */
  set length(newLength: number) {
    this.models.length = newLength;
  }

  /**
   * Get a model by index
   * @param index - The index
   * @returns The model at the index or undefined if not found
   */
  get(index: number): ModelInstance<TToken> | undefined {
    return this.models[index];
  }

  /**
   * Convert the collection to a plain array
   * @returns Array of models
   */
  toArray(): ModelInstance<TToken>[] {
    return [...this.models];
  }

  /**
   * Get a string representation of the collection
   * @returns The string representation
   */
  toString(): string {
    return `collection:${this.collectionName}(${this.models.map((m) => m.toString()).join(',')})`;
  }

  /**
   * Serialize all models in the collection to JSON
   * @template T - The expected serialized type (defaults to any)
   * @returns Array of serialized models
   */
  toJSON<T = any>(): T[] {
    return this.models.map((model) => model.toJSON()) as T[];
  }

  /**
   * Make the collection iterable
   * @returns An iterator for the models
   */
  [Symbol.iterator](): Iterator<ModelInstance<TToken>> {
    return this.models[Symbol.iterator]();
  }
}

/**
 * Model collection with array-like methods
 * @template TToken - The model token
 */
class ArrayModelCollection<TToken extends ModelToken> extends BaseModelCollection<TToken> {
  /**
   * Filter the collection
   * @param predicate - The predicate to filter the collection
   * @returns A new filtered collection
   */
  filter(
    predicate: (
      value: ModelInstance<TToken>,
      index: number,
      array: ModelInstance<TToken>[],
    ) => boolean,
  ): this {
    const filtered = this.models.filter(predicate);
    return new (this.constructor as any)(this.token, filtered);
  }

  /**
   * Find a model in the collection
   * @param predicate - The predicate function
   * @returns The found model or undefined
   */
  find(
    predicate: (
      value: ModelInstance<TToken>,
      index: number,
      array: ModelInstance<TToken>[],
    ) => boolean,
  ): ModelInstance<TToken> | undefined {
    return this.models.find(predicate);
  }

  /**
   * Sort the collection
   * @param compareFn - The compare function
   * @returns A new sorted collection
   */
  sort(compareFn?: (a: ModelInstance<TToken>, b: ModelInstance<TToken>) => number): this {
    const sorted = [...this.models].sort(compareFn);
    return new (this.constructor as any)(this.token, sorted);
  }

  /**
   * Check if the collection includes a model (using toString comparison)
   * @param model - The model to check for
   * @returns True if the collection includes the model
   */
  includes(model: ModelInstance<TToken>): boolean {
    return this.models.some((m) => m.toString() === model.toString());
  }

  /**
   * Slice the collection
   * @param start - The start index
   * @param end - The end index
   * @returns A new sliced collection
   */
  slice(start?: number, end?: number): this {
    const sliced = this.models.slice(start, end);
    return new (this.constructor as any)(this.token, sliced);
  }

  /**
   * Concatenate the collection with other models or collections
   * @param items - The items to concatenate
   * @returns A new concatenated collection
   */
  concat(
    ...items: (ModelInstance<TToken> | BaseModelCollection<TToken> | ModelInstance<TToken>[])[]
  ): this {
    const flattened: ModelInstance<TToken>[] = [];

    for (const item of items) {
      if (item instanceof BaseModelCollection) {
        flattened.push(...item.models);
      } else if (Array.isArray(item)) {
        flattened.push(...item);
      } else {
        flattened.push(item);
      }
    }

    const concatenated = this.models.concat(flattened);
    return new (this.constructor as any)(this.token, concatenated);
  }

  /**
   * Execute a function for each model in the collection
   * @param callbackFn - The callback function
   * @returns The collection
   */
  forEach(
    callbackFn: (
      value: ModelInstance<TToken>,
      index: number,
      array: ModelInstance<TToken>[],
    ) => ModelInstance<TToken>,
  ): this {
    this.models.map((model, index, array) => callbackFn(model, index, array));
    return this;
  }
}

/**
 * Model collection with mutation methods
 * @template TToken - The model token
 */
class MutableModelCollection<TToken extends ModelToken> extends ArrayModelCollection<TToken> {
  /**
   * Add a model to the collection and save it in the db
   * @param model - The model to add
   * @returns The collection
   */
  add(model: NewModelInstance<TToken> | ModelInstance<TToken>): this {
    this.models.push(model.save());
    return this;
  }

  /**
   * Destroy all models in the collection
   * @returns The collection
   */
  destroy(): this {
    this.models.forEach((model) => model.destroy());
    this.length = 0;
    return this;
  }

  /**
   * Reload all models in the collection
   * @returns The collection
   */
  reload(): this {
    this.models = this.models.map((model) => model.reload());
    return this;
  }

  /**
   * Remove a model from the collection
   * @param model - The model to remove
   * @returns The collection
   */
  remove(model: ModelInstance<TToken>): this {
    const index = this.models.findIndex((m) => m.toString() === model.toString());
    if (index !== -1) {
      this.models.splice(index, 1);
    }
    return this;
  }

  /**
   * Save all models in the collection
   * @returns The collection
   */
  save(): this {
    this.models = this.models.map((model) => model.save());
    return this;
  }

  /**
   * Update all models in the collection with the given attributes
   * @param attrs - The attributes to update
   * @returns The collection
   */
  update(attrs: PartialModelAttrs<TToken>): this {
    this.models = this.models.map((model) => model.update(attrs));
    return this;
  }
}

/**
 * A collection of models that provides array-like functionality and mutation methods
 * @template TToken - The model token
 * @param token - The model token defining the collection
 * @param models - The initial models in the collection
 */
export default class ModelCollection<
  TToken extends ModelToken,
> extends MutableModelCollection<TToken> {}
