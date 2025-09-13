import type { ModelToken, NewModelAttrs, ModelAttrs, ModelInstance } from '@src/model';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

/**
 * Factory afterCreate hook type - handles simple model instances without schema/relationships
 */
export type FactoryAfterCreateHook = (model: any) => void;

/**
 * Schema-aware afterCreate hook type - handles full ModelInstance with schema and relationships
 * @template TSchema - The schema collections type
 * @template TToken - The model token
 */
export type SchemaAfterCreateHook<TSchema extends SchemaCollections, TToken extends ModelToken> = (
  model: ModelInstance<TToken, TSchema>,
  schema: SchemaInstance<TSchema>,
) => void;

export type TraitDefinition<TToken extends ModelToken> = Partial<FactoryAttrs<TToken>> & {
  afterCreate?: FactoryAfterCreateHook;
};

export type ModelTraits<TToken extends ModelToken> = Record<string, TraitDefinition<TToken>>;

export type TraitName<TTraits extends ModelTraits<any>> = Extract<keyof TTraits, string>;

/**
 * Schema trait definition with enhanced afterCreate hook
 * @template TSchema - The schema collections type
 * @template TToken - The model token
 */
export type SchemaTraitDefinition<
  TSchema extends SchemaCollections,
  TToken extends ModelToken,
> = Partial<FactoryAttrs<TToken>> & {
  afterCreate?: SchemaAfterCreateHook<TSchema, TToken>;
};

/**
 * Schema factory traits collection
 * @template TSchema - The schema collections type
 * @template TToken - The model token
 */
export type SchemaFactoryTraits<
  TSchema extends SchemaCollections,
  TToken extends ModelToken,
> = Record<string, SchemaTraitDefinition<TSchema, TToken>>;

export type FactoryAttrs<TToken extends ModelToken> = Partial<{
  [K in Exclude<keyof NewModelAttrs<TToken>, 'id'>]:
    | NewModelAttrs<TToken>[K]
    | ((
        this: Record<keyof NewModelAttrs<TToken>, any>,
        modelId: NonNullable<ModelAttrs<TToken>['id']>,
      ) => NewModelAttrs<TToken>[K]);
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
