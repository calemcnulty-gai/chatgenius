/**
 * Represents a timestamp in ISO 8601 format with timezone information
 * Example: "2024-01-15T12:00:00.000Z"
 */
export type Timestamp = string & { readonly __timestamp: unique symbol }

/**
 * Type guard to check if a string is a valid timestamp
 */
export function isTimestamp(value: string): value is Timestamp {
  try {
    const date = new Date(value)
    return !isNaN(date.getTime()) && value.includes('T') && (value.endsWith('Z') || value.includes('+'))
  } catch {
    return false
  }
}

/**
 * Creates a new timestamp from a Date object
 */
export function createTimestamp(date: Date): Timestamp {
  return date.toISOString() as Timestamp
}

/**
 * Creates a new timestamp for the current time
 */
export function now(): Timestamp {
  return createTimestamp(new Date())
}

/**
 * Parses a timestamp into a Date object
 */
export function parseTimestamp(timestamp: Timestamp): Date {
  return new Date(timestamp)
} 