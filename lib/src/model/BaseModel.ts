import { DbCollection } from '@src/db';

import type { BaseModelInstance, ModelStatus, NewBaseModelInstance, NewModelAttrs } from './types';

/**
 * BaseModel class for managing basic model operations without schema dependencies
 * Handles basic CRUD operations, db updates, attribute management, and status tracking
 * @template TAttrs - The model attributes type (e.g., { id: string, name: string })
 */
export default class BaseModel<TAttrs extends { id: any }> {
  public readonly modelName: string;
  public readonly collectionName: string;

  protected _attrs: NewModelAttrs<TAttrs>;
  protected _dbCollection: DbCollection<TAttrs>;
  protected _status: ModelStatus;

  constructor(
    modelName: string,
    collectionName: string,
    attrs: NewModelAttrs<TAttrs>,
    dbCollection?: DbCollection<TAttrs>,
  ) {
    this.modelName = modelName;
    this.collectionName = collectionName;
    this._dbCollection = dbCollection ?? new DbCollection<TAttrs>(collectionName);
    this._attrs = { ...attrs, id: attrs.id ?? null } as NewModelAttrs<TAttrs>;

    // Check if this model already exists in the database
    if (attrs.id && this._dbCollection.find(attrs.id)) {
      this._status = 'saved';
    } else {
      this._status = 'new';
    }
  }

  // -- GETTERS --

  /**
   * Getter for the protected id attribute
   * @returns The id of the model
   */
  get id(): TAttrs['id'] | null {
    return this._attrs.id;
  }

  /**
   * Getter for the model attributes
   * @returns A copy of the model attributes
   */
  get attrs(): NewModelAttrs<TAttrs> {
    return { ...this._attrs };
  }

  // -- DATABASE OPERATIONS --

  /**
   * Save the model to the database
   * @returns The model with saved instance type
   */
  save(): this & BaseModelInstance<TAttrs> {
    if (this.isNew() || !this.id) {
      const record = this._dbCollection.insert(this._attrs);

      this._attrs = record;
      this._status = 'saved';
    } else {
      this._dbCollection.update(this.id, this._attrs as TAttrs);
    }

    return this as this & BaseModelInstance<TAttrs>;
  }

  /**
   * Update the model attributes and save the model
   * @param attrs - The attributes to update
   * @returns The model instance for chaining
   */
  update(attrs: Partial<TAttrs>): BaseModelInstance<TAttrs> {
    Object.assign(this._attrs, attrs);
    return this.save();
  }

  /**
   * Reload the model from the database
   * @returns The model with saved instance type
   */
  reload(): BaseModelInstance<TAttrs> {
    if (this._attrs.id) {
      const record = this._dbCollection.find(this.id);

      if (record) {
        this._attrs = record;
        this._status = 'saved';
      }
    } else {
      return this.save();
    }

    return this as BaseModelInstance<TAttrs>;
  }

  /**
   * Destroy the model from the database
   * @returns The model with new instance type
   */
  destroy(): NewBaseModelInstance<TAttrs> {
    if (this.isSaved() && this.id) {
      this._dbCollection.delete(this.id);
      this._attrs = { ...this._attrs, id: null };
      this._status = 'new';
    }

    return this as NewBaseModelInstance<TAttrs>;
  }

  // -- STATUS CHECKS --

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

  // -- SERIALIZATION --

  /**
   * Serialize the model to a JSON object
   * @returns The serialized model using the configured serializer or raw attributes
   */
  toJSON(): TAttrs {
    return { ...this._attrs } as TAttrs;
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
