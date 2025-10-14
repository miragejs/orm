import belongsTo from './belongsTo';
import create from './create';
import createMany from './createMany';
import hasMany from './hasMany';
import link from './link';
import linkMany from './linkMany';

export { default as belongsTo } from './belongsTo';
export { default as hasMany } from './hasMany';
export { default as create } from './create';
export { default as createMany } from './createMany';
export { default as link } from './link';
export { default as linkMany } from './linkMany';
export type * from './types';

/**
 * Associations object with all helper functions:
 * - belongsTo, hasMany: for model relationship definitions
 * - create, createMany, link, linkMany: for factory associations
 */
export const associations = {
  belongsTo,
  hasMany,
  create,
  createMany,
  link,
  linkMany,
} as const;
