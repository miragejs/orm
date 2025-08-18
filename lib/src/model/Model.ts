import { DbCollection, DbRecordInput } from '@src/db';

import type {
  InferTokenModel,
  ModelAttrs,
  ModelClass,
  ModelInstance,
  ModelConfig,
  ModelToken,
  PartialModelAttrs,
  SavedModelInstance,
} from './types';

/**
 * Define a model class with attribute accessors
 * @template TToken - The model token
 * @param token - The model token to define
 * @returns A model class that can be instantiated with 'new'
 */
export function defineModel<TToken extends ModelToken>(token: TToken): ModelClass<TToken> {
  return class extends Model<TToken> {
    constructor(config: ModelConfig<TToken>) {
      super(token, config);
    }
  } as unknown as ModelClass<TToken>;
}

/**
 * Base model class that handles core functionality
 * @template TToken - The model token
 */
export default class Model<TToken extends ModelToken> {
  public readonly modelName: string;

  protected _attrs: ModelAttrs<TToken>;
  protected _dbCollection: DbCollection<InferTokenModel<TToken>>;
  protected _status: 'new' | 'saved';

  constructor(token: TToken, { attrs, collection }: ModelConfig<TToken>) {
    this.modelName = token.modelName;

    this._attrs = { ...attrs, id: attrs?.id ?? null } as ModelAttrs<TToken>;
    this._dbCollection =
      collection ?? new DbCollection<InferTokenModel<TToken>>(token.collectionName);
    this._status = this._attrs.id ? this._verifyStatus(this._attrs.id) : 'new';

    this.initAttributeAccessors();
  }

  // -- GETTERS --

  /**
   * Getter for the protected id attribute
   * @returns The id of the model
   */
  get id(): InferTokenModel<TToken>['id'] | null {
    return this._attrs.id;
  }

  /**
   * Getter for the model attributes
   * @returns A copy of the model attributes
   */
  get attrs(): ModelAttrs<TToken> {
    return { ...this._attrs };
  }

  // -- MAIN METHODS --

  /**
   * Destroy the model from the database
   * @returns The model with new instance type
   */
  destroy(): ModelInstance<TToken> {
    if (this.isSaved() && this.id) {
      this._dbCollection.remove(this.id as InferTokenModel<TToken>['id']);
      this._attrs = { ...this._attrs, id: null } as ModelAttrs<TToken>;
      this._status = 'new';
    }

    return this as unknown as ModelInstance<TToken>;
  }

  /**
   * Reload the model from the database
   * @returns The model with saved instance type
   */
  reload(): SavedModelInstance<TToken> {
    if (this.isSaved() && this.id) {
      this._attrs = this._dbCollection.find(
        this.id as InferTokenModel<TToken>['id'],
      ) as ModelAttrs<TToken>;
    }

    return this as unknown as SavedModelInstance<TToken>;
  }

  /**
   * Save the model to the database
   * @returns The model with saved instance type
   */
  save(): SavedModelInstance<TToken> {
    if (this.isNew() || !this.id) {
      const modelRecord = this._dbCollection.insert(
        this._attrs as DbRecordInput<InferTokenModel<TToken>>,
      );
      this._attrs = modelRecord as ModelAttrs<TToken>;
      this._status = 'saved';
    } else {
      this._dbCollection.update(
        this.id as InferTokenModel<TToken>['id'],
        this._attrs as DbRecordInput<InferTokenModel<TToken>>,
      );
    }

    return this as unknown as SavedModelInstance<TToken>;
  }

  /**
   * Update the model attributes and save the model
   * @param attrs - The attributes to update
   * @returns The model with saved instance type
   */
  update(attrs: PartialModelAttrs<TToken>): SavedModelInstance<TToken> {
    Object.assign(this._attrs, attrs);
    return this.save();
  }

  // -- STATUS --

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
  toJSON(): any {
    return { ...this._attrs };
  }

  /**
   * Serialize the model to a string
   * @returns The simple string representation of the model and its id
   */
  toString(): string {
    let idLabel = this.id ? `(${this.id})` : '';
    return `model:${this.modelName}${idLabel}`;
  }

  // -- ATTRIBUTE ACCESSORS --

  /**
   * Initialize attribute accessors for all attributes except id
   */
  protected initAttributeAccessors(): void {
    // Remove old accessors
    for (const key in this._attrs) {
      if (key !== 'id' && Object.prototype.hasOwnProperty.call(this, key)) {
        delete this[key as keyof this];
      }
    }

    // Set up new accessors
    for (const key in this._attrs) {
      if (key !== 'id' && !Object.prototype.hasOwnProperty.call(this, key)) {
        Object.defineProperty(this, key, {
          get: () => {
            return this._attrs[key];
          },
          set: (value: ModelAttrs<TToken>[keyof ModelAttrs<TToken>]) => {
            this._attrs[key as keyof ModelAttrs<TToken>] = value;
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  // -- PRIVATE METHODS --

  /**
   * Verify the status of the model during initialization when the id is provided
   * @param id - The id of the model
   * @returns The status of the model
   */
  private _verifyStatus(id: InferTokenModel<TToken>['id']): 'new' | 'saved' {
    return this._dbCollection.find(id) ? 'saved' : 'new';
  }
}
