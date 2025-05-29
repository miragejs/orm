import type { AllowedIdTypes } from '@src/db';

import type { ModelAttrs } from './BaseModel';
import { createModelInstance, type ModelInstance } from './BaseModel';

/**
 * Model class that provides static methods for model management
 */
export default class Model {
  /**
   * Creates a new model instance with attribute getters/setters
   * @param options - Options for creating the model
   * @param options.name - The name of the model
   * @param options.attrs - The default attributes for the model
   * @returns A new model instance with attribute getters/setters
   * @example
   * const user = Model.create({
   *   name: 'User',
   *   attrs: { name: '', email: '' },
   * });
   */
  static create<TAttrs extends ModelAttrs<AllowedIdTypes>>(options: {
    name: string;
    attrs: TAttrs;
  }): ModelInstance<TAttrs> & TAttrs {
    return createModelInstance<TAttrs>(options);
  }
}
