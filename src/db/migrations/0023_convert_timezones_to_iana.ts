import { sql } from 'drizzle-orm'
import { db } from '..'

// Map of UTC offsets to common IANA timezone identifiers
const UTC_TO_IANA_MAP = {
  'UTC-12:00': 'Pacific/Wake',
  'UTC-11:00': 'Pacific/Midway',
  'UTC-10:00': 'Pacific/Honolulu',
  'UTC-09:00': 'America/Anchorage',
  'UTC-08:00': 'America/Los_Angeles',
  'UTC-07:00': 'America/Denver',
  'UTC-06:00': 'America/Chicago',
  'UTC-05:00': 'America/New_York',
  'UTC-04:00': 'America/Halifax',
  'UTC-03:00': 'America/Sao_Paulo',
  'UTC-02:00': 'America/Noronha',
  'UTC-01:00': 'Atlantic/Azores',
  'UTC+00:00': 'Europe/London',
  'UTC+01:00': 'Europe/Paris',
  'UTC+02:00': 'Europe/Athens',
  'UTC+03:00': 'Europe/Moscow',
  'UTC+04:00': 'Asia/Dubai',
  'UTC+05:00': 'Asia/Karachi',
  'UTC+05:30': 'Asia/Kolkata',
  'UTC+06:00': 'Asia/Dhaka',
  'UTC+07:00': 'Asia/Bangkok',
  'UTC+08:00': 'Asia/Singapore',
  'UTC+09:00': 'Asia/Tokyo',
  'UTC+10:00': 'Australia/Sydney',
  'UTC+11:00': 'Pacific/Guadalcanal',
  'UTC+12:00': 'Pacific/Auckland'
}

export async function convertTimezonesToIANA() {
  // For each UTC offset in our map
  for (const [utc, iana] of Object.entries(UTC_TO_IANA_MAP)) {
    await db.execute(sql`
      UPDATE users 
      SET time_zone = ${iana}
      WHERE time_zone = ${utc};
    `)
  }

  // Set any remaining non-IANA timezones to UTC
  await db.execute(sql`
    UPDATE users 
    SET time_zone = 'UTC'
    WHERE time_zone LIKE 'UTC%' OR time_zone IS NULL;
  `)
} 