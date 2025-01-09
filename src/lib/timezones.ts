interface Timezone {
  value: string
  label: string
}

export const timezones: Timezone[] = [
  { value: 'UTC-12:00', label: '(UTC-12:00) International Date Line West' },
  { value: 'UTC-11:00', label: '(UTC-11:00) Coordinated Universal Time-11' },
  { value: 'UTC-10:00', label: '(UTC-10:00) Hawaii' },
  { value: 'UTC-09:00', label: '(UTC-09:00) Alaska' },
  { value: 'UTC-08:00', label: '(UTC-08:00) Pacific Time (US and Canada)' },
  { value: 'UTC-07:00', label: '(UTC-07:00) Mountain Time (US and Canada)' },
  { value: 'UTC-06:00', label: '(UTC-06:00) Central Time (US and Canada)' },
  { value: 'UTC-05:00', label: '(UTC-05:00) Eastern Time (US and Canada)' },
  { value: 'UTC-04:00', label: '(UTC-04:00) Atlantic Time (Canada)' },
  { value: 'UTC-03:00', label: '(UTC-03:00) Brasilia' },
  { value: 'UTC-02:00', label: '(UTC-02:00) Coordinated Universal Time-02' },
  { value: 'UTC-01:00', label: '(UTC-01:00) Azores' },
  { value: 'UTC+00:00', label: '(UTC+00:00) London, Dublin, Edinburgh' },
  { value: 'UTC+01:00', label: '(UTC+01:00) Berlin, Paris, Rome, Madrid' },
  { value: 'UTC+02:00', label: '(UTC+02:00) Athens, Istanbul, Helsinki' },
  { value: 'UTC+03:00', label: '(UTC+03:00) Moscow, St. Petersburg' },
  { value: 'UTC+04:00', label: '(UTC+04:00) Dubai, Abu Dhabi' },
  { value: 'UTC+05:00', label: '(UTC+05:00) Islamabad, Karachi' },
  { value: 'UTC+05:30', label: '(UTC+05:30) New Delhi, Mumbai' },
  { value: 'UTC+06:00', label: '(UTC+06:00) Dhaka' },
  { value: 'UTC+07:00', label: '(UTC+07:00) Bangkok, Jakarta' },
  { value: 'UTC+08:00', label: '(UTC+08:00) Beijing, Singapore' },
  { value: 'UTC+09:00', label: '(UTC+09:00) Tokyo, Seoul' },
  { value: 'UTC+10:00', label: '(UTC+10:00) Sydney, Melbourne' },
  { value: 'UTC+11:00', label: '(UTC+11:00) Vladivostok' },
  { value: 'UTC+12:00', label: '(UTC+12:00) Auckland, Wellington' }
] 