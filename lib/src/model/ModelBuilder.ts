import { MirageError } from '@src/utils';

import type { ModelTemplate } from './types';

/**
 * A fluent builder for creating strongly-typed model templates.
 *
 * The ModelBuilder provides a type-safe way to construct ModelTemplate instances with
 * configurable model attributes. It follows the builder pattern, allowing method chaining
 * to progressively refine the template's type parameters.
 * @template TModelAttrs - The model attributes type (must have an 'id' property)
 * @template TModelName - The string literal type for the model name
 * @template TCollectionName - The string literal type for the collection name
 * @template TSerializedModel - The serialized model type (for toJSON)
 * @template TSerializedCollection - The serialized collection type (for toJSON)
 * @example
 * ```typescript
 * // Create a basic template
 * const userTemplate = model().name('user').collection('users').create();
 *
 * // Create a template with specific model attributes
 * interface User { id: string; name: string; email: string; }
 * const typedUserTemplate = model()
 *   .name('user')
 *   .collection('users')
 *   .attrs<UserAttrs>()
 *   .create();
 *
 * // With custom JSON types
 * const jsonTypedTemplate = model()
 *   .name('user')
 *   .collection('users')
 *   .attrs<UserAttrs>()
 *   .json<UserJSON, UsersJSON>()
 *   .create();
 * ```
 */
export default class ModelBuilder<
  TModelAttrs extends { id: any } = { id: string },
  TModelName extends string = string,
  TCollectionName extends string = string,
  TSerializedModel = TModelAttrs,
  TSerializedCollection = TSerializedModel[],
> {
  private _modelName?: TModelName;
  private _collectionName?: TCollectionName;

  /**
   * Sets the model name identifier.
   * @template T - The string literal type for the model name
   * @param modelName - The name identifier for the model (e.g., 'user', 'post')
   * @returns A new ModelBuilder instance with the model name set
   * @example
   * ```typescript
   * const builder = model().name('user');
   * ```
   */
  name<T extends string>(
    modelName: T,
  ): ModelBuilder<TModelAttrs, T, TCollectionName, TSerializedModel, TSerializedCollection> {
    // Validate model name
    if (!modelName || typeof modelName !== 'string' || modelName.trim() === '') {
      throw new MirageError('Model name must be a non-empty string.');
    }

    const builder = new ModelBuilder<
      TModelAttrs,
      T,
      TCollectionName,
      TSerializedModel,
      TSerializedCollection
    >();
    builder._modelName = modelName;
    builder._collectionName = this._collectionName as TCollectionName;
    return builder;
  }

  /**
   * Sets the collection name identifier.
   * @template T - The string literal type for the collection name
   * @param collectionName - The name identifier for the collection (e.g., 'users', 'posts')
   * @returns A new ModelBuilder instance with the collection name set
   * @example
   * ```typescript
   * const builder = model().name('user').collection('users');
   * ```
   */
  collection<T extends string>(
    collectionName: T,
  ): ModelBuilder<TModelAttrs, TModelName, T, TSerializedModel, TSerializedCollection> {
    // Validate collection name
    if (!collectionName || typeof collectionName !== 'string' || collectionName.trim() === '') {
      throw new MirageError('Collection name must be a non-empty string.');
    }

    const builder = new ModelBuilder<
      TModelAttrs,
      TModelName,
      T,
      TSerializedModel,
      TSerializedCollection
    >();
    builder._modelName = this._modelName as TModelName;
    builder._collectionName = collectionName;
    return builder;
  }

  /**
   * Sets the model attributes type.
   *
   * This method allows you to specify the exact shape of your model attributes,
   * providing strong typing for the resulting template. Serialization types are
   * reset to default to the new attributes type (use .json() to override).
   * @template T - The model attributes type (must extend { id: any })
   * @returns A new ModelBuilder instance with the specified model type
   * @example
   * ```typescript
   * interface User { id: string; name: string; email: string; }
   * const builder = model().name('user').collection('users').attrs<UserAttrs>();
   * ```
   */
  attrs<T extends { id: any }>(): ModelBuilder<T, TModelName, TCollectionName, T, T[]> {
    const builder = new ModelBuilder<T, TModelName, TCollectionName, T, T[]>();
    builder._modelName = this._modelName as TModelName;
    builder._collectionName = this._collectionName as TCollectionName;
    return builder;
  }

  /**
   * Specifies serialization types for this model.
   *
   * This method sets the types returned by model.toJSON() and collection.toJSON().
   * If not called, toJSON() will return the model attributes type.
   * @template TModel - The serialized model type (single instance)
   * @template TCollection - The serialized collection type (array)
   * @returns A new ModelBuilder with serialization types
   * @example
   * ```typescript
   * interface UserJSON {
   *   id: string;
   *   name: string;
   *   email: string;
   * }
   *
   * interface UsersJSON {
   *   users: UserJSON[];
   * }
   *
   * const userModel = model()
   *   .name('user')
   *   .collection('users')
   *   .attrs<UserAttrs>()
   *   .json<UserJSON, UsersJSON>() // Specify serialization types
   *   .create();
   * ```
   */
  json<TModel = TModelAttrs, TCollection = TModel[]>(): ModelBuilder<
    TModelAttrs,
    TModelName,
    TCollectionName,
    TModel,
    TCollection
  > {
    const builder = new ModelBuilder<
      TModelAttrs,
      TModelName,
      TCollectionName,
      TModel,
      TCollection
    >();
    builder._modelName = this._modelName as TModelName;
    builder._collectionName = this._collectionName as TCollectionName;
    return builder;
  }

  /**
   * Creates the final ModelTemplate with all configured types and metadata.
   *
   * This method produces the immutable ModelTemplate that can be used throughout
   * your application for type-safe model operations. The template includes the
   * model and collection names, a unique symbol key, and hidden type properties
   * for attributes and serialization.
   * @returns The configured ModelTemplate instance with hidden type properties
   * @throws Error if model name or collection name is not set
   * @example
   * ```typescript
   * const userTemplate = model()
   *   .name('user')
   *   .collection('users')
   *   .attrs<UserAttrs>()
   *   .create();
   * ```
   */
  create(): ModelTemplate<TModelName, TCollectionName> & {
    __attrs: TModelAttrs;
    __json: {
      model: TSerializedModel;
      collection: TSerializedCollection;
    };
  } {
    if (!this._modelName) {
      throw new MirageError('Model name is required. Call .name() before .create()');
    }
    if (!this._collectionName) {
      throw new MirageError('Collection name is required. Call .collection() before .create()');
    }

    return {
      key: Symbol(`Model:${this._modelName}`),
      modelName: this._modelName,
      collectionName: this._collectionName,
      // Type-only property
      __attrs: undefined as any as TModelAttrs,
      // Type-only property
      __json: undefined as any as {
        model: TSerializedModel;
        collection: TSerializedCollection;
      },
    };
  }
}

/**
 * Creates a new ModelBuilder for constructing type-safe model templates.
 *
 * This is the primary entry point for creating model templates. It provides a fluent
 * interface for configuring model attributes and metadata.
 * @returns A new ModelBuilder instance ready for configuration
 * @example
 * ```typescript
 * // Basic usage
 * const userTemplate = model()
 *   .name('user')
 *   .collection('users')
 *   .create();
 *
 * // With typed attributes
 * interface UserAttrs { id: string; name: string; email: string; }
 * const typedUserTemplate = model()
 *   .name('user')
 *   .collection('users')
 *   .attrs<UserAttrs>()
 *   .create();
 *
 * // With custom JSON types
 * interface UserJSON { id: string; name: string; email: string; }
 * interface UsersJSON { users: UserJSON[]; }
 * const jsonTypedTemplate = model()
 *   .name('user')
 *   .collection('users')
 *   .attrs<UserAttrs>()
 *   .json<UserJSON, UsersJSON>()
 *   .create();
 * ```
 */
export function model(): ModelBuilder<{ id: string }, string, string> {
  return new ModelBuilder();
}
