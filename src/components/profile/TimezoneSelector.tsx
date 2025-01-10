import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { timezones } from '@/lib/timezones'

interface TimezoneSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
    >
      <option value="">Select a timezone</option>
      {timezones.map((timezone) => (
        <option
          key={timezone.value}
          value={timezone.value}
        >
          {timezone.label}
        </option>
      ))}
    </select>
  )
} 