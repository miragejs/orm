import type { ModelToken, ModelAttrs, SavedModelAttrs, InferTokenModel } from '@src/model';

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
  readonly afterCreate?: (model: SavedModelAttrs<TToken>) => void;
}

export type FactoryAttrs<TToken extends ModelToken> = Partial<{
  [K in Exclude<keyof ModelAttrs<TToken>, 'id'>]:
    | ModelAttrs<TToken>[K]
    | ((
        this: Record<keyof ModelAttrs<TToken>, any>,
        modelId: NonNullable<InferTokenModel<TToken>['id']>,
      ) => ModelAttrs<TToken>[K]);
}>;

export type TraitDefinition<TToken extends ModelToken> = Partial<FactoryAttrs<TToken>> & {
  afterCreate?: (model: SavedModelAttrs<TToken>) => void;
};

/**
 * Extract trait names from a factory instance
 * @template TFactory - The factory instance type
 */
export type ExtractTraitNames<TFactory> =
  TFactory extends Factory<any, infer TTraits> ? TraitName<TTraits> : never;

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
  afterCreate?: (model: SavedModelAttrs<TToken>) => void;
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
  afterCreate?: (model: SavedModelAttrs<TToken>) => void;
};

export type FactoryInstance<
  TToken extends ModelToken,
  TTraits extends TraitMap<TToken> = TraitMap<TToken>,
> = Factory<TToken, TTraits>;
