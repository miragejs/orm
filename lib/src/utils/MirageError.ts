export class MirageError extends Error {
  constructor(message: string) {
    super(`[Mirage]: ${message}`);
  }
}
