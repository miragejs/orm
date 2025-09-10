import TokenBuilder from './TokenBuilder';
import type { BaseModelAttrs, ModelSerialization } from './types';

/**
 * Creates a new TokenBuilder instance for building strongly-typed model tokens.
 *
 * This is the main entry point for creating model tokens in the ORM. The function
 * accepts model and collection names as string literals, which are preserved at the
 * type level for compile-time safety. The returned TokenBuilder can be further
 * configured with specific model attributes and serialization types before creating
 * the final token.
 * @template TModelName - The string literal type for the model name
 * @template TCollectionName - The string literal type for the collection name
 * @param modelName - The name identifier for the model (preserved as string literal type)
 * @param collectionName - The name identifier for the collection (preserved as string literal type)
 * @returns A TokenBuilder instance with default model attributes and serialization types
 * @example
 * ```typescript
 * // Basic token creation
 * const userToken = token('user', 'users').create();
 *
 * // Token with specific model attributes
 * interface UserAttrs { id: string; name: string; email: string; }
 * const typedUserToken = token('user', 'users')
 *   .attrs<UserAttrs>()
 *   .create();
 *
 * // Token with custom serialization
 * interface User { id: string; displayName: string; }
 * interface UserList { users: User[]; total: number; }
 * const serializedToken = token('user', 'users')
 *   .attrs<UserAttrs>()
 *   .serialization<User, UserList>()
 *   .create();
 *
 * ```
 * @see {@link TokenBuilder} for available configuration methods
 */
export default function token<TModelName extends string, TCollectionName extends string>(
  modelName: TModelName,
  collectionName: TCollectionName,
) {
  return new TokenBuilder<
    BaseModelAttrs<string>,
    ModelSerialization<BaseModelAttrs<string>>,
    TModelName,
    TCollectionName
  >(modelName, collectionName);
}
