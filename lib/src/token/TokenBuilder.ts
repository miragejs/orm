import { ModelSerialization } from '@src/model/types';

import { ModelToken } from './types';

/**
 * A fluent builder for creating strongly-typed model tokens.
 *
 * The TokenBuilder provides a type-safe way to construct ModelToken instances with
 * configurable model attributes and serialization types. It follows the builder pattern,
 * allowing method chaining to progressively refine the token's type parameters.
 * @template TModel - The model attributes type (must have an 'id' property)
 * @template TSer - The serialization configuration extending ModelSerialization
 * @template TModelName - The string literal type for the model name
 * @template TCollectionName - The string literal type for the collection name
 * @example
 * ```typescript
 * // Create a basic token
 * const userToken = token('user', 'users').create();
 *
 * // Create a token with specific model attributes
 * interface User { id: string; name: string; email: string; }
 * const typedUserToken = token('user', 'users')
 *   .attrs<UserAttrs>()
 *   .create();
 *
 * // Create a token with custom serialization
 * const serializedUserToken = token('user', 'users')
 *   .attrs<UserAttrs>()
 *   .serialization<User, UserList>()
 *   .create();
 * ```
 */
export default class TokenBuilder<
  TModel extends { id: any },
  TSer extends ModelSerialization<any, any>,
  TModelName extends string,
  TCollectionName extends string,
> {
  /**
   * Creates a new TokenBuilder instance.
   * @param _modelName - The name identifier for the model
   * @param _collectionName - The name identifier for the collection
   * @private
   */
  constructor(
    private readonly _modelName: TModelName,
    private readonly _collectionName: TCollectionName,
  ) {}

  /**
   * Sets the model attributes type and resets serialization to default.
   *
   * This method allows you to specify the exact shape of your model attributes,
   * providing strong typing for the resulting token. When called, it resets the
   * serialization types to the default ModelSerialization<T, T[]>.
   * @template T - The model attributes type (must extend { id: any })
   * @returns A new TokenBuilder instance with the specified model type
   * @example
   * ```typescript
   * interface User { id: string; name: string; email: string; }
   * const builder = token('user', 'users').attrs<UserAttrs>();
   * ```
   */
  attrs<T extends { id: any }>() {
    return new TokenBuilder<T, ModelSerialization<T>, TModelName, TCollectionName>(
      this._modelName,
      this._collectionName,
    );
  }

  /**
   * Overrides the serialization types explicitly, independent from model attributes.
   *
   * This method allows you to specify custom serialization types for both individual
   * models and collections, which is useful when your API returns data in a different
   * format than your internal model representation.
   * @template SerializedModel - The type for serialized individual models (defaults to TModel)
   * @template SerializedCollection - The type for serialized collections (defaults to SerializedModel[])
   * @returns A new TokenBuilder instance with the specified serialization types
   * @example
   * ```typescript
   * interface User { id: string; name: string; }
   * interface User { id: string; displayName: string; }
   * interface UserList { users: User[]; total: number; }
   *
   * const builder = token('user', 'users')
   *   .attrs<UserAttrs>()
   *   .serialization<User, UserList>();
   * ```
   */
  serialization<SerializedModel = TModel, SerializedCollection = SerializedModel[]>() {
    return new TokenBuilder<
      TModel,
      ModelSerialization<SerializedModel, SerializedCollection>,
      TModelName,
      TCollectionName
    >(this._modelName, this._collectionName);
  }

  /**
   * Creates the final ModelToken with all configured types.
   *
   * This method produces the immutable ModelToken that can be used throughout
   * your application for type-safe model operations. The token includes the
   * model and collection names along with a unique symbol key.
   * @returns The configured ModelToken instance
   * @example
   * ```typescript
   * const userToken = token('user', 'users')
   *   .attrs<UserAttrs>()
   *   .create();
   *
   * // Use the token for type-safe operations
   * const userCollection = db.getCollection(userToken);
   * ```
   */
  create(): ModelToken<TModel, TSer, TModelName, TCollectionName> {
    return {
      modelName: this._modelName,
      collectionName: this._collectionName,
      key: Symbol(this._modelName),
    };
  }
}
