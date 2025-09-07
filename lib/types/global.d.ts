/**
 * Helper to merge multiple objects using intersection
 * Converts a union of objects into an intersection of objects
 * Example: { a: string } | { b: number } -> { a: string } & { b: number }
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;
