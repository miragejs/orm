import type {
  ModelToken,
  ModelInstance,
  InferTokenModel,
  InferTokenSerializedModel,
  InferTokenSerializedCollection,
} from '@src/model';

/**
 * Serializer class that handles model serialization
 * @template TTemplate - The model template
 * @template TConfig - The serializer configuration type
 * @template TSerializedModel - The serialized model type (inferred from template by default)
 * @template TSerializedCollection - The serialized collection type (inferred from template by default)
 */
export default class Serializer<
  TToken extends ModelToken,
  TConfig extends SerializerConfig<TToken> = SerializerConfig<TToken>,
  TSerializedModel = InferTokenSerializedModel<TToken>,
  TSerializedCollection = InferTokenSerializedCollection<TToken>,
> {
  protected token: TToken;
  protected modelName: string;
  protected collectionName: string;
  protected attrs: TConfig['attrs'];
  protected root: TConfig['root'];

  constructor(token: TToken, config?: TConfig) {
    this.token = token;
    this.modelName = token.modelName;
    this.collectionName = token.collectionName;
    this.attrs = config?.attrs ?? [];
    this.root = config?.root ?? false;
  }

  /**
   * Serialize a single model instance
   * @param model - The model instance to serialize
   * @returns The serialized model
   */
  serialize(model: ModelInstance<TToken>): TSerializedModel {
    const attrs = this._getAttributes(model);

    if (this.root) {
      const rootKey = typeof this.root === 'string' ? this.root : this.modelName;
      return { [rootKey]: attrs } as TSerializedModel;
    }

    return attrs as TSerializedModel;
  }

  /**
   * Serialize multiple model instances
   * @param models - Array of model instances to serialize
   * @returns The serialized collection (format depends on template's collection serialization type)
   */
  serializeCollection(models: ModelInstance<TToken>[]): TSerializedCollection {
    if (this.root) {
      const serializedModels = models.map((model) => this._getAttributes(model));
      const rootKey = typeof this.root === 'string' ? this.root : this.collectionName;

      return {
        [rootKey]: serializedModels,
      } as TSerializedCollection;
    }

    return models.map((model) => this._getAttributes(model)) as TSerializedCollection;
  }

  /**
   * Get the attributes to include in serialization
   * @param model - The model instance
   * @returns Object with attributes
   */
  private _getAttributes(model: ModelInstance<TToken>): Record<string, any> {
    if (this.attrs?.length) {
      return this.attrs.reduce(
        (acc, attr) => {
          acc[attr as string] = model.attrs[attr as keyof typeof model.attrs];
          return acc;
        },
        {} as Record<string, any>,
      );
    }

    return model.attrs;
  }
}

/**
 * Configuration for creating a serializer
 * @template TTemplate - The model template
 */
export interface SerializerConfig<TToken extends ModelToken> {
  attrs?: (keyof InferTokenModel<TToken>)[];
  root?: boolean | string;
}
