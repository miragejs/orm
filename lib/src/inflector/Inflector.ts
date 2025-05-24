import { pluralize, singularize } from "inflected";

/**
 * Inflector is a singleton class that provides methods for singularizing and pluralizing words.
 * It uses the inflected library to perform the transformations.
 * 
 * @example
 * const inflector = Inflector.instance;
 * const singular = inflector.singularize("books"); // "book"
 * const plural = inflector.pluralize("book"); // "books"
 * 
 * // Register a custom inflector 
 * inflector.register({
 *   singularize: (word) => word.replace(/s$/, ""),
 *   pluralize: (word) => word + "s"
 * });
 * 
 */
export default class Inflector {
  static #instance: Inflector;
  private singularizeFn: (word: string) => string;
  private pluralizeFn: (word: string) => string;

  private constructor() {
    this.singularizeFn = singularize;
    this.pluralizeFn = pluralize;
  }

  static get instance(): Inflector {
    if (!Inflector.#instance) {
      Inflector.#instance = new Inflector();
    }
    return Inflector.#instance;
  }

  register(inflector: {
    singularize: (word: string) => string;
    pluralize: (word: string) => string;
  }): void {
    this.singularizeFn = inflector.singularize;
    this.pluralizeFn = inflector.pluralize;
  }

  singularize(word: string): string {
    return this.singularizeFn(word);
  }

  pluralize(word: string): string {
    return this.pluralizeFn(word);
  }
}

