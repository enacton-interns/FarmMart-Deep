/**
 * Format a date consistently for both server and client
 * @param date - Date to format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date with month name for better readability
 * @param date - Date to format
 * @returns Formatted date string like "24 September 2025"
 */
export function formatDateLong(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
