import type { InferModelAttrs, ModelInstance, ModelTemplate } from '@src/model';
import type ModelCollection from '@src/model/ModelCollection';
import type { SchemaCollections } from '@src/schema';

import type { SerializerConfig } from './types';

/**
 * Serializer class that handles model serialization with custom JSON types
 * @template TTemplate - The model template
 * @template TSerializedModel - The serialized model type (for single model)
 * @template TSerializedCollection - The serialized collection type (for array of models)
 * @template TConfig - The serializer configuration type
 * @example
 * ```typescript
 * interface UserJSON {
 *   id: string;
 *   name: string;
 * }
 *
 * interface UsersJSON {
 *   users: UserJSON[];
 * }
 *
 * const serializer = new Serializer<UserTemplate, UserJSON, UsersJSON>(
 *   userTemplate,
 *   {
 *     attrs: ['id', 'name'],
 *     root: 'user'
 *   }
 * );
 * ```
 */
export default class Serializer<
  TTemplate extends ModelTemplate,
  TSerializedModel = InferModelAttrs<TTemplate>,
  TSerializedCollection = TSerializedModel[],
  TConfig extends SerializerConfig<TTemplate> = SerializerConfig<TTemplate>,
> {
  protected _template: TTemplate;
  protected _modelName: string;
  protected _collectionName: string;
  protected _attrs: TConfig['attrs'];
  protected _root: TConfig['root'];
  protected _embed: TConfig['embed'];

  constructor(template: TTemplate, config?: TConfig) {
    this._template = template;
    this._modelName = template.modelName;
    this._collectionName = template.collectionName;
    this._attrs = config?.attrs;
    this._root = config?.root;
    this._embed = config?.embed;
  }

  /**
   * Get the model name
   * @returns The model name
   */
  get modelName(): string {
    return this._modelName;
  }

  /**
   * Get the collection name
   * @returns The collection name
   */
  get collectionName(): string {
    return this._collectionName;
  }

  /**
   * Serialize a single model instance
   * @param model - The model instance to serialize
   * @returns The serialized model
   */
  serialize<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): TSerializedModel {
    const attrs = this._getAttributes(model);

    if (this._root) {
      const rootKey = typeof this._root === 'string' ? this._root : this._modelName;
      return { [rootKey]: attrs } as TSerializedModel;
    }

    return attrs as TSerializedModel;
  }

  /**
   * Serialize a model collection
   * @param collection - The model collection to serialize
   * @returns The serialized collection
   */
  serializeCollection<TSchema extends SchemaCollections>(
    collection: ModelCollection<TTemplate, TSchema>,
  ): TSerializedCollection {
    const models = collection.models;

    if (this._root) {
      const serializedModels = models.map((model) => this._getAttributes(model));
      const rootKey = typeof this._root === 'string' ? this._root : this._collectionName;

      return {
        [rootKey]: serializedModels,
      } as TSerializedCollection;
    }

    return models.map((model) => this._getAttributes(model)) as TSerializedCollection;
  }

  /**
   * Get the attributes to include in serialization
   * Can be overridden in subclasses for custom serialization logic
   * @param model - The model instance
   * @returns Object with attributes
   */
  protected _getAttributes<TSchema extends SchemaCollections>(
    model: ModelInstance<TTemplate, TSchema>,
  ): Record<string, any> {
    // If specific attributes are configured, only include those
    if (this._attrs && this._attrs.length > 0) {
      return this._attrs.reduce(
        (acc, attr) => {
          acc[attr as string] = model.attrs[attr as keyof typeof model.attrs];
          return acc;
        },
        {} as Record<string, any>,
      );
    }

    // Default: return raw attributes (no embedding, no filtering)
    // Embed logic would go here if this._embed is true
    return { ...model.attrs };
  }
}
