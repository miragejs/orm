import belongsTo from './belongsTo';
import hasMany from './hasMany';

/**
 * Relations object with helper functions for model relationship definitions:
 * - belongsTo: Define a belongs-to relationship (foreign key on this model)
 * - hasMany: Define a has-many relationship (foreign key array on this model)
 */
const relations = {
  belongsTo,
  hasMany,
} as const;

export default relations;
