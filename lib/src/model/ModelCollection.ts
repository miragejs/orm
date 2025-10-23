import type { SchemaCollections } from '@src/schema';

import type { ModelAttrs, ModelInstance, ModelTemplate, ModelUpdateAttrs } from './types';

/**
 * A collection of models with array-like interface
 * @template TTemplate - The model template (most important for users)
 * @template TSchema - The schema collections type for enhanced type inference
 * @template TSerializer - The serializer type
 */
export default class ModelCollection<
  TTemplate extends ModelTemplate = ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TSerializer = undefined,
> {
  private readonly _template: TTemplate;
  public readonly collectionName: string;
  public models: Array<ModelInstance<TTemplate, TSchema, TSerializer>>;
  protected _serializer?: TSerializer;

  constructor(
    template: TTemplate,
    models?: Array<ModelInstance<TTemplate, TSchema, TSerializer>>,
    serializer?: TSerializer,
  ) {
    this._template = template;
    this._serializer = serializer;

    this.collectionName = template.collectionName;
    this.models = [...(models ?? [])];
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
   * Get a model by index
   * @param index - The index of the model to get
   * @returns The model at the given index or undefined
   */
  at(index: number): ModelInstance<TTemplate, TSchema, TSerializer> | undefined {
    return this.models[index];
  }

  /**
   * Get the first model in the collection
   * @returns The first model or null if the collection is empty
   */
  first(): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    return this.models[0] || null;
  }

  /**
   * Get the last model in the collection
   * @returns The last model or null if the collection is empty
   */
  last(): ModelInstance<TTemplate, TSchema, TSerializer> | null {
    return this.models[this.models.length - 1] || null;
  }

  // -- ARRAY-LIKE ITERATION METHODS --

  /**
   * Execute a function for each model in the collection
   * @param cb - The function to execute for each model
   */
  forEach(
    cb: (
      model: ModelInstance<TTemplate, TSchema, TSerializer>,
      index: number,
      collection: this,
    ) => void,
  ): void {
    this.models.forEach((model, index) => cb(model, index, this));
  }

  /**
   * Create a new array with the results of calling a function for each model
   * @param cb - The function to call for each model
   * @returns A new array with the results
   */
  map(
    cb: (
      model: ModelInstance<TTemplate, TSchema, TSerializer>,
      index: number,
      collection: this,
    ) => ModelInstance<TTemplate, TSchema, TSerializer>,
  ): ModelCollection<TTemplate, TSchema, TSerializer> {
    const mappedModels = this.models.map((model, index) => cb(model, index, this));
    return new ModelCollection(this._template, mappedModels, this._serializer);
  }

  /**
   * Create a new collection with models that pass a test
   * @param cb - The test function
   * @returns A new ModelCollection with the filtered models
   */
  filter(
    cb: (
      model: ModelInstance<TTemplate, TSchema, TSerializer>,
      index: number,
      collection: this,
    ) => boolean,
  ): ModelCollection<TTemplate, TSchema, TSerializer> {
    const filteredModels = this.models.filter((model, index) => cb(model, index, this));
    return new ModelCollection(this._template, filteredModels, this._serializer);
  }

  /**
   * Find the first model that satisfies a test
   * @param cb - The test function
   * @returns The first model that passes the test, or undefined
   */
  find(
    cb: (
      model: ModelInstance<TTemplate, TSchema, TSerializer>,
      index: number,
      collection: this,
    ) => boolean,
  ): ModelInstance<TTemplate, TSchema, TSerializer> | undefined {
    return this.models.find((model, index) => cb(model, index, this));
  }

  /**
   * Check if at least one model satisfies a test
   * @param cb - The test function
   * @returns True if at least one model passes the test
   */
  some(
    cb: (
      model: ModelInstance<TTemplate, TSchema, TSerializer>,
      index: number,
      collection: this,
    ) => boolean,
  ): boolean {
    return this.models.some((model, index) => cb(model, index, this));
  }

  /**
   * Check if all models satisfy a test
   * @param cb - The test function
   * @returns True if all models pass the test
   */
  every(
    cb: (
      model: ModelInstance<TTemplate, TSchema, TSerializer>,
      index: number,
      collection: this,
    ) => boolean,
  ): boolean {
    return this.models.every((model, index) => cb(model, index, this));
  }

  // -- ARRAY-LIKE UTILITY METHODS --

  /**
   * Concatenate this collection with other collections or arrays
   * @param others - Other collections or arrays to concatenate
   * @returns A new ModelCollection with all models
   */
  concat(
    ...others: (
      | ModelCollection<TTemplate, TSchema, TSerializer>
      | ModelInstance<TTemplate, TSchema, TSerializer>[]
    )[]
  ): ModelCollection<TTemplate, TSchema, TSerializer> {
    const allModels = [
      ...this.models,
      ...others.flatMap((other) => (Array.isArray(other) ? other : other.models)),
    ];
    return new ModelCollection(this._template, allModels, this._serializer);
  }

  /**
   * Check if the collection includes a specific model
   * @param model - The model to check for
   * @returns True if the model is in the collection
   */
  includes(model: ModelInstance<TTemplate, TSchema, TSerializer>): boolean {
    return this.models.includes(model);
  }

  /**
   * Find the index of a model in the collection
   * @param model - The model to find
   * @returns The index of the model, or -1 if not found
   */
  indexOf(model: ModelInstance<TTemplate, TSchema, TSerializer>): number {
    return this.models.indexOf(model);
  }

  /**
   * Sort the models in the collection
   * @param compareFn - The comparison function
   * @returns A new sorted ModelCollection
   */
  sort(
    compareFn?: (
      a: ModelInstance<TTemplate, TSchema, TSerializer>,
      b: ModelInstance<TTemplate, TSchema, TSerializer>,
    ) => number,
  ): ModelCollection<TTemplate, TSchema, TSerializer> {
    const sortedModels = [...this.models].sort(compareFn);
    return new ModelCollection(this._template, sortedModels, this._serializer);
  }

  /**
   * Reverse the order of models in the collection
   * @returns A new reversed ModelCollection
   */
  reverse(): ModelCollection<TTemplate, TSchema, TSerializer> {
    const reversedModels = [...this.models].reverse();
    return new ModelCollection(this._template, reversedModels, this._serializer);
  }

  // -- CRUD OPERATIONS --

  /**
   * Add a model to the end of the collection (alias for push)
   * @param model - The model to add
   */
  add(model: ModelInstance<TTemplate, TSchema, TSerializer>): void {
    this.models.push(model);
  }

  /**
   * Remove a model from the collection
   * @param model - The model to remove
   * @returns True if the model was removed, false if not found
   */
  remove(model: ModelInstance<TTemplate, TSchema, TSerializer>): boolean {
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
    this.models = this.models.map(
      (model) => model.save() as ModelInstance<TTemplate, TSchema, TSerializer>,
    );
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
    this.models = this.models.map(
      (model) => model.reload() as ModelInstance<TTemplate, TSchema, TSerializer>,
    );
    return this;
  }

  /**
   * Update all models in the collection with the given attributes
   * @param attrs - The attributes to update
   * @returns The collection instance for chaining
   */
  update(attrs: ModelUpdateAttrs<TTemplate, TSchema>): this {
    this.models = this.models.map(
      (model) => model.update(attrs) as ModelInstance<TTemplate, TSchema, TSerializer>,
    );
    return this;
  }

  // -- SERIALIZATION --

  /**
   * Convert the collection to a plain array
   * @returns An array of the models
   */
  toArray(): ModelInstance<TTemplate, TSchema, TSerializer>[] {
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
   * Convert the collection to JSON
   * Uses serializer if configured, otherwise returns array of raw attributes
   * @returns A serialized representation of the collection
   */
  toJSON(): TSerializer extends {
    serializeCollection(collection: any): infer TSerializedCollection;
  }
    ? TSerializedCollection
    : ModelAttrs<TTemplate, TSchema>[] {
    if (
      this._serializer &&
      typeof this._serializer === 'object' &&
      'serializeCollection' in this._serializer &&
      typeof this._serializer.serializeCollection === 'function'
    ) {
      return (this._serializer as any).serializeCollection(this) as any;
    }
    return this.models.map((model) => model.attrs) as any;
  }

  /**
   * Make the collection iterable
   * @returns An iterator for the models
   */
  [Symbol.iterator](): Iterator<ModelInstance<TTemplate, TSchema, TSerializer>> {
    return this.models[Symbol.iterator]();
  }
}
