const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Dates are stored as UTC midnight, so read the UTC fields: local time could shift the month.
export function formatNewsDate(date: Date, monthOnly: boolean): string {
  const month = `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  return monthOnly ? month : `${date.getUTCDate()} ${month}`;
}
