import type { ModelTemplate } from '@src/model';
import type { SchemaCollections } from '@src/schema';
import { MirageError } from '@src/utils';

import Factory from './Factory';
import type { FactoryAttrs, FactoryAfterCreateHook, ModelTraits } from './types';

/**
 * Builder class for creating factories with fluent API
 * @template TTemplate - The model template
 * @template TSchema - The schema collections type
 * @template TTraits - The traits type
 */
export default class FactoryBuilder<
  TTemplate extends ModelTemplate<any, any, any> = ModelTemplate<any, any, any>,
  TSchema extends SchemaCollections = SchemaCollections,
  TTraits extends ModelTraits<TSchema, TTemplate> = {},
> {
  protected _template?: TTemplate;
  protected _attributes: FactoryAttrs<TTemplate> = {} as FactoryAttrs<TTemplate>;
  protected _traits: TTraits = {} as TTraits;
  protected _afterCreate?: FactoryAfterCreateHook<TSchema, TTemplate>;

  constructor() {}

  /**
   * Set the model template for the factory
   * @template T - The model template type
   * @param template - The model template
   * @returns A new builder instance with the specified template
   */
  model<T extends ModelTemplate<any, any, any>>(template: T): FactoryBuilder<T, TSchema, {}> {
    const builder = new FactoryBuilder<T, TSchema, {}>();
    builder._template = template;
    return builder;
  }

  /**
   * Set the attributes for the factory
   * @param attributes - The factory attributes
   * @returns The builder instance for chaining
   */
  attrs(attributes: FactoryAttrs<TTemplate>): this {
    this._attributes = { ...this._attributes, ...attributes };
    return this;
  }

  /**
   * Add traits to the factory
   * @param traits - The traits to add
   * @returns A new builder instance with the added traits
   */
  traits<T extends ModelTraits<TSchema, TTemplate>>(
    traits: T,
  ): FactoryBuilder<TTemplate, TSchema, TTraits & T> {
    const builder = new FactoryBuilder<TTemplate, TSchema, TTraits & T>();
    builder._template = this._template;
    builder._attributes = this._attributes;
    builder._traits = { ...this._traits, ...traits } as TTraits & T;
    builder._afterCreate = this._afterCreate;
    return builder;
  }

  /**
   * Set the afterCreate hook
   * @param hook - The afterCreate hook function
   * @returns The builder instance for chaining
   */
  afterCreate(hook: FactoryAfterCreateHook<TSchema, TTemplate>): this {
    this._afterCreate = hook;
    return this;
  }

  /**
   * Create a factory builder by extending an existing factory
   * @param originalFactory - The factory to extend
   * @returns A new factory builder based on the existing factory
   */
  extend<
    TTemplate extends ModelTemplate = ModelTemplate,
    TSchema extends SchemaCollections = SchemaCollections,
    TTraits extends ModelTraits<TSchema, TTemplate> = {},
  >(
    originalFactory: Factory<TTemplate, TSchema, TTraits>,
  ): FactoryBuilder<TTemplate, TSchema, TTraits> {
    const builder = new FactoryBuilder<TTemplate, TSchema, TTraits>();
    builder._template = originalFactory.template;
    builder._attributes = { ...originalFactory.attributes };
    builder._traits = { ...originalFactory.traits };
    builder._afterCreate = originalFactory.afterCreate;
    return builder;
  }

  /**
   * Build the final factory instance
   * @returns The factory instance
   */
  create(): Factory<TTemplate, TSchema, TTraits> {
    if (!this._template) {
      throw new MirageError(
        'Model template must be set before creating factory. Call .model() first.',
      );
    }

    return new Factory(this._template, this._attributes, this._traits, this._afterCreate);
  }
}

/**
 * Create a factory builder with optional schema type
 * @template TSchema - The schema collections type (optional)
 * @returns Factory builder instance ready for model specification
 */
export function factory<TSchema extends SchemaCollections>(): FactoryBuilder<
  ModelTemplate,
  TSchema,
  {}
> {
  return new FactoryBuilder<ModelTemplate, TSchema, {}>();
}
