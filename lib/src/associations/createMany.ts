import type { ModelTemplate } from '@src/model';
import type { SchemaCollections } from '@src/schema';

import type {
  AssociationTraitsAndDefaults,
  CreateManyAssociation,
  TypedAssociationTraitsAndDefaults,
} from './types';

/**
 * Always create N identical related models and link them (with schema type for trait validation)
 * @template TModel - The model template (inferred from model parameter)
 * @template TSchema - The schema collections type
 * @param model - Model template to create
 * @param count - Number of models to create
 * @param traitsAndDefaults - Traits and/or defaults to apply (variadic) - trait names are validated against schema
 * @returns The create many association
 */
export default function createMany<
  TModel extends ModelTemplate,
  TSchema extends SchemaCollections,
>(
  model: TModel,
  count: number,
  ...traitsAndDefaults: TypedAssociationTraitsAndDefaults<TSchema, TModel>
): CreateManyAssociation<TModel>;

/**
 * Always create N identical related models and link them (without schema type - traits not validated)
 * @template TModel - The model template (inferred from model parameter)
 * @param model - Model template to create
 * @param count - Number of models to create
 * @param traitsAndDefaults - Traits and/or defaults to apply (variadic) - trait names are strings
 * @returns The create many association
 */
export default function createMany<TModel extends ModelTemplate>(
  model: TModel,
  count: number,
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): CreateManyAssociation<TModel>;

/**
 * Create multiple different related models and link them (with schema type for trait validation)
 * @template TModel - The model template (inferred from model parameter)
 * @template TSchema - The schema collections type
 * @param model - Model template to create
 * @param models - Array of traits/defaults for each model - trait names are validated against schema
 * @returns The create many association
 */
export default function createMany<
  TModel extends ModelTemplate,
  TSchema extends SchemaCollections,
>(
  model: TModel,
  models: TypedAssociationTraitsAndDefaults<TSchema, TModel>[],
): CreateManyAssociation<TModel>;

/**
 * Create multiple different related models and link them (without schema type - traits not validated)
 * @template TModel - The model template (inferred from model parameter)
 * @param model - Model template to create
 * @param models - Array of traits/defaults for each model - trait names are strings
 * @returns The create many association
 */
export default function createMany<TModel extends ModelTemplate>(
  model: TModel,
  models: AssociationTraitsAndDefaults[],
): CreateManyAssociation<TModel>;

/**
 * Implementation
 * @param model - Model template
 * @param countOrModels - Number of models or array of model definitions
 * @param traitsAndDefaults - Traits and defaults (for count mode)
 * @returns Create many association
 */
export default function createMany(
  model: ModelTemplate,
  countOrModels: number | AssociationTraitsAndDefaults[],
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): CreateManyAssociation<ModelTemplate> {
  if (typeof countOrModels === 'number') {
    // Count mode: create N identical models
    return {
      type: 'createMany',
      model,
      count: countOrModels,
      traitsAndDefaults:
        traitsAndDefaults.length > 0
          ? (traitsAndDefaults as AssociationTraitsAndDefaults)
          : undefined,
    };
  } else {
    // Array mode: create different models
    return {
      type: 'createMany',
      model,
      models: countOrModels,
    };
  }
}
