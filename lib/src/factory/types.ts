import type { ModelToken, NewModelAttrs, ModelAttrs, ModelInstance } from '@src/model';

export type TraitMap<TToken extends ModelToken> = Record<string, TraitDefinition<TToken>>;
export type TraitName<TTraits extends TraitMap<any>> = Extract<keyof TTraits, string>;

// Forward declaration to avoid circular dependency
declare class Factory<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
> {
  readonly token: TToken;
  readonly modelName: string;
  readonly collectionName: string;
  readonly attributes: FactoryAttrs<TToken>;
  readonly traits: TTraits;
  readonly afterCreate?: (model: ModelInstance<TToken>) => void;
}

export type FactoryAttrs<TToken extends ModelToken> = Partial<{
  [K in Exclude<keyof NewModelAttrs<TToken>, 'id'>]:
    | NewModelAttrs<TToken>[K]
    | ((
        this: Record<keyof NewModelAttrs<TToken>, any>,
        modelId: NonNullable<ModelAttrs<TToken>['id']>,
      ) => NewModelAttrs<TToken>[K]);
}>;

export type TraitDefinition<TToken extends ModelToken> = Partial<FactoryAttrs<TToken>> & {
  afterCreate?: (model: ModelInstance<TToken>) => void;
};

/**
 * Configuration for creating a factory
 * @template TToken - The model token
 * @template TTraits - The traits object type
 * @param config.attributes - The attributes for the factory
 * @param config.traits - The traits for the factory
 * @param config.afterCreate - The afterCreate hook for the factory
 */
export interface FactoryConfig<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
> {
  attributes: FactoryAttrs<TToken>;
  traits?: TTraits;
  afterCreate?: (model: ModelInstance<TToken>) => void;
}

/**
 * Definition for extending a factory (attributes are partially optional)
 * @template TToken - The model token
 * @template TTraits - The traits object type
 */
export type FactoryDefinition<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
> = {
  attributes?: Partial<FactoryAttrs<TToken>>;
  traits?: TTraits;
  afterCreate?: (model: ModelInstance<TToken>) => void;
};

export type FactoryInstance<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
> = Factory<TToken, TTraits>;
