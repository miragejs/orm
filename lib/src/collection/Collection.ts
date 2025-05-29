import { type ModelInstance, type ModelAttrs } from '@src/model';

/**
 * A collection of models
 * @template TAttrs - The type of the model's attributes
 * @param options - The options for the collection
 * @param options.modelName - The name of the model
 * @param options.models - The initial models in the collection
 */
export default class Collection<TAttrs extends ModelAttrs<any>> {
  public readonly modelName: string;
  public models: Array<ModelInstance<TAttrs>>;

  constructor(options: CollectionOptions<TAttrs>) {
    const { modelName, models = [] } = options;

    if (!modelName || typeof modelName !== 'string') {
      throw new Error('You must pass a `modelName` into a Collection');
    }

    this.modelName = modelName;
    this.models = models;
  }

  /**
   * Get the number of models in the collection
   * @returns The number of models
   */
  get length(): number {
    return this.models.length;
  }

  // -- Array-like methods --

  /**
   * Concatenate another collection into this one
   * @param collection - The collection to concatenate
   * @returns The concatenated collection
   */
  concat(collection: Collection<TAttrs>): this {
    this.models = this.models.concat(collection.models);
    return this;
  }

  /**
   * Filter models in the collection
   * @param f - The filter function
   * @returns The collection
   */
  filter(f: (model: ModelInstance<TAttrs>) => boolean): this {
    this.models = this.models.filter(f);
    return this;
  }

  /**
   * Check if a model is in the collection
   * @param model - The model to check
   * @returns Whether the model is in the collection
   */
  includes(model: ModelInstance<TAttrs>): boolean {
    return this.models.some((m) => m.toString() === model.toString());
  }

  /**
   * Add a model to the collection (does not save the model in the db)
   * @param model - The model to add
   * @returns The collection
   */
  push(model: ModelInstance<TAttrs>): this {
    this.models.push(model);
    return this;
  }

  /**
   * Get a slice of models from the collection
   * @param args - The slice arguments
   * @returns The collection
   */
  slice(...args: number[]): this {
    this.models = this.models.slice(...args);
    return this;
  }

  /**
   * Sort models in the collection
   * @param f - The sort function
   * @returns The collection
   */
  sort(f: (a: ModelInstance<TAttrs>, b: ModelInstance<TAttrs>) => number): this {
    this.models.sort(f);
    return this;
  }

  // -- Collection-specific methods --

  /**
   * Add a model to the collection and save it in the db
   * @param model - The model to add
   * @returns The collection
   */
  add(model: ModelInstance<TAttrs>): this {
    this.models.push(model.save());
    return this;
  }

  /**
   * Destroy all models in the collection
   * @returns The collection
   */
  destroy(): this {
    this.models.forEach((model) => model.destroy());
    this.models = [];
    return this;
  }

  /**
   * Merge another collection into this one
   * @param collection - The collection to merge
   * @returns The merged collection
   * @deprecated Use `concat` instead
   */
  mergeCollection(collection: Collection<TAttrs>): this {
    this.models = this.models.concat(collection.models);
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
  remove(model: ModelInstance<TAttrs>): this {
    const match = this.models.find((m) => m.toString() === model.toString());
    if (match) {
      const i = this.models.indexOf(match);
      this.models.splice(i, 1);
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
  update(attrs: Partial<TAttrs>): this {
    this.models = this.models.map((model) => model.update(attrs));
    return this;
  }

  // -- Serialization --

  /**
   * Get a string representation of the collection
   * @returns The string representation
   */
  toString(): string {
    return `collection:${this.modelName}(${this.models.map((m) => m.toString()).join(',')})`;
  }
}

// -- Types --

/**
 * Options for the collection
 * @template TAttrs - The type of the model's attributes
 */
export interface CollectionOptions<TAttrs extends ModelAttrs<any>> {
  modelName: string;
  models?: Array<ModelInstance<TAttrs>>;
}
