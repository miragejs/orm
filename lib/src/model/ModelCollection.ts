import { type AllowedIdTypes } from '@src/db';

import type { SavedModelInstance, ModelAttrs } from './Model';

/**
 * A collection of models that extends native Array
 * @template TAttrs - The type of the model's attributes
 * @param options - The options for the collection
 * @param options.collectionName - The name of the collection
 * @param options.models - The initial models in the collection
 */
export default class ModelCollection<TAttrs extends ModelAttrs<AllowedIdTypes>> extends Array<
  SavedModelInstance<TAttrs>
> {
  public readonly collectionName: string;

  constructor(options: ModelCollectionOptions<TAttrs>) {
    super(...(options.models ?? []));
    this.collectionName = options.collectionName;
  }

  // -- ARRAY METHODS OVERRIDES (to preserve collectionName) --

  /**
   * Filter the collection
   * @param predicate - The predicate to filter the collection
   * @returns The filtered collection
   */
  filter(
    predicate: (
      value: SavedModelInstance<TAttrs>,
      index: number,
      array: SavedModelInstance<TAttrs>[],
    ) => boolean,
  ): SavedModelInstance<TAttrs>[] {
    return new ModelCollection<TAttrs>({
      collectionName: this.collectionName,
      models: super.filter(predicate),
    });
  }

  /**
   * Slice the collection
   * @param start - The start index
   * @param end - The end index
   * @returns The sliced collection
   */
  slice(start?: number, end?: number): SavedModelInstance<TAttrs>[] {
    return new ModelCollection<TAttrs>({
      collectionName: this.collectionName,
      models: super.slice(start, end),
    });
  }

  /**
   * Concatenate the collection
   * @param items - The items to concatenate
   * @returns The concatenated collection
   */
  concat(
    ...items: (SavedModelInstance<TAttrs> | ConcatArray<SavedModelInstance<TAttrs>>)[]
  ): SavedModelInstance<TAttrs>[] {
    const models = items.flatMap((item) =>
      item instanceof ModelCollection ? Array.from(item) : Array.isArray(item) ? item : [item],
    );
    return new ModelCollection<TAttrs>({
      collectionName: this.collectionName,
      models: super.concat(...models),
    });
  }

  /**
   * Get a string representation of the collection
   * @returns The string representation
   */
  toString(): string {
    return `collection:${this.collectionName}(${this.map((m) => m.toString()).join(',')})`;
  }

  /**
   * Serialize all models in the collection to JSON
   * @template T - The expected serialized type (defaults to any)
   * @returns Array of serialized models
   */
  toJSON<T = any>(): T[] {
    return this.map((model) => model.toJSON()) as T[];
  }

  // -- COLLECTION-SPECIFIC METHODS --

  /**
   * Add a model to the collection and save it in the db
   * @param model - The model to add
   * @returns The collection
   */
  add(model: SavedModelInstance<TAttrs>): this {
    this.push(model);
    return this;
  }

  /**
   * Destroy all models in the collection
   * @returns The collection
   */
  destroy(): this {
    this.forEach((model) => model.destroy());
    this.length = 0;
    return this;
  }

  /**
   * Reload all models in the collection
   * @returns The collection
   */
  reload(): this {
    this.forEach((model, index) => {
      this[index] = model.reload();
    });
    return this;
  }

  /**
   * Remove a model from the collection
   * @param model - The model to remove
   * @returns The collection
   */
  remove(model: SavedModelInstance<TAttrs>): this {
    const index = this.findIndex((m) => m.toString() === model.toString());
    if (index !== -1) {
      this.splice(index, 1);
    }
    return this;
  }

  /**
   * Save all models in the collection
   * @returns The collection
   */
  save(): this {
    this.forEach((model, index) => {
      this[index] = model.save();
    });
    return this;
  }

  /**
   * Update all models in the collection with the given attributes
   * @param attrs - The attributes to update
   * @returns The collection
   */
  update(attrs: Partial<TAttrs & { id: NonNullable<TAttrs['id']> }>): this {
    this.forEach((model, index) => {
      this[index] = model.update(attrs);
    });
    return this;
  }
}

// -- TYPES --

/**
 * Options for the collection
 * @template TAttrs - The type of the model's attributes
 * @param options.collectionName - The name of the collection
 * @param options.models - The initial models in the collection
 */
export interface ModelCollectionOptions<TAttrs extends ModelAttrs<AllowedIdTypes>> {
  collectionName: string;
  models?: Array<SavedModelInstance<TAttrs>>;
}
