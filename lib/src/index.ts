/**
 * @module @miragejs/orm
 *
 * A TypeScript-first ORM for building in-memory databases with models,
 * relationships, factories, and serialization for testing and development.
 * @example Basic Usage
 * ```typescript
 * import { model, schema, collection } from '@miragejs/orm';
 *
 * // Define your models
 * const userModel = model('user', 'users')
 *   .attrs<{ name: string; email: string }>()
 *   .create();
 *
 * const postModel = model('post', 'posts')
 *   .attrs<{ title: string; content: string }>()
 *   .create();
 *
 * // Define your factories
 * const userFactory = factory()
 *   .model(userModel)
 *   .attrs({
 *     name: () => faker.person.fullName(),
 *     email: () => faker.internet.email(),
 *   })
 *   .traits({
 *     withPosts: {
 *       posts: associations.createMany(postModel, 2),
 *     },
 *   })
 *   .create();
 *
 * // Setup schema
 * const appSchema = schema()
 *   .collections({
 *     users: collection()
 *       .model(userModel)
 *       .relationships({
 *         posts: associations.hasMany(postModel),
 *       })
 *       .create(),
 *     posts: collection()
 *       .model(postModel)
 *       .relationships({
 *         author: associations.belongsTo(userModel, { foreignKey: 'authorId' }),
 *       })
 *       .create(),
 *   })
 *   .setup();
 *
 * // Use the schema
 * appSchema.users.create('withPosts');
 *
 * const user = appSchema.users.first();
 * const post = appSchema.posts.first();
 *
 * expect(user.posts).toHaveLength(2);
 * expect(post.author).toBe(user);
 * ```
 */

// ============================================================================
// PUBLIC API
// ============================================================================

// ----------------------------------------------------------------------------
// Identity Manager
// ----------------------------------------------------------------------------
export { IdentityManager } from './id-manager';
export type { IdentityManagerConfig, IdType, IdGenerator } from './id-manager';

// ----------------------------------------------------------------------------
// Model Builder
// ----------------------------------------------------------------------------
export { model } from './model';
export type {
  CollectionNameFor,
  ModelAttrsFor,
  ModelNameFor,
  SerializedCollectionFor,
  SerializedModelFor,
  ModelAttrs,
  ModelInstance,
  ModelTemplate,
  ModelUpdateAttrs,
  NewModelInstance,
  PartialModelAttrs,
  ModelCollection,
} from './model';

// ----------------------------------------------------------------------------
// Factory Builder
// ----------------------------------------------------------------------------
export { factory } from './factory';
export type {
  Factory,
  FactoryAfterCreateHook,
  FactoryAttrFunc,
  FactoryAttrs,
  ModelTraits,
  TraitDefinition,
} from './factory';

// ----------------------------------------------------------------------------
// Associations
// ----------------------------------------------------------------------------
export {
  associations,
  belongsTo,
  create,
  createMany,
  hasMany,
  link,
  linkMany,
} from './associations';
export type {
  // Relationship associations
  BelongsTo,
  HasMany,
  // Factory associations
  Association,
  CreateAssociation,
  CreateManyAssociation,
  LinkAssociation,
  LinkManyAssociation,
} from './associations';

// ----------------------------------------------------------------------------
// Database & Query API
// ----------------------------------------------------------------------------
export type { DbRecordInput, OrderBy, QueryOptions, Where } from './db';

// ----------------------------------------------------------------------------
// Schema Builder
// ----------------------------------------------------------------------------
export { collection, schema } from './schema';
export type {
  Collection,
  CollectionConfig,
  CollectionCreateAttrs,
  FixtureAttrs,
  FixtureConfig,
  FixtureLoadStrategy,
  SchemaCollections,
  SchemaInstance,
  SeedFunction,
  Seeds,
  SeedScenarios,
} from './schema';

// ----------------------------------------------------------------------------
// Serializer
// ----------------------------------------------------------------------------
export { Serializer } from './serializer';
export type {
  DataSerializerOptions,
  SerializerOptions,
  StructuralSerializerOptions,
} from './serializer';

// ----------------------------------------------------------------------------
// Logger
// ----------------------------------------------------------------------------
export { Logger, LogLevel, resolveFactoryAttr } from './utils';
export type { LoggerConfig } from './utils';
