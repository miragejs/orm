import type { ModelTemplate } from '@src/model';

import Factory from './Factory';
import type { FactoryAttrs, FactoryAfterCreateHook, ModelTraits } from './types';

/**
 * Builder class for creating factories with fluent API
 * @template TTemplate - The model template
 * @template TTraits - The traits type
 */
export default class FactoryBuilder<
  TTemplate extends ModelTemplate,
  TTraits extends ModelTraits<TTemplate> = {},
> {
  protected _template: TTemplate;
  protected _attributes: FactoryAttrs<TTemplate> = {};
  protected _traits: TTraits = {} as TTraits;
  protected _afterCreate?: FactoryAfterCreateHook;

  constructor(template: TTemplate) {
    this._template = template;
  }

  /**
   * Create a factory builder by extending an existing factory
   * @param existingFactory - The factory to extend
   * @returns A new factory builder based on the existing factory
   */
  static extend<TTemplate extends ModelTemplate, TTraits extends ModelTraits<TTemplate>>(
    existingFactory: Factory<TTemplate, TTraits>,
  ): FactoryBuilder<TTemplate, TTraits> {
    const builder = new FactoryBuilder<TTemplate, TTraits>(existingFactory.template);
    builder._attributes = { ...existingFactory.attributes };
    builder._traits = { ...existingFactory.traits };
    builder._afterCreate = existingFactory.afterCreate;
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
  traits<TNewTraits extends ModelTraits<TTemplate>>(
    traits: TNewTraits,
  ): FactoryBuilder<TTemplate, TTraits & TNewTraits> {
    const builder = new FactoryBuilder<TTemplate, TTraits & TNewTraits>(this._template);
    builder._attributes = this._attributes;
    builder._traits = { ...this._traits, ...traits } as TTraits & TNewTraits;
    builder._afterCreate = this._afterCreate;
    return builder;
  }

  /**
   * Set the afterCreate hook
   * @param hook - The afterCreate hook function
   * @returns The builder instance for chaining
   */
  afterCreate(hook: FactoryAfterCreateHook): this {
    this._afterCreate = hook;
    return this;
  }

  /**
   * Create an extended factory builder based on this one
   * @param definition - The extension definition
   * @param definition.attributes - Additional or overriding attributes
   * @param definition.traits - Additional or overriding traits
   * @param definition.afterCreate - New afterCreate hook (replaces existing)
   * @returns A new extended factory builder
   */
  extend(definition: {
    attributes?: Partial<FactoryAttrs<TTemplate>>;
    traits?: ModelTraits<TTemplate>;
    afterCreate?: FactoryAfterCreateHook;
  }): FactoryBuilder<TTemplate, TTraits> {
    const builder = new FactoryBuilder<TTemplate, TTraits>(this._template);

    // Merge attributes
    builder._attributes = {
      ...this._attributes,
      ...(definition.attributes || {}),
    };

    // Merge traits
    builder._traits = {
      ...this._traits,
      ...(definition.traits || {}),
    } as TTraits;

    // Use new afterCreate or keep existing
    builder._afterCreate = definition.afterCreate || this._afterCreate;

    return builder;
  }

  /**
   * Build the final factory instance
   * @returns The factory instance
   */
  create(): Factory<TTemplate, TTraits> {
    return new Factory(this._template, this._attributes, this._traits, this._afterCreate);
  }
}

/**
 * Create a factory builder
 * @param template - Model template
 * @returns Factory builder
 */
export function factory<TTemplate extends ModelTemplate, TTraits extends ModelTraits<TTemplate>>(
  template: TTemplate,
): FactoryBuilder<TTemplate, TTraits> {
  return new FactoryBuilder(template);
}
