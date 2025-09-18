import belongsTo from './belongsTo';
import hasMany from './hasMany';

export { default as belongsTo } from './belongsTo';
export { default as hasMany } from './hasMany';
export type * from './types';

/**
 * Associations object with helper functions
 */
export const associations = {
  belongsTo,
  hasMany,
} as const;
