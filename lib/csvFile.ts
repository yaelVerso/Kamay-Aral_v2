/** The importers only parse CSV text, so anything else gets rejected up front with a clear message. */
export function isCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.csv')
}
