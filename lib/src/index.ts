// Identity Manager
export { StringIdentityManager, NumberIdentityManager, IdentityManager } from './id-manager';
export type { IdType, IdGenerator, IdentityManagerConfig } from './id-manager';

// Model
export { defineToken, defineModel } from './model';
export type {
  InferTokenCollectionName,
  InferTokenId,
  InferTokenModel,
  InferTokenModelName,
  ModelAttrs,
  ModelClass,
  ModelForeignKeys,
  ModelInstance,
  ModelRelationships,
  ModelToken,
  NewModelAttrs,
  NewModelInstance,
  PartialModelAttrs,
} from './model';

// Factory
export { createFactory, extendFactory } from './factory';
export type {
  Factory,
  FactoryAttrs,
  FactoryConfig,
  FactoryDefinition,
  ModelTraits,
  TraitName,
} from './factory';

// Schema
export { setupSchema, createCollection, composeCollections } from './schema';
export type {
  CollectionModule,
  SchemaCollectionConfig,
  SchemaConfig,
  SchemaInstance,
  SchemaCollections,
} from './schema';

// Relationships
export { belongsTo, hasMany, associations } from './associations';
export type { BelongsTo, HasMany, Relationships } from './associations';

// Database
export { createDatabase } from './db';
export type { DbInstance } from './db';

// Serializer
export { Serializer } from './serializer';
export type { SerializerConfig } from './serializer';
