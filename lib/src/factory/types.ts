import type { ModelTemplate, NewModelAttrs, ModelAttrs, ModelInstance } from '@src/model';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

/**
 * Factory afterCreate hook type - handles simple model instances without schema/relationships
 */
export type FactoryAfterCreateHook = (model: any) => void;

/**
 * Schema-aware afterCreate hook type - handles full ModelInstance with schema and relationships
 * @template TSchema - The schema collections type
 * @template TTemplate - The model template
 */
export type SchemaAfterCreateHook<TSchema extends SchemaCollections, TTemplate extends ModelTemplate> = (
  model: ModelInstance<TTemplate, TSchema>,
  schema: SchemaInstance<TSchema>,
) => void;

export type TraitDefinition<TTemplate extends ModelTemplate> = Partial<FactoryAttrs<TTemplate>> & {
  afterCreate?: FactoryAfterCreateHook;
};

export type ModelTraits<TTemplate extends ModelTemplate> = Record<string, TraitDefinition<TTemplate>>;

export type TraitName<TTraits extends ModelTraits<any>> = Extract<keyof TTraits, string>;

/**
 * Schema trait definition with enhanced afterCreate hook
 * @template TSchema - The schema collections type
 * @template TTemplate - The model template
 */
export type SchemaTraitDefinition<
  TSchema extends SchemaCollections,
  TTemplate extends ModelTemplate,
> = Partial<FactoryAttrs<TTemplate>> & {
  afterCreate?: SchemaAfterCreateHook<TSchema, TTemplate>;
};

/**
 * Schema factory traits collection
 * @template TSchema - The schema collections type
 * @template TTemplate - The model template
 */
export type SchemaFactoryTraits<
  TSchema extends SchemaCollections,
  TTemplate extends ModelTemplate,
> = Record<string, SchemaTraitDefinition<TSchema, TTemplate>>;

export type FactoryAttrs<TTemplate extends ModelTemplate> = Partial<{
  [K in Exclude<keyof NewModelAttrs<TTemplate>, 'id'>]:
    | NewModelAttrs<TTemplate>[K]
    | ((
        this: Record<keyof NewModelAttrs<TTemplate>, any>,
        modelId: NonNullable<ModelAttrs<TTemplate>['id']>,
      ) => NewModelAttrs<TTemplate>[K]);
}>;

// -- NEW BUILDER TYPES --

/**
 * Infer traits from a factory type
 * @template TFactory - The factory type
 */
export type InferFactoryTraits<TFactory> = TFactory extends { traits: infer TTraits }
  ? TTraits
  : {};

/**
 * Extract trait names from a factory type
 * @template TFactory - The factory type
 */
export type FactoryTraitNames<TFactory> = TFactory extends { traits: infer TTraits }
  ? TTraits extends Record<string, any>
    ? Extract<keyof TTraits, string>
    : never
  : never;
