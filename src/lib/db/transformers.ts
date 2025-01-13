import { createTimestamp } from '@/types/timestamp'

/**
 * Recursively transforms all Date objects in a database result to Timestamps
 */
export function transformDatabaseTimestamps<T>(obj: T): T {
  if (!obj) return obj

  if (obj instanceof Date) {
    return createTimestamp(obj) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformDatabaseTimestamps(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const transformed = { ...obj }
    for (const key in transformed) {
      transformed[key] = transformDatabaseTimestamps(transformed[key])
    }
    return transformed
  }

  return obj
} 