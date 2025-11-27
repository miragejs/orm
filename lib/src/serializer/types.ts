import type { ModelAttrsFor, ModelTemplate } from '@src/model';

/**
 * Structural serializer options (schema-level or collection-level)
 * Controls how the response is formatted/structured
 */
export interface StructuralSerializerOptions {
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
 * Data selection serializer options (collection-level only)
 * Controls what data to include in serialization
 * @template TTemplate - The model template
 */
export interface DataSerializerOptions<TTemplate extends ModelTemplate> {
  /**
   * Specific attributes to include in serialization
   * If not provided, all attributes are included
   * Note: This is model-specific and not available at schema level
   */
  attrs?: (keyof ModelAttrsFor<TTemplate>)[];

  /**
   * Relationship names to include in serialization
   * Note: This is model-specific and not available at schema level
   */
  include?: string[];
}

/**
 * Complete serializer options (collection-level)
 * Combines structural and data selection options
 * @template TTemplate - The model template
 */
export interface SerializerOptions<TTemplate extends ModelTemplate>
  extends StructuralSerializerOptions,
    DataSerializerOptions<TTemplate> {}

/**
 * @deprecated Use StructuralSerializerOptions instead
 */
export type GlobalSerializerConfig = StructuralSerializerOptions;

/**
 * @deprecated Use SerializerOptions instead
 */
export type SerializerConfig<TTemplate extends ModelTemplate> = SerializerOptions<TTemplate>;
