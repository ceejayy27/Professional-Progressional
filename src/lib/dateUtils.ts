/**
 * Parses a date string in YYYY-MM-DD format as a local date (not UTC).
 * This prevents timezone issues where dates like "2025-12-28" would be
 * interpreted as UTC midnight and shift to the previous day in some timezones.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // month is 0-indexed in Date constructor
  return new Date(year, month - 1, day);
}

