import type { FactoryAssociations } from '@src/associations';
import type { InferModelAttrs, ModelInstance, ModelTemplate } from '@src/model';
import type { SchemaCollections, SchemaInstance } from '@src/schema';

// Forbid any keys in U that are not in T
type Exact<T, U extends T> = T & { [K in Exclude<keyof U, keyof T>]: never };

export type FactoryAttrs<
  TTemplate extends ModelTemplate,
  TModelAttrs = Omit<InferModelAttrs<TTemplate>, 'id'>,
> = {
  [K in keyof TModelAttrs]:
    | TModelAttrs[K]
    | ((
        this: FactoryAttrs<TTemplate, TModelAttrs>,
        modelId: NonNullable<InferModelAttrs<TTemplate>['id']>,
      ) => TModelAttrs[K]);
};

export type FactoryAfterCreateHook<
  TSchema extends SchemaCollections = SchemaCollections,
  TTemplate extends ModelTemplate = ModelTemplate,
> = (model: ModelInstance<TTemplate, TSchema>, schema: SchemaInstance<TSchema>) => void;

export type TraitDefinition<
  TTemplate extends ModelTemplate = ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> = Partial<FactoryAttrs<TTemplate>> &
  Partial<FactoryAssociations<TTemplate, TSchema>> & {
    afterCreate?: FactoryAfterCreateHook<TSchema, TTemplate>;
  };

// TODO: Rename to FactoryTraits
export type ModelTraits<
  TTraits extends string = never,
  TTemplate extends ModelTemplate = ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
  TExpectedTraits extends Record<TTraits, TraitDefinition<TTemplate, TSchema>> = Record<
    TTraits,
    TraitDefinition<TTemplate, TSchema>
  >,
> = [TTraits] extends [never]
  ? Record<string, TraitDefinition<TTemplate, TSchema>>
  : Exact<{ [K in TTraits]: TraitDefinition<TTemplate, TSchema> }, TExpectedTraits>;

export type TraitName<TTraits> =
  TTraits extends Record<string, any> ? Extract<keyof TTraits, string> : never;

export type FactoryTraitNames<TFactory> = TFactory extends {
  traits: infer TTraits;
}
  ? TraitName<TTraits>
  : never;

/**
 * Helper type to work with factory attribute functions in the `this` context.
 * Extracts the function signature for a factory attribute.
 * @template TAttr - The factory attribute type (can be a value or function)
 * @template TModelId - The model ID type
 * @example
 * ```ts
 * const attrs: FactoryAttrs<UserModel> = {
 *   name: () => 'John',
 *   email: function(id: string) {
 *     // Type-safe access to this.name
 *     const getName = this.name as FactoryAttrFunc<typeof this.name, string>;
 *     const name = typeof getName === 'function' ? getName(id) : getName;
 *     return `${name}@example.com`;
 *   }
 * };
 * ```
 */
export type FactoryAttrFunc<TAttr, TModelId> = TAttr extends (
  this: any,
  modelId: TModelId,
) => infer R
  ? (this: any, modelId: TModelId) => R
  : TAttr;
