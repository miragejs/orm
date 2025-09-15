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
 * const userTemplate = model('user', 'users').create();
 *
 * // Create a template with specific model attributes
 * interface User { id: string; name: string; email: string; }
 * const typedUserTemplate = model('user', 'users')
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

  /**
   * Creates a new ModelBuilder instance.
   * @param _modelName - The name identifier for the model
   * @param _collectionName - The name identifier for the collection
   * @private
   */
  constructor(
    private readonly _modelName: TModelName,
    private readonly _collectionName: TCollectionName,
  ) {}

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
    const builder = new ModelBuilder<T, TModelName, TCollectionName>(
      this._modelName,
      this._collectionName,
    );
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
   * @example
   * ```typescript
   * const userTemplate = model('user', 'users')
   *   .attrs<UserAttrs>()
   *   .create();
   * ```
   */
  create(): ModelTemplate<TModelAttrs, TModelName, TCollectionName> {
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
 * @param modelName - The name identifier for the model (e.g., 'user', 'post')
 * @param collectionName - The name identifier for the collection (e.g., 'users', 'posts')
 * @returns A new ModelBuilder instance ready for configuration
 * @example
 * ```typescript
 * // Basic usage
 * const userTemplate = model('user', 'users').create();
 *
 * // With typed attributes
 * interface UserAttrs { id: string; name: string; email: string; }
 * const typedUserTemplate = model('user', 'users')
 *   .attrs<UserAttrs>()
 *   .create();
 *
 * // With default attributes
 * const defaultUserTemplate = model('user', 'users')
 *   .attrs({ id: '', name: 'Anonymous', email: '' })
 *   .create();
 * ```
 */
export function model<TModelName extends string, TCollectionName extends string>(
  modelName: TModelName,
  collectionName: TCollectionName,
): ModelBuilder<{ id: string | null }, TModelName, TCollectionName> {
  return new ModelBuilder(modelName, collectionName);
}
