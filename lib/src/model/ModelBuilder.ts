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
 * ```
 */
export default class ModelBuilder<
  TModelAttrs extends { id: any },
  TModelName extends string,
  TCollectionName extends string,
> {
  private _attrs?: Partial<TModelAttrs>;
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
  name<T extends string>(modelName: T): ModelBuilder<TModelAttrs, T, TCollectionName> {
    const builder = new ModelBuilder<TModelAttrs, T, TCollectionName>();
    builder._modelName = modelName;
    builder._collectionName = this._collectionName as TCollectionName;
    builder._attrs = this._attrs;
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
  collection<T extends string>(collectionName: T): ModelBuilder<TModelAttrs, TModelName, T> {
    const builder = new ModelBuilder<TModelAttrs, TModelName, T>();
    builder._modelName = this._modelName as TModelName;
    builder._collectionName = collectionName;
    builder._attrs = this._attrs;
    return builder;
  }

  /**
   * Sets the model attributes type and optionally provides default attributes.
   *
   * This method allows you to specify the exact shape of your model attributes,
   * providing strong typing for the resulting template.
   * @template T - The model attributes type (must extend { id: any })
   * @returns A new ModelBuilder instance with the specified model type
   * @example
   * ```typescript
   * interface User { id: string; name: string; email: string; }
   * const builder = model('user', 'users').attrs<UserAttrs>();
   * ```
   */
  attrs<T extends { id: any }>(): ModelBuilder<T, TModelName, TCollectionName>;

  /**
   * Sets the model attributes type with default attributes.
   *
   * This method allows you to specify the exact shape of your model attributes,
   * providing strong typing for the resulting template and default attribute values.
   * @param defaultAttrs - Default attributes for JavaScript usage (type inference)
   * @template T - The model attributes type (must extend { id: any })
   * @returns A new ModelBuilder instance with the specified model type
   * @example
   * ```javascript
   * const builder = model('user', 'users').attrs({ id: '', name: '', email: '' });
   * ```
   */
  attrs<T extends { id: any }>(
    defaultAttrs: Partial<T>,
  ): ModelBuilder<T, TModelName, TCollectionName>;

  // eslint-disable-next-line jsdoc/require-jsdoc -- Implementation
  attrs<T extends { id: any }>(defaultAttrs?: Partial<T>) {
    const builder = new ModelBuilder<T, TModelName, TCollectionName>();
    builder._modelName = this._modelName as TModelName;
    builder._collectionName = this._collectionName as TCollectionName;
    builder._attrs = defaultAttrs;
    return builder;
  }

  /**
   * Creates the final ModelTemplate with all configured types and attributes.
   *
   * This method produces the immutable ModelTemplate that can be used throughout
   * your application for type-safe model operations. The template includes the
   * model and collection names, a unique symbol key, and default attributes.
   * @returns The configured ModelTemplate instance
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
  create(): ModelTemplate<TModelAttrs, TModelName, TCollectionName> {
    if (!this._modelName) {
      throw new Error('Model name is required. Call .name() before .create()');
    }
    if (!this._collectionName) {
      throw new Error('Collection name is required. Call .collection() before .create()');
    }

    return {
      attrs: this._attrs || {},
      collectionName: this._collectionName,
      key: Symbol(this._modelName),
      modelName: this._modelName,
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
 * // With default attributes
 * const defaultUserTemplate = model()
 *   .name('user')
 *   .collection('users')
 *   .attrs({ id: '', name: 'Anonymous', email: '' })
 *   .create();
 * ```
 */
export function model(): ModelBuilder<{ id: string | null }, string, string> {
  return new ModelBuilder();
}
