export type Timestamp = string & { readonly __timestamp: unique symbol }

export function createTimestamp(date: Date): Timestamp {
  return date.toISOString() as Timestamp
} 