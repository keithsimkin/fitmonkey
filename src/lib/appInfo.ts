/** Static app metadata surfaced on the Settings "About" section. */
export const APP_VERSION = '1.0.0';

/** Where the exercise catalog & animations originate (shown as attribution). */
export const DATA_SOURCE = 'free-exercise-db (public domain)';

/** Human-readable byte size, e.g. 12_900_000 → "12.3 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  // Whole numbers for KB and for values ≥ 10; one decimal otherwise.
  const decimals = i === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[i]}`;
}
