export function formatDateForInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}
