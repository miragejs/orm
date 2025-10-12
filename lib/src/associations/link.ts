import type { InferModelAttrs, ModelTemplate } from '@src/model';
import type { SchemaCollections } from '@src/schema';

import type {
  AssociationQuery,
  AssociationTraitsAndDefaults,
  LinkAssociation,
  TypedAssociationTraitsAndDefaults,
} from './types';

/**
 * Try to find existing model, else create one (with schema type for trait validation)
 * @template TSchema - The schema collections type
 * @template TModel - The model template (inferred from model parameter)
 * @param model - Model template to use
 * @param query - Optional query to filter models (attributes object or predicate function)
 * @param traitsAndDefaults - Traits and/or defaults to apply when creating (variadic) - trait names are validated against schema
 * @returns The link association
 */
export default function link<TSchema extends SchemaCollections, TModel extends ModelTemplate>(
  model: TModel,
  query?: AssociationQuery<InferModelAttrs<TModel>>,
  ...traitsAndDefaults: TypedAssociationTraitsAndDefaults<TSchema, TModel>
): LinkAssociation<TModel>;

/**
 * Try to find existing model, else create one (without schema type - traits not validated)
 * @template TModel - The model template (inferred from model parameter)
 * @param model - Model template to use
 * @param query - Optional query to filter models (attributes object or predicate function)
 * @param traitsAndDefaults - Traits and/or defaults to apply when creating (variadic) - trait names are strings
 * @returns The link association
 */
export default function link<TModel extends ModelTemplate>(
  model: TModel,
  query?: AssociationQuery<InferModelAttrs<TModel>>,
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): LinkAssociation<TModel>;

/**
 * Implementation
 * @param model - Model template
 * @param query - Optional query
 * @param traitsAndDefaults - Traits and defaults
 * @returns Link association
 */
export default function link(
  model: ModelTemplate,
  query?: AssociationQuery,
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): LinkAssociation<ModelTemplate> {
  return {
    type: 'link',
    model,
    query,
    traitsAndDefaults:
      traitsAndDefaults.length > 0
        ? (traitsAndDefaults as AssociationTraitsAndDefaults)
        : undefined,
  };
}
