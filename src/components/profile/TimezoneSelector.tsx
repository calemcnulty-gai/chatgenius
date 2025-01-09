import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

interface TimezoneSelectorProps {
  value: string
  onChange: (value: string) => void
}

// Common time zones - we can expand this list as needed
const TIME_ZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland'
]

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
    >
      {TIME_ZONES.map((timeZone) => (
        <option
          key={timeZone}
          value={timeZone}
        >
          {timeZone}
        </option>
      ))}
    </select>
  )
} 