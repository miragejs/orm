import type { FactoryAssociations } from '@src/associations';
import type { ModelTemplate } from '@src/model';
import type { SchemaCollections } from '@src/schema';
import { MirageError } from '@src/utils';

import Factory from './Factory';
import type {
  FactoryAttrs,
  FactoryAfterCreateHook,
  ModelTraits,
  ExtractTraitsFromSchema,
  TraitDefinition,
} from './types';

/**
 * Builder class for creating factories with fluent API
 * @template TTemplate - The model template
 * @template TTraits - The trait names as string union
 * @template TSchema - The schema collections type
 */
export default class FactoryBuilder<
  TTemplate extends ModelTemplate = ModelTemplate,
  TTraits extends string = string,
  TSchema extends SchemaCollections = SchemaCollections,
> {
  protected _template?: TTemplate;
  protected _attributes: FactoryAttrs<TTemplate> =
    {} as FactoryAttrs<TTemplate>;
  protected _traits: ModelTraits<TTraits, TTemplate, TSchema> =
    {} as ModelTraits<TTraits, TTemplate, TSchema>;
  protected _associations?: FactoryAssociations<TTemplate, TSchema>;
  protected _afterCreate?: FactoryAfterCreateHook<TSchema, TTemplate>;

  constructor() {}

  /**
   * Set the model template for the factory
   * @template T - The model template type
   * @param template - The model template
   * @returns A new builder instance with the specified template and traits extracted from schema
   */
  model<T extends ModelTemplate>(
    template: T,
  ): FactoryBuilder<T, ExtractTraitsFromSchema<TSchema, T>, TSchema> {
    const builder = new FactoryBuilder<
      T,
      ExtractTraitsFromSchema<TSchema, T>,
      TSchema
    >();
    builder._template = template;
    return builder;
  }

  /**
   * Set the attributes for the factory
   * @param attributes - The factory attributes
   * @returns The builder instance for chaining
   */
  attrs(attributes: Partial<FactoryAttrs<TTemplate>>): this {
    this._attributes = { ...this._attributes, ...attributes };
    return this;
  }

  /**
   * Add traits to the factory
   * @param traits - The traits to add (supports schema-defined traits and custom traits)
   * @returns A new builder instance with the merged traits
   */
  traits<TNewTraits extends string = never>(
    traits: string extends TTraits
      ? ModelTraits<TNewTraits, TTemplate, TSchema>
      : Partial<Record<TTraits, TraitDefinition<TTemplate, TSchema>>> &
          ModelTraits<TNewTraits, TTemplate, TSchema>,
  ): FactoryBuilder<
    TTemplate,
    string extends TTraits ? TNewTraits : TTraits | TNewTraits,
    TSchema
  > {
    const builder = new FactoryBuilder<
      TTemplate,
      string extends TTraits ? TNewTraits : TTraits | TNewTraits,
      TSchema
    >();
    builder._template = this._template;
    builder._attributes = this._attributes;
    builder._traits = {
      ...this._traits,
      ...traits,
    } as unknown as ModelTraits<
      string extends TTraits ? TNewTraits : TTraits | TNewTraits,
      TTemplate,
      TSchema
    >;
    builder._afterCreate = this._afterCreate;
    builder._associations = this._associations;
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
   * Set factory associations for automatic relationship creation
   * @param associations - The associations configuration
   * @returns The builder instance for chaining
   */
  associations(associations: FactoryAssociations<TTemplate, TSchema>): this {
    this._associations = associations;
    return this;
  }

  /**
   * Create a factory builder by extending an existing factory
   * @param originalFactory - The factory to extend
   * @returns A new factory builder based on the existing factory
   */
  extend<
    TTemplate extends ModelTemplate = ModelTemplate,
    TTraits extends string = string,
    TSchema extends SchemaCollections = SchemaCollections,
  >(
    originalFactory: Factory<TTemplate, TTraits, TSchema>,
  ): FactoryBuilder<TTemplate, TTraits, TSchema> {
    const builder = new FactoryBuilder<TTemplate, TTraits, TSchema>();
    builder._template = originalFactory.template;
    builder._attributes = { ...originalFactory.attributes };
    builder._traits = { ...(originalFactory.traits as any) } as ModelTraits<
      TTraits,
      TTemplate,
      TSchema
    >;
    builder._associations = { ...originalFactory.associations };
    builder._afterCreate = originalFactory.afterCreate;
    return builder;
  }

  /**
   * Builds the final factory instance
   * @returns The factory instance
   */
  build(): Factory<TTemplate, TTraits, TSchema> {
    if (!this._template) {
      throw new MirageError(
        'Model template must be set before building factory. Call .model() first.',
      );
    }

    return new Factory(
      this._template,
      this._attributes,
      this._traits as ModelTraits<TTraits, TTemplate, TSchema>,
      this._associations,
      this._afterCreate,
    );
  }
}

/**
 * Create a factory builder with optional schema type
 * @template TSchema - The schema collections type (optional)
 * @returns Factory builder instance ready for model specification
 */
export function factory<TSchema extends SchemaCollections>(): FactoryBuilder<
  ModelTemplate,
  string,
  TSchema
> {
  return new FactoryBuilder<ModelTemplate, string, TSchema>();
}
