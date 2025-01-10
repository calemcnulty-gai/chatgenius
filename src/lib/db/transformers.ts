import { createTimestamp, type Timestamp } from '@/types/timestamp'

/**
 * Transforms database timestamp fields to our Timestamp type
 */
export function transformDatabaseTimestamps<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row

  const transformed = { ...row }

  for (const [key, value] of Object.entries(row)) {
    if (key.endsWith('_at')) {
      if (value instanceof Date) {
        (transformed as any)[key] = createTimestamp(value) as Timestamp
      } else if (value === null) {
        (transformed as any)[key] = null
      } else if (typeof value === 'string') {
        // If it's already a string, ensure it's in the correct format
        (transformed as any)[key] = createTimestamp(new Date(value)) as Timestamp
      }
    } else if (Array.isArray(value)) {
      (transformed as any)[key] = value.map(item => 
        typeof item === 'object' ? transformDatabaseTimestamps(item) : item
      )
    } else if (value && typeof value === 'object') {
      (transformed as any)[key] = transformDatabaseTimestamps(value)
    }
  }

  return transformed
}

/**
 * Transforms input timestamps to Date objects for database storage
 */
export function prepareDatabaseTimestamps<T extends Record<string, any>>(input: T): T {
  if (!input || typeof input !== 'object') return input

  const prepared = { ...input }

  for (const [key, value] of Object.entries(input)) {
    if (key.endsWith('_at')) {
      if (typeof value === 'string') {
        (prepared as any)[key] = new Date(value)
      }
    } else if (Array.isArray(value)) {
      (prepared as any)[key] = value.map(item => 
        typeof item === 'object' ? prepareDatabaseTimestamps(item) : item
      )
    } else if (value && typeof value === 'object') {
      (prepared as any)[key] = prepareDatabaseTimestamps(value)
    }
  }

  return prepared
} 