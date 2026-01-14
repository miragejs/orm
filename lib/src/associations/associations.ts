import create from './create';
import createMany from './createMany';
import link from './link';
import linkMany from './linkMany';

/**
 * Associations object with helper functions for factory associations:
 * - create: Always create one new related model
 * - createMany: Always create N new related models
 * - link: Try to find existing model, else create one
 * - linkMany: Try to find N existing models, else create more as needed
 */
const associations = {
  create,
  createMany,
  link,
  linkMany,
} as const;

export default associations;
