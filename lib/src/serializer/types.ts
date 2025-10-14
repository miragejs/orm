import type { InferModelAttrs, ModelTemplate } from '@src/model';

/**
 * Global serializer configuration (schema-level)
 * Only contains structural options that apply to all collections
 */
export interface GlobalSerializerConfig {
  /**
   * Whether to wrap the serialized data in a root key
   * - false: no wrapping (default)
   * - true: wrap with modelName/collectionName
   * - string: wrap with custom key name
   */
  root?: boolean | string;

  /**
   * Whether to embed related models in the serialized output
   * - false: exclude relationships (default)
   * - true: include embedded relationships
   */
  embed?: boolean;
}

/**
 * Collection-specific serializer configuration
 * Extends global config with model-specific options
 * @template TTemplate - The model template
 */
export interface SerializerConfig<TTemplate extends ModelTemplate> extends GlobalSerializerConfig {
  /**
   * Specific attributes to include in serialization
   * If not provided, all attributes are included
   * Note: This is model-specific and not available at schema level
   */
  attrs?: (keyof InferModelAttrs<TTemplate>)[];

  /**
   * Relationship names to include in serialization
   * Note: This is model-specific and not available at schema level
   */
  include?: string[];
}
