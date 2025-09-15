// Identity Manager
export { StringIdentityManager, NumberIdentityManager, IdentityManager } from './id-manager';
export type { IdType, IdGenerator, IdentityManagerConfig } from './id-manager';

// Model
export { defineModelClass, ModelBuilder, model } from './model';
export type {
  InferTemplateCollectionName,
  InferTemplateId,
  InferTemplateModel,
  InferTemplateModelName,
  ModelAttrs,
  ModelClass,
  ModelForeignKeys,
  ModelInstance,
  ModelRelationships,
  ModelTemplate,
  NewModelAttrs,
  NewModelInstance,
  PartialModelAttrs,
} from './model';

// Factory
export { factory } from './factory';
export type { Factory, FactoryAttrs, ModelTraits, TraitName } from './factory';

// Schema
export { schema } from './schema';
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
