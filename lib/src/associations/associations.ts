import belongsTo from './belongsTo';
import create from './create';
import createMany from './createMany';
import hasMany from './hasMany';
import link from './link';
import linkMany from './linkMany';

/**
 * Associations object with all helper functions:
 * - belongsTo, hasMany: for model relationship definitions
 * - create, createMany, link, linkMany: for factory associations
 */
const associations = {
  belongsTo,
  hasMany,
  create,
  createMany,
  link,
  linkMany,
} as const;

export default associations;
