import type { InferModelAttrs, ModelTemplate } from '@src/model';
import type { SchemaCollections } from '@src/schema';

import type {
  AssociationQuery,
  AssociationTraitsAndDefaults,
  LinkManyAssociation,
  TypedAssociationTraitsAndDefaults,
} from './types';

/**
 * Try to find N existing models, else create more as needed (with schema type for trait validation)
 * @template TSchema - The schema collections type
 * @template TModel - The model template (inferred from model parameter)
 * @param model - Model template to use
 * @param count - Number of models needed
 * @param query - Optional query to filter models (attributes object or predicate function)
 * @param traitsAndDefaults - Traits and/or defaults to apply when creating (variadic) - trait names are validated against schema
 * @returns The link many association
 */
export default function linkMany<TSchema extends SchemaCollections, TModel extends ModelTemplate>(
  model: TModel,
  count: number,
  query?: AssociationQuery<InferModelAttrs<TModel>>,
  ...traitsAndDefaults: TypedAssociationTraitsAndDefaults<TSchema, TModel>
): LinkManyAssociation<TModel>;

/**
 * Try to find N existing models, else create more as needed (without schema type - traits not validated)
 * @template TModel - The model template (inferred from model parameter)
 * @param model - Model template to use
 * @param count - Number of models needed
 * @param query - Optional query to filter models (attributes object or predicate function)
 * @param traitsAndDefaults - Traits and/or defaults to apply when creating (variadic) - trait names are strings
 * @returns The link many association
 */
export default function linkMany<TModel extends ModelTemplate>(
  model: TModel,
  count: number,
  query?: AssociationQuery<InferModelAttrs<TModel>>,
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): LinkManyAssociation<TModel>;

/**
 * Implementation
 * @param model - Model template
 * @param count - Number of models
 * @param query - Optional query
 * @param traitsAndDefaults - Traits and defaults
 * @returns Link many association
 */
export default function linkMany(
  model: ModelTemplate,
  count: number,
  query?: AssociationQuery,
  ...traitsAndDefaults: AssociationTraitsAndDefaults
): LinkManyAssociation<ModelTemplate> {
  return {
    type: 'linkMany',
    model,
    count,
    query,
    traitsAndDefaults:
      traitsAndDefaults.length > 0
        ? (traitsAndDefaults as AssociationTraitsAndDefaults)
        : undefined,
  };
}
