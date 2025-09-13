import type { ModelToken } from '@src/model';

import Factory from './Factory';
import type { FactoryAttrs, FactoryAfterCreateHook, ModelTraits } from './types';

/**
 * Builder class for creating factories with fluent API
 * @template TToken - The model token
 * @template TTraits - The traits type
 */
export default class FactoryBuilder<
  TToken extends ModelToken,
  TTraits extends ModelTraits<TToken> = {},
> {
  protected _token: TToken;
  protected _attributes: FactoryAttrs<TToken> = {};
  protected _traits: TTraits = {} as TTraits;
  protected _afterCreate?: FactoryAfterCreateHook;

  constructor(token: TToken) {
    this._token = token;
  }

  /**
   * Create a factory builder by extending an existing factory
   * @param existingFactory - The factory to extend
   * @returns A new factory builder based on the existing factory
   */
  static extend<TToken extends ModelToken, TTraits extends ModelTraits<TToken>>(
    existingFactory: Factory<TToken, TTraits>,
  ): FactoryBuilder<TToken, TTraits> {
    const builder = new FactoryBuilder<TToken, TTraits>(existingFactory.token);
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
  attrs(attributes: FactoryAttrs<TToken>): this {
    this._attributes = { ...this._attributes, ...attributes };
    return this;
  }

  /**
   * Add traits to the factory
   * @param traits - The traits to add
   * @returns A new builder instance with the added traits
   */
  traits<TNewTraits extends ModelTraits<TToken>>(
    traits: TNewTraits,
  ): FactoryBuilder<TToken, TTraits & TNewTraits> {
    const builder = new FactoryBuilder<TToken, TTraits & TNewTraits>(this._token);
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
    attributes?: Partial<FactoryAttrs<TToken>>;
    traits?: ModelTraits<TToken>;
    afterCreate?: FactoryAfterCreateHook;
  }): FactoryBuilder<TToken, TTraits> {
    const builder = new FactoryBuilder<TToken, TTraits>(this._token);

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
  create(): Factory<TToken, TTraits> {
    return new Factory(this._token, this._attributes, this._traits, this._afterCreate);
  }
}

/**
 * Create a factory builder
 * @param token - Model token
 * @returns Factory builder
 */
export function factory<TToken extends ModelToken, TTraits extends ModelTraits<TToken>>(
  token: TToken,
): FactoryBuilder<TToken, TTraits> {
  return new FactoryBuilder(token);
}
