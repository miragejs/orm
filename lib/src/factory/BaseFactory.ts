import type { ModelAttrs, ModelInstance } from '@src/model';
import { MirageError } from '@src/utils';

/**
 * Base factory that builds model attributes.
 */
export default class BaseFactory<TAttrs extends ModelAttrs> {
  constructor(
    public readonly attributes: FactoryAttrs<TAttrs>,
    public readonly traits: Record<string, TraitDefinition<TAttrs>> = {},
    public readonly afterCreate?: (model: ModelInstance<TAttrs>) => void,
  ) {}

  /**
   * Build a model with the given model ID and trait names or default values.
   * @param modelId - The model ID.
   * @param traitNamesOrDefaults - The names of the traits to apply to the model or default values for attributes.
   * @returns The built model.
   */
  build(
    modelId: NonNullable<TAttrs['id']>,
    ...traitNamesOrDefaults: (string | Partial<TAttrs>)[]
  ): {
    attrs: TAttrs;
    traitNames: string[];
  } {
    const traitNames: string[] = [];
    const defaults: Partial<TAttrs> = {};

    // Separate trait names from default values
    traitNamesOrDefaults.forEach((arg) => {
      if (typeof arg === 'string') {
        traitNames.push(arg);
      } else {
        Object.assign(defaults, arg);
      }
    });

    const processedAttributes = this.processAttributes(this.attributes, modelId);
    const traitAttributes = this.buildWithTraits(traitNames, modelId);

    // Merge attributes in order: defaults override traits, traits override base attributes
    return {
      attrs: this.mergeAttributes(this.mergeAttributes(processedAttributes, traitAttributes), {
        ...defaults,
        id: modelId,
      }),
      traitNames,
    };
  }

  /**
   * Process the afterCreate hook and the trait hooks.
   * @param model - The model to process.
   * @param traitNames - The names of the traits to apply to the model.
   * @returns The processed model.
   */
  processAfterCreate(
    model: ModelInstance<TAttrs>,
    traitNames: string[] = [],
  ): ModelInstance<TAttrs> {
    const hooks: ((model: ModelInstance<TAttrs>) => void)[] = [];

    if (this.afterCreate) {
      hooks.push(this.afterCreate);
    }

    traitNames.forEach(
      (name) => {
        const trait = this.traits[name];
        if (trait?.afterCreate) {
          hooks.push(trait.afterCreate);
        }
      },
      [] as ((model: ModelInstance<TAttrs>) => void)[],
    );

    hooks.forEach((hook) => {
      hook(model);
      console.log('ModelAttrs', model.attrs);
    });

    console.log(hooks);

    return model;
  }

  private processAttributes(
    attrs: FactoryAttrs<TAttrs>,
    modelId: NonNullable<TAttrs['id']>,
  ): Partial<TAttrs> {
    const keys = this.sortAttrs(attrs, modelId);

    return keys.reduce((acc, key) => {
      const value = attrs[key];

      if (typeof value === 'function') {
        acc[key] = value.call(attrs, modelId);
      } else {
        acc[key] = value as TAttrs[keyof TAttrs];
      }

      return acc;
    }, {} as Partial<TAttrs>);
  }

  private buildWithTraits(
    traitNames: string[],
    modelId: NonNullable<TAttrs['id']>,
  ): Partial<TAttrs> {
    return traitNames.reduce((traitAttributes, name) => {
      const trait = this.traits[name];

      if (trait) {
        const { afterCreate, ...extension } = trait;

        Object.entries(extension).forEach(([key, value]) => {
          traitAttributes[key as keyof TAttrs] =
            typeof value === 'function' ? value.call(this.attributes, modelId) : value;
        });
      }

      return traitAttributes;
    }, {} as Partial<TAttrs>);
  }

  private mergeAttributes(
    baseAttributes: Partial<TAttrs>,
    overrideAttributes: Partial<TAttrs>,
  ): TAttrs {
    return {
      ...baseAttributes,
      ...overrideAttributes,
    } as TAttrs;
  }

  private sortAttrs(
    attrs: FactoryAttrs<TAttrs>,
    modelId: NonNullable<TAttrs['id']>,
  ): (keyof TAttrs)[] {
    const visited = new Set<string>();
    const processing = new Set<string>();

    const detectCycle = (key: string): boolean => {
      if (processing.has(key)) {
        throw new MirageError(`Circular dependency detected: ${key}`);
      }
      if (visited.has(key)) {
        return false;
      }

      processing.add(key);
      const value = attrs[key as keyof TAttrs];

      if (typeof value === 'function') {
        // Create a proxy to track property access
        const proxy = new Proxy(attrs, {
          get(target, prop) {
            if (typeof prop === 'string' && prop in target) {
              detectCycle(prop);
            }
            return target[prop as keyof typeof target];
          },
        });

        // Call the function with the proxy as this context
        (value as Function).call(proxy, modelId);
      }

      processing.delete(key);
      visited.add(key);
      return false;
    };

    // Check each attribute for cycles
    Object.keys(attrs).forEach(detectCycle);

    // Return keys in their original order
    return Object.keys(attrs) as (keyof TAttrs)[];
  }
}

// -- Types --

type DependencyRef = [string, string] | [string];

export type FactoryAttrs<TAttrs extends ModelAttrs> = {
  [K in keyof TAttrs]:
    | TAttrs[K]
    | ((this: Record<keyof TAttrs, any>, modelId: NonNullable<TAttrs['id']>) => TAttrs[K]);
};

export type TraitDefinition<TAttrs extends ModelAttrs> = Partial<FactoryAttrs<TAttrs>> & {
  afterCreate?: (model: ModelInstance<TAttrs>) => void;
};

export type FactoryDefinition<TAttrs extends ModelAttrs> = {
  attributes: FactoryAttrs<TAttrs>;
  traits?: Record<string, TraitDefinition<TAttrs>>;
  afterCreate?: (model: TAttrs) => void;
};
