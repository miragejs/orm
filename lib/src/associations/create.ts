import type { ModelTemplate } from '@src/model';
import type { SchemaCollections } from '@src/schema';

import type {
  AssociationTraitsAndDefaults,
  CreateAssociation,
  TypedAssociationTraitsAndDefaults,
} from './types';

/**
 * Always create one new related model and link it (with schema type for trait validation)
 * @template TModel - The model template (inferred from model parameter)
 * @template TSchema - The schema collections type
 * @param model - Model template to create
 * @param traitsAndDefaults - Traits and/or defaults to apply (variadic) - trait names are validated against schema
 * @returns The create association
 */
export default function create<
  TModel extends ModelTemplate,
  TSchema extends SchemaCollections,
>(
  model: TModel,
  ...traitsAndDefaults: TypedAssociationTraitsAndDefaults<TSchema, TModel>
): CreateAssociation<TModel>;

/**
 * Always create one new related model and link it (without schema type - traits not validated)
 * @template TModel - The model template (inferred from model parameter)
 * @param model - Model template to create
 * @param traitsAndDefaults - Traits and/or defaults to apply (variadic) - trait names are strings
 * @returns The create association
 */
export default function create<TModel extends ModelTemplate>(
  model: TModel,
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): CreateAssociation<TModel>;

/**
 * Implementation
 * @param model - Model template
 * @param traitsAndDefaults - Traits and defaults
 * @returns Create association
 */
export default function create(
  model: ModelTemplate,
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): CreateAssociation<ModelTemplate> {
  return {
    type: 'create',
    model,
    traitsAndDefaults:
      traitsAndDefaults.length > 0
        ? (traitsAndDefaults as AssociationTraitsAndDefaults)
        : undefined,
  };
}
