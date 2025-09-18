import type { ModelTemplate, NewModelAttrs, ModelAttrs, ModelInstance } from '@src/model';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

export type FactoryAfterCreateHook<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
> = (model: ModelInstance<TTemplate, TSchema>, schema: SchemaInstance<TSchema>) => void;

export type TraitDefinition<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
> = Partial<FactoryAttrs<TTemplate>> & {
  afterCreate?: FactoryAfterCreateHook<TSchema, TTemplate>;
};

export type ModelTraits<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
> = Record<string, TraitDefinition<TSchema, TTemplate>>;

export type TraitName<TTraits extends ModelTraits<any>> = Extract<keyof TTraits, string>;

export type FactoryAttrs<TTemplate extends ModelTemplate> = Partial<{
  [K in Exclude<keyof NewModelAttrs<TTemplate>, 'id'>]:
    | NewModelAttrs<TTemplate>[K]
    | ((
        this: Record<keyof NewModelAttrs<TTemplate>, any>,
        modelId: NonNullable<ModelAttrs<TTemplate>['id']>,
      ) => NewModelAttrs<TTemplate>[K]);
}>;

export type FactoryTraitNames<TFactory> = TFactory extends { traits: infer TTraits }
  ? TTraits extends Record<string, any>
    ? Extract<keyof TTraits, string>
    : never
  : never;
