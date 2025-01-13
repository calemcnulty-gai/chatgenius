import { customType } from 'drizzle-orm/pg-core';
import { Timestamp } from '@/types/timestamp';

export const timestampString = customType<{ data: Timestamp }>({
  dataType() {
    return 'timestamp with time zone';
  },
  fromDriver(value: unknown): Timestamp {
    if (typeof value !== 'string') throw new Error('Expected string timestamp from database');
    return value as Timestamp;
  },
  toDriver(value: Timestamp): string {
    return value;
  },
}); 