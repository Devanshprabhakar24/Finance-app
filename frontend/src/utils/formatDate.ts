import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { DATE_FORMATS } from './constants';

/**
 * Format date for display
 */
export function formatDate(date: string | Date, formatStr: string = DATE_FORMATS.DISPLAY): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, DATE_FORMATS.DISPLAY_WITH_TIME);
}

/**
 * Format date for input fields (yyyy-MM-dd)
 */
export function formatInputDate(date: string | Date): string {
  return formatDate(date, DATE_FORMATS.INPUT);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Get current date in input format
 */
export function getCurrentDate(): string {
  return formatInputDate(new Date());
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}
