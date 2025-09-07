import type { SchemaCollections } from '@src/schema';

import type { Depth, ModelInstance, ModelToken, ModelUpdateAttrs } from './types';

/**
 * A collection of models with array-like interface
 * @template TToken - The model token (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TDepth - The recursion depth counter (internal)
 */
export default class ModelCollection<
  TToken extends ModelToken = ModelToken,
  TSchema extends SchemaCollections = SchemaCollections,
  TDepth extends Depth = [],
> {
  public readonly token: TToken;
  public readonly collectionName: string;
  public models: Array<ModelInstance<TToken, TSchema, TDepth>>;

  constructor(token: TToken, models: Array<ModelInstance<TToken, TSchema, TDepth>> = []) {
    this.token = token;
    this.collectionName = token.collectionName;
    this.models = [...models];
  }

  // -- GETTERS --

  /**
   * Get the length of the collection
   * @returns The number of models in the collection
   */
  get length(): number {
    return this.models.length;
  }

  /**
   * Check if the collection is empty
   * @returns True if the collection is empty, false otherwise
   */
  get isEmpty(): boolean {
    return this.models.length === 0;
  }

  /**
   * Get the first model in the collection
   * @returns The first model or null if the collection is empty
   */
  first(): ModelInstance<TToken, TSchema> | null {
    return this.models[0] || null;
  }

  /**
   * Get the last model in the collection
   * @returns The last model or null if the collection is empty
   */
  last(): ModelInstance<TToken, TSchema> | null {
    return this.models[this.models.length - 1] || null;
  }

  // -- ARRAY METHODS --

  /**
   * Get a model by index
   * @param index - The index of the model to get
   * @returns The model at the given index or undefined
   */
  at(index: number): ModelInstance<TToken, TSchema> | undefined {
    return this.models[index];
  }

  /**
   * Add a model to the end of the collection
   * @param model - The model to add
   */
  push(model: ModelInstance<TToken, TSchema>): void {
    this.models.push(model);
  }

  /**
   * Remove and return the last model from the collection
   * @returns The last model or undefined if the collection is empty
   */
  pop(): ModelInstance<TToken, TSchema> | undefined {
    return this.models.pop();
  }

  /**
   * Add a model to the beginning of the collection
   * @param model - The model to add
   */
  unshift(model: ModelInstance<TToken, TSchema>): void {
    this.models.unshift(model);
  }

  /**
   * Remove and return the first model from the collection
   * @returns The first model or undefined if the collection is empty
   */
  shift(): ModelInstance<TToken, TSchema> | undefined {
    return this.models.shift();
  }

  /**
   * Remove models from the collection
   * @param start - The start index
   * @param deleteCount - The number of models to remove
   * @param items - Models to add in place of the removed models
   * @returns An array of the removed models
   */
  splice(
    start: number,
    deleteCount?: number,
    ...items: ModelInstance<TToken, TSchema>[]
  ): ModelInstance<TToken, TSchema>[] {
    return this.models.splice(start, deleteCount ?? 0, ...items);
  }

  /**
   * Create a new collection with a subset of models
   * @param start - The start index
   * @param end - The end index (optional)
   * @returns A new ModelCollection with the sliced models
   */
  slice(start?: number, end?: number): ModelCollection<TToken, TSchema> {
    const slicedModels = this.models.slice(start, end);
    return new ModelCollection(this.token, slicedModels);
  }

  // -- ITERATION METHODS --

  /**
   * Execute a function for each model in the collection
   * @param callback - The function to execute for each model
   */
  forEach(
    callback: (model: ModelInstance<TToken, TSchema>, index: number, collection: this) => void,
  ): void {
    this.models.forEach((model, index) => callback(model, index, this));
  }

  /**
   * Create a new array with the results of calling a function for each model
   * @param callback - The function to call for each model
   * @returns A new array with the results
   */
  map<U>(
    callback: (model: ModelInstance<TToken, TSchema>, index: number, collection: this) => U,
  ): U[] {
    return this.models.map((model, index) => callback(model, index, this));
  }

  /**
   * Create a new collection with models that pass a test
   * @param callback - The test function
   * @returns A new ModelCollection with the filtered models
   */
  filter(
    callback: (model: ModelInstance<TToken, TSchema>, index: number, collection: this) => boolean,
  ): ModelCollection<TToken, TSchema> {
    const filteredModels = this.models.filter((model, index) => callback(model, index, this));
    return new ModelCollection(this.token, filteredModels);
  }

  /**
   * Find the first model that satisfies a test
   * @param callback - The test function
   * @returns The first model that passes the test, or undefined
   */
  find(
    callback: (model: ModelInstance<TToken, TSchema>, index: number, collection: this) => boolean,
  ): ModelInstance<TToken, TSchema> | undefined {
    return this.models.find((model, index) => callback(model, index, this));
  }

  /**
   * Check if at least one model satisfies a test
   * @param callback - The test function
   * @returns True if at least one model passes the test
   */
  some(
    callback: (model: ModelInstance<TToken, TSchema>, index: number, collection: this) => boolean,
  ): boolean {
    return this.models.some((model, index) => callback(model, index, this));
  }

  /**
   * Check if all models satisfy a test
   * @param callback - The test function
   * @returns True if all models pass the test
   */
  every(
    callback: (model: ModelInstance<TToken, TSchema>, index: number, collection: this) => boolean,
  ): boolean {
    return this.models.every((model, index) => callback(model, index, this));
  }

  /**
   * Reduce the collection to a single value
   * @param callback - The reducer function
   * @param initialValue - The initial value for the reduction
   * @returns The final accumulated value
   */
  reduce<U>(
    callback: (
      accumulator: U,
      model: ModelInstance<TToken, TSchema>,
      index: number,
      collection: this,
    ) => U,
    initialValue: U,
  ): U {
    return this.models.reduce(
      (acc, model, index) => callback(acc, model, index, this),
      initialValue,
    );
  }

  // -- UTILITY METHODS --

  /**
   * Sort the models in the collection
   * @param compareFn - The comparison function
   * @returns A new sorted ModelCollection
   */
  sort(
    compareFn?: (a: ModelInstance<TToken, TSchema>, b: ModelInstance<TToken, TSchema>) => number,
  ): ModelCollection<TToken, TSchema> {
    const sortedModels = [...this.models].sort(compareFn);
    return new ModelCollection(this.token, sortedModels);
  }

  /**
   * Reverse the order of models in the collection
   * @returns A new reversed ModelCollection
   */
  reverse(): ModelCollection<TToken, TSchema> {
    const reversedModels = [...this.models].reverse();
    return new ModelCollection(this.token, reversedModels);
  }

  /**
   * Concatenate this collection with other collections or arrays
   * @param others - Other collections or arrays to concatenate
   * @returns A new ModelCollection with all models
   */
  concat(
    ...others: (ModelCollection<TToken, TSchema> | ModelInstance<TToken, TSchema>[])[]
  ): ModelCollection<TToken, TSchema> {
    const allModels = [
      ...this.models,
      ...others.flatMap((other) => (Array.isArray(other) ? other : other.models)),
    ];
    return new ModelCollection(this.token, allModels);
  }

  /**
   * Check if the collection includes a specific model
   * @param model - The model to check for
   * @returns True if the model is in the collection
   */
  includes(model: ModelInstance<TToken, TSchema>): boolean {
    return this.models.includes(model);
  }

  /**
   * Find the index of a model in the collection
   * @param model - The model to find
   * @returns The index of the model, or -1 if not found
   */
  indexOf(model: ModelInstance<TToken, TSchema>): number {
    return this.models.indexOf(model);
  }

  /**
   * Convert the collection to a plain array
   * @returns An array of the models
   */
  toArray(): ModelInstance<TToken, TSchema>[] {
    return [...this.models];
  }

  /**
   * Get a string representation of the collection
   * @returns A string representation showing the collection name and count
   */
  toString(): string {
    return `collection:${this.collectionName}(${this.models.map((model) => model.toString()).join(', ')})`;
  }

  /**
   * Make the collection iterable
   * @returns An iterator for the models
   */
  [Symbol.iterator](): Iterator<ModelInstance<TToken, TSchema>> {
    return this.models[Symbol.iterator]();
  }

  // -- CRUD OPERATIONS --

  /**
   * Add a model to the end of the collection (alias for push)
   * @param model - The model to add
   */
  add(model: ModelInstance<TToken, TSchema>): void {
    this.push(model);
  }

  /**
   * Remove a model from the collection
   * @param model - The model to remove
   * @returns True if the model was removed, false if not found
   */
  remove(model: ModelInstance<TToken, TSchema>): boolean {
    const index = this.indexOf(model);
    if (index !== -1) {
      this.models.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Save all models in the collection
   * @returns The collection instance for chaining
   */
  save(): this {
    this.models.forEach((model) => model.save());
    return this;
  }

  /**
   * Destroy all models in the collection
   * @returns The collection instance for chaining
   */
  destroy(): this {
    this.models.forEach((model) => model.destroy());
    this.models = [];
    return this;
  }

  /**
   * Reload all models in the collection from the database
   * @returns The collection instance for chaining
   */
  reload(): this {
    this.models = this.models.map((model) => model.reload() as ModelInstance<TToken, TSchema>);
    return this;
  }

  /**
   * Update all models in the collection with the given attributes
   * @param attrs - The attributes to update
   * @returns The collection instance for chaining
   */
  update(attrs: ModelUpdateAttrs<TToken, TSchema>): this {
    this.models.forEach((model) => model.update(attrs));
    return this;
  }
}
