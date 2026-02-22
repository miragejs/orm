/**
 * @module @miragejs/orm
 *
 * A TypeScript-first ORM for building in-memory databases with models,
 * relationships, factories, and serialization for testing and development.
 * @example Basic Usage
 * ```typescript
 * import { model, schema, collection, relations, associations } from '@miragejs/orm';
 *
 * // Define your models
 * const userModel = model('user', 'users')
 *   .attrs<{ name: string; email: string }>()
 *   .build();
 *
 * const postModel = model('post', 'posts')
 *   .attrs<{ title: string; content: string }>()
 *   .build();
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
 *   .build();
 *
 * // Setup schema
 * const appSchema = schema()
 *   .collections({
 *     users: collection()
 *       .model(userModel)
 *       .relationships({
 *         posts: relations.hasMany(postModel),
 *       })
 *       .build(),
 *     posts: collection()
 *       .model(postModel)
 *       .relationships({
 *         author: relations.belongsTo(userModel, { foreignKey: 'authorId' }),
 *       })
 *       .build(),
 *   })
 *   .build();
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
  ModelAttrs,
  ModelAttrsFor,
  ModelCollection,
  ModelCreateAttrs,
  ModelInstance,
  ModelNameFor,
  ModelTemplate,
  ModelUpdateAttrs,
  NewModelInstance,
  PartialModelAttrs,
  SerializedCollectionFor,
  SerializedModelFor,
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
// Relations (schema relationship definitions)
// ----------------------------------------------------------------------------
export { relations, belongsTo, hasMany } from './relations';
export type { BelongsTo, HasMany, Relationships } from './relations';

// ----------------------------------------------------------------------------
// Associations (factory management)
// ----------------------------------------------------------------------------
export {
  associations,
  create,
  createMany,
  link,
  linkMany,
} from './associations';
export type {
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
  FixtureAttrs,
  FixtureConfig,
  FixtureLoadStrategy,
  SchemaCollections,
  SchemaInstance,
  SeedFunction,
  SeedScenarios,
  Seeds,
} from './schema';
// ----------------------------------------------------------------------------
// Serializer
// ----------------------------------------------------------------------------
export { Serializer } from './serializer';
export type {
  DataSerializerOptions,
  SerializerConfig,
  StructuralSerializerOptions,
} from './serializer';

// ----------------------------------------------------------------------------
// Logger
// ----------------------------------------------------------------------------
export { Logger, LogLevel, resolveFactoryAttr } from './utils';
export type { LoggerConfig } from './utils';
