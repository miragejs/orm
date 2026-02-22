/**
 * Helper function to resolve a factory attribute value.
 * Calls the function if it's a function, otherwise returns the value.
 * @param attr - The factory attribute (value or function)
 * @param modelId - The model ID to pass to the function
 * @returns The resolved value
 * @example
 * ```ts
 * const attrs: FactoryAttrs<UserModel> = {
 *   name: () => 'John',
 *   email: function(id: string) {
 *     const name = resolveFactoryAttr(this.name, id);
 *     return `${name}@example.com`;
 *   }
 * };
 * ```
 */
export function resolveFactoryAttr<T, TModelId>(
  attr: T | ((this: any, modelId: TModelId) => T),
  modelId: TModelId,
): T {
  return typeof attr === 'function'
    ? (attr as (modelId: TModelId) => T)(modelId)
    : attr;
}
