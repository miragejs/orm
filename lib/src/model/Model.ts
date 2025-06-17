import type { AllowedIdTypes } from '@src/db';

import AttributeAccessorsMixin from './AttributeAccessorsMixin';
import BaseModel, { type ModelAttrs, type ModelClass, type ModelOptions } from './BaseModel';

/**
 * Model class that provides static methods for model management
 */
export default class Model {
  /**
   * Creates a new model class with attribute accessors, or extends an existing model class
   * @param ModelClass - The model class to enhance with attribute accessors. If not provided, a base model class will be used.
   * @returns An enhanced model class that can be instantiated with 'new'
   */
  static define<TAttrs extends ModelAttrs<AllowedIdTypes>>(
    ModelClass: new (options: ModelOptions<TAttrs>) => BaseModel<TAttrs> = BaseModel<TAttrs>,
  ): ModelClass<TAttrs> {
    return AttributeAccessorsMixin(ModelClass);
  }
}
