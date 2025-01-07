'use client'

import { ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  isLoading?: boolean
}

export function Button({
  children,
  className,
  variant = 'primary',
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={twMerge(
        'rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50',
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500'
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500',
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
} 