/**
 * General utility functions used throughout the application
 */

/**
 * Format minutes into hours and minutes string
 * @param minutes - Total minutes to format
 * @returns Formatted string like "2h 15m"
 */
export function formatRuntime(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Unknown';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h ${mins}m`;
}

/**
 * Format a date string into various formats
 * @param dateString - ISO date string
 * @param format - Format type (full, year, short)
 * @returns Formatted date string
 */
export function formatDate(dateString?: string, format: 'full' | 'year' | 'short' = 'full'): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    switch (format) {
      case 'year':
        return date.getFullYear().toString();
      case 'short':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'full':
      default:
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown';
  }
}

/**
 * Truncate text to a specific length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate a random item from an array
 * @param array - Array to select from
 * @returns Random item from the array
 */
export function getRandomItem<T>(array: T[]): T | undefined {
  if (!array || array.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Debounce a function call
 * @param func - The function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Create a throttled function that only invokes the provided function at most once per specified interval
 * @param func - The function to throttle
 * @param limit - Limit time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Creates a properly formatted class name string from multiple class names
 * Similar to the classnames/clsx libraries
 * @param classes - Array of class names or objects with conditional classes
 * @returns Joined class name string
 */
export function classNames(...classes: (string | undefined | null | Record<string, boolean>)[]): string {
  return classes
    .filter(Boolean)
    .map(c => {
      if (typeof c === 'string') return c;
      if (c === null || c === undefined) return '';
      return Object.entries(c)
        .filter(([_, value]) => Boolean(value))
        .map(([key]) => key)
        .join(' ');
    })
    .join(' ');
} 