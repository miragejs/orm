import type {
  ModelAttrsFor,
  ModelRelationships,
  ModelTemplate,
  RelationshipsByTemplate,
} from '@src/model';
import type { SchemaCollections } from '@src/schema';

/**
 * Relations mode for serialization
 * - 'foreignKey': only foreign key IDs are included (no relationship data)
 * - 'embedded': relationships are nested within the model (foreign keys removed)
 * - 'sideLoaded': relationships are placed at the same level (requires root)
 * - 'embedded+foreignKey': relationships nested AND foreign keys kept
 * - 'sideLoaded+foreignKey': relationships side-loaded AND foreign keys kept (explicit)
 */
export type RelationsMode =
  | 'foreignKey'
  | 'embedded'
  | 'sideLoaded'
  | 'embedded+foreignKey'
  | 'sideLoaded+foreignKey';

// -- Select Option Types --

/**
 * Array format for select option - include only these attributes
 * @example select: ['id', 'name', 'email']
 */
export type SelectArray<T extends ModelTemplate> = (keyof ModelAttrsFor<T>)[];

/**
 * Object format for select option - include/exclude attributes
 * - All false values: include all except false keys
 * - All true or mixed: include only true keys
 * @example select: { password: false } // exclude password
 * @example select: { id: true, name: true } // include only id and name
 */
export type SelectObject<T extends ModelTemplate> = Partial<
  Record<keyof ModelAttrsFor<T>, boolean>
>;

/**
 * Select option - array or object format
 */
export type SelectOption<T extends ModelTemplate> = SelectArray<T> | SelectObject<T>;

// -- With Option Types --

/**
 * Nested serializer options for relationships (data-focused only)
 * - No root or relationsMode (always root=false, embedded inline)
 * - Only select and with (boolean only) are available
 * @template T - The model template
 */
export interface NestedSerializerOptions<T extends ModelTemplate = ModelTemplate> {
  /**
   * Attribute selection for the related model
   * Uses string[] for flexibility with nested relationships
   */
  select?: SelectOption<T> | string[] | Record<string, boolean>;
  /**
   * Nested relationships to include (boolean only at nested level)
   */
  with?: Record<string, boolean>;
  /**
   * Override the default relationsMode for this specific relation
   */
  mode?: RelationsMode;
}

/**
 * Value for a relationship in the with object
 * - boolean: include/exclude the relationship
 * - NestedSerializerOptions: customize how the relationship is serialized
 */
export type WithValue<T extends ModelTemplate = ModelTemplate> =
  | boolean
  | NestedSerializerOptions<T>;

/**
 * With option - array or object format for relationship inclusion
 * When TRelationships is provided, suggests available relationship names
 * @template TRelationships - The model relationships for IntelliSense suggestions
 * @example with: ['posts', 'comments'] // include posts and comments
 * @example with: { posts: true, comments: false } // include posts, exclude comments
 * @example with: { posts: { select: ['id', 'title'] } } // include posts with only id and title
 */
export type WithOption<TRelationships extends ModelRelationships = ModelRelationships> =
  | (keyof TRelationships)[]
  | Partial<Record<keyof TRelationships, WithValue<any>>>;

// -- Serializer Options --

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
   * Default mode for serializing relationships
   * - 'foreignKey': only foreign keys for relationships in with array (default)
   * - 'embedded': relationships are nested within the model (foreign keys removed)
   * - 'sideLoaded': relationships are placed at top level (requires root)
   * - 'embedded+foreignKey': relationships nested AND foreign keys kept
   * - 'sideLoaded+foreignKey': relationships side-loaded AND foreign keys kept
   */
  relationsMode?: RelationsMode;
}

/**
 * Data selection serializer options (collection-level only)
 * Controls what data to include in serialization
 * @template TTemplate - The model template
 * @template TSchema - The schema collections for relationship suggestions
 */
export interface DataSerializerOptions<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> {
  /**
   * Specific attributes to include/exclude in serialization
   * - Array: include only these attributes
   * - Object with all false: include all except false keys
   * - Object with true/mixed: include only true keys
   */
  select?: SelectOption<TTemplate>;

  /**
   * Relationships to include in serialization
   * - Array: include these relationships
   * - Object with boolean: include (true) or exclude (false) relationships
   * - Object with options: customize how relationships are serialized
   */
  with?: WithOption<RelationshipsByTemplate<TTemplate, TSchema>>;
}

/**
 * Complete serializer options (collection-level)
 * Combines structural and data selection options
 * @template TTemplate - The model template
 * @template TSchema - The schema collections for relationship suggestions
 */
export interface SerializerOptions<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> extends StructuralSerializerOptions,
    DataSerializerOptions<TTemplate, TSchema> {}

/**
 * @deprecated Use StructuralSerializerOptions instead
 */
export type GlobalSerializerConfig = StructuralSerializerOptions;

/**
 * @deprecated Use SerializerOptions instead
 */
export type SerializerConfig<
  TTemplate extends ModelTemplate,
  TSchema extends SchemaCollections = SchemaCollections,
> = SerializerOptions<TTemplate, TSchema>;
