interface Timezone {
  value: string
  label: string
}

// Common IANA timezone identifiers with major cities
export const timezones: Timezone[] = [
  { value: 'America/Los_Angeles', label: 'Pacific Time - Los Angeles (UTC-08:00)' },
  { value: 'America/Denver', label: 'Mountain Time - Denver (UTC-07:00)' },
  { value: 'America/Chicago', label: 'Central Time - Chicago (UTC-06:00)' },
  { value: 'America/New_York', label: 'Eastern Time - New York (UTC-05:00)' },
  { value: 'America/Halifax', label: 'Atlantic Time - Halifax (UTC-04:00)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time - São Paulo (UTC-03:00)' },
  { value: 'Atlantic/Azores', label: 'Azores Time (UTC-01:00)' },
  { value: 'Europe/London', label: 'UK Time - London (UTC+00:00)' },
  { value: 'Europe/Paris', label: 'Central European - Paris (UTC+01:00)' },
  { value: 'Europe/Athens', label: 'Eastern European - Athens (UTC+02:00)' },
  { value: 'Europe/Moscow', label: 'Moscow Time (UTC+03:00)' },
  { value: 'Asia/Dubai', label: 'Gulf Time - Dubai (UTC+04:00)' },
  { value: 'Asia/Karachi', label: 'Pakistan Time - Karachi (UTC+05:00)' },
  { value: 'Asia/Kolkata', label: 'India Time - New Delhi (UTC+05:30)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Time - Dhaka (UTC+06:00)' },
  { value: 'Asia/Bangkok', label: 'Indochina Time - Bangkok (UTC+07:00)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'Japan Time - Tokyo (UTC+09:00)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern - Sydney (UTC+10:00)' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time - Auckland (UTC+12:00)' }
] 