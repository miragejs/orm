import type { ModelTemplate } from '@src/model';
import type { SchemaCollections } from '@src/schema';

import type {
  AssociationTraitsAndDefaults,
  CreateManyAssociation,
  TypedAssociationTraitsAndDefaults,
} from './types';

/**
 * Always create N new related models and link them (with schema type for trait validation)
 * @template TSchema - The schema collections type
 * @template TModel - The model template (inferred from model parameter)
 * @param model - Model template to create
 * @param count - Number of models to create
 * @param traitsAndDefaults - Traits and/or defaults to apply (variadic) - trait names are validated against schema
 * @returns The create many association
 */
export default function createMany<TSchema extends SchemaCollections, TModel extends ModelTemplate>(
  model: TModel,
  count: number,
  ...traitsAndDefaults: TypedAssociationTraitsAndDefaults<TSchema, TModel>
): CreateManyAssociation<TModel>;

/**
 * Always create N new related models and link them (without schema type - traits not validated)
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
 * Implementation
 * @param model - Model template
 * @param count - Number of models
 * @param traitsAndDefaults - Traits and defaults
 * @returns Create many association
 */
export default function createMany(
  model: ModelTemplate,
  count: number,
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): CreateManyAssociation<ModelTemplate> {
  return {
    type: 'createMany',
    model,
    count,
    traitsAndDefaults:
      traitsAndDefaults.length > 0
        ? (traitsAndDefaults as AssociationTraitsAndDefaults)
        : undefined,
  };
}
