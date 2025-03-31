import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine Tailwind CSS classes with conditional logic using clsx and tailwind-merge
 * @param inputs Class values to be combined
 * @returns Single string of combined class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date into a readable string format
 * @param date Date to format (can be ISO string, Date object, or null)
 * @param options Intl.DateTimeFormatOptions for customizing output format
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "Invalid date";
  }
  
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param date Date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "Invalid date";
  }
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  const diffMonth = Math.round(diffDay / 30);
  
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay < 30) return `${diffDay} days ago`;
  if (diffMonth < 12) return `${diffMonth} months ago`;
  
  return `${Math.round(diffMonth / 12)} years ago`;
}

/**
 * Truncate text with ellipsis if it exceeds the specified length
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if necessary
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + "...";
}

/**
 * Create a comma-separated string from an array of items
 * @param items Array of items to join
 * @param maxItems Maximum number of items to include (rest will be "+X more")
 * @returns Formatted string of joined items
 */
export function formatList(items: string[], maxItems = 3): string {
  if (!items || !items.length) return "";
  
  if (items.length <= maxItems) {
    return items.join(", ");
  }
  
  const visibleItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  
  return `${visibleItems.join(", ")} +${remainingCount} more`;
}