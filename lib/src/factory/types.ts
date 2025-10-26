import type { FactoryAssociations } from '@src/associations';
import type {
  InferModelAttrs,
  ModelAttrs,
  ModelInstance,
  ModelOnlyAttrs,
  ModelTemplate,
} from '@src/model';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

export type FactoryAfterCreateHook<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
> = (model: ModelInstance<TTemplate, TSchema>, schema: SchemaInstance<TSchema>) => void;

export type TraitDefinition<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
> = Partial<FactoryAttrs<TTemplate>> &
  Partial<FactoryAssociations<TTemplate, TSchema>> & {
    afterCreate?: FactoryAfterCreateHook<TSchema, TTemplate>;
  };

export type ModelTraits<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
> = Record<string, TraitDefinition<TSchema, TTemplate>>;

export type TraitName<TTraits> =
  TTraits extends Record<string, any> ? Extract<keyof TTraits, string> : never;

export type FactoryAttrs<TTemplate extends ModelTemplate> = {
  [K in keyof ModelOnlyAttrs<TTemplate>]?:
    | ModelOnlyAttrs<TTemplate>[K]
    | ((
        this: ModelOnlyAttrs<TTemplate>,
        modelId: NonNullable<ModelAttrs<TTemplate>['id']>,
      ) => InferModelAttrs<TTemplate>[K]);
};

export type FactoryTraitNames<TFactory> = TFactory extends { traits: infer TTraits }
  ? TTraits extends Record<string, any>
    ? Extract<keyof TTraits, string>
    : never
  : never;
