import { DbCollection, DbRecordInput, type AllowedIdTypes } from '@src/db';
import { Inflector } from '@src/inflector';
import { camelize } from '@src/utils/string';

/**
 * Base model class that handles core functionality and attribute getters/setters
 * @template TAttrs - The type of the model's attributes
 */
export default class BaseModel<TAttrs extends ModelAttrs<AllowedIdTypes> = ModelAttrs<number>> {
  attrs: TAttrs;
  readonly modelName: string;
  protected _collection: DbCollection<NonNullable<TAttrs['id']>, TAttrs>;
  protected _status: 'new' | 'saved';

  constructor({ attrs, collection, name }: ModelOptions<TAttrs>) {
    this.attrs = { ...attrs, id: attrs?.id ?? null } as TAttrs;
    this.modelName = Inflector.instance.singularize(camelize(name, false));

    this._collection =
      collection ||
      new DbCollection<NonNullable<TAttrs['id']>, TAttrs>({
        name: Inflector.instance.pluralize(this.modelName),
      });
    this._status = 'new';

    for (const key in attrs) {
      if (key !== 'id' && !Object.prototype.hasOwnProperty.call(this, key)) {
        Object.defineProperty(this, key, {
          get: function (this: BaseModel<TAttrs>) {
            return this.attrs[key];
          },
          set: function (this: BaseModel<TAttrs>, value: TAttrs[keyof TAttrs]) {
            this.attrs[key as keyof TAttrs] = value;
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  // -- Getters --

  /**
   * Getter for the protected id attribute
   * @returns The id of the model
   */
  get id(): TAttrs['id'] {
    return this.attrs.id;
  }

  // -- Main methods --

  /**
   * Destroy the model from the database
   */
  destroy(): void {
    if (this.isSaved() && this.id) {
      this._collection.remove(this.id);
    }
  }

  /**
   * Reload the model from the database
   * @returns The model
   */
  reload(): this {
    if (this.id) {
      this.attrs = this._collection.find(this.id) as TAttrs;
    }

    return this;
  }

  /**
   * Save the model to the database
   * @returns The model
   */
  save(): this {
    if (this.isNew() || !this.id) {
      const modelRecord = this._collection.insert(
        this.attrs as DbRecordInput<NonNullable<TAttrs['id']>, TAttrs>,
      );
      this.attrs = modelRecord;
      this._status = 'saved';
    } else {
      this._collection.update(
        this.id,
        this.attrs as DbRecordInput<NonNullable<TAttrs['id']>, TAttrs>,
      );
    }

    return this;
  }

  /**
   * Update the model attributes and save the model
   * @param attrs - The attributes to update
   * @returns The model
   */
  update(attrs: Partial<TAttrs>): this {
    Object.assign(this.attrs, attrs);
    return this.save();
  }

  // -- Status --

  /**
   * Check if the model is new
   * @returns True if the model is new, false otherwise
   */
  isNew(): boolean {
    return this._status === 'new';
  }

  /**
   * Check if the model is saved
   * @returns True if the model is saved, false otherwise
   */
  isSaved(): boolean {
    return this._status === 'saved';
  }

  // -- Serialization --

  /**
   * Serialize the model to a JSON object
   * @returns The copy of the model attributes as a JSON object
   */
  toJSON(): TAttrs {
    return { ...this.attrs };
  }

  /**
   * Serialize the model to a string
   * @returns The simple string representation of the model and its id
   */
  toString(): string {
    let idLabel = this.id ? `(${this.id})` : '';
    return `model:${this.modelName}${idLabel}`;
  }
}

/**
 * Factory function for creating a model instance and getters/setters for the attributes
 * @param options - The options for creating the model instance
 * @returns The model instance
 */
export function createModelInstance<TAttrs extends ModelAttrs<AllowedIdTypes>>(
  options: ModelOptions<TAttrs>,
): BaseModel<TAttrs> & TAttrs {
  return new BaseModel<TAttrs>(options) as BaseModel<TAttrs> & TAttrs;
}

// -- Types --

/**
 * Type for model attributes
 * @template TId - The type of the model's id
 */
export type ModelAttrs<TId = AllowedIdTypes> = {
  id?: TId | null;
  [key: string]: any;
};

/**
 * Options for creating a model
 * @template TAttrs - The type of the model's attributes
 */
export interface ModelOptions<TAttrs extends ModelAttrs<any>> {
  attrs?: TAttrs;
  collection?: DbCollection<NonNullable<TAttrs['id']>, TAttrs>;
  name: string;
}

/**
 * Type for model instances
 * @template TAttrs - The type of the model's attributes
 */
export type ModelInstance<TAttrs extends ModelAttrs<any>> = BaseModel<TAttrs> &
  Omit<TAttrs, keyof BaseModel<TAttrs>>;
