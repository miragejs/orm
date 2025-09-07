import type { ModelToken, NewModelAttrs, ModelAttrs } from '@src/model';
import type { ModelRelationships } from '@src/model';

export type TraitDefinition<
  TToken extends ModelToken,
  TRelationships extends ModelRelationships | undefined = undefined,
> = Partial<FactoryAttrs<TToken>> & {
  afterCreate?: (model: any) => void;
};

export type ModelTraits<
  TToken extends ModelToken,
  TRelationships extends ModelRelationships | undefined = undefined,
> = Record<string, TraitDefinition<TToken, TRelationships>>;

export type TraitName<TTraits extends ModelTraits<any, any>> = Extract<keyof TTraits, string>;

export type FactoryAttrs<TToken extends ModelToken> = Partial<{
  [K in Exclude<keyof NewModelAttrs<TToken>, 'id'>]:
    | NewModelAttrs<TToken>[K]
    | ((
        this: Record<keyof NewModelAttrs<TToken>, any>,
        modelId: NonNullable<ModelAttrs<TToken>['id']>,
      ) => NewModelAttrs<TToken>[K]);
}>;

/**
 * Configuration for creating a factory
 * @template TToken - The model token
 * @template TTraits - The traits object type
 * @template TRelationships - The relationships configuration
 * @param config.attributes - The attributes for the factory
 * @param config.traits - The traits for the factory
 * @param config.afterCreate - The afterCreate hook for the factory
 */
export interface FactoryConfig<
  TToken extends ModelToken,
  TRelationships extends ModelRelationships | undefined = undefined,
  TTraits extends ModelTraits<TToken, TRelationships> = ModelTraits<TToken, TRelationships>,
> {
  attributes: FactoryAttrs<TToken>;
  traits?: TTraits;
  afterCreate?: (model: any) => void;
}

/**
 * Definition for extending a factory (attributes are partially optional)
 * @template TToken - The model token
 * @template TTraits - The traits object type
 * @template TRelationships - The relationships configuration
 */
export type FactoryDefinition<
  TToken extends ModelToken,
  TRelationships extends ModelRelationships | undefined = undefined,
  TTraits extends ModelTraits<TToken, TRelationships> = ModelTraits<TToken, TRelationships>,
> = {
  attributes?: Partial<FactoryAttrs<TToken>>;
  traits?: TTraits;
  afterCreate?: (model: any) => void;
};
