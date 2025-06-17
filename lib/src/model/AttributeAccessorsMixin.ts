import { AllowedIdTypes } from '@src/db';

import type { ModelAttrs } from './BaseModel';

/**
 * Mixin that adds attribute accessors to a model class
 * @param Base - The model class to extend
 * @template TAttrs - The type of the model's attributes
 * @template TBase - The model class to extend
 * @returns A new model class with the attribute accessors
 */
export default function AttributeAccessorsMixin<
  TAttrs extends ModelAttrs<AllowedIdTypes>,
  TBase extends new (...args: any[]) => any,
>(Base: TBase) {
  return class extends Base {
    public attrs!: TAttrs;

    constructor(...args: any[]) {
      super(...args);

      this.attrs = { ...args[0].attrs, id: args[0].attrs?.id ?? null } as TAttrs;
      this.initAttributeAccessors();
    }

    /**
     * Initialize attribute accessors for all attributes
     */
    public initAttributeAccessors(): void {
      // Remove old accessors
      for (const key in this.attrs) {
        if (key !== 'id' && Object.prototype.hasOwnProperty.call(this, key)) {
          delete this[key as keyof this];
        }
      }

      // Set up new accessors
      for (const key in this.attrs) {
        if (key !== 'id' && !Object.prototype.hasOwnProperty.call(this, key)) {
          Object.defineProperty(this, key, {
            get: () => {
              return this.attrs[key];
            },
            set: (value: TAttrs[keyof TAttrs]) => {
              this.attrs[key as keyof TAttrs] = value;
            },
            enumerable: true,
            configurable: true,
          });
        }
      }
    }
  };
}
