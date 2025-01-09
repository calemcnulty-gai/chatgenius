import { formatDistanceToNow } from 'date-fns'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessageDate(dateString: string | null | undefined) {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return ''
    }
    const now = new Date()
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
    
    // This week
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    if (date > weekAgo) {
      return date.toLocaleDateString([], { weekday: 'long' })
    }
    
    // This year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
    
    // Different year
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
  } catch (error) {
    return ''
  }
}

export function formatMessageTimestamp(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const now = new Date()
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })

    // Check if it's today
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return timeFormatter.format(date)
    }

    // Check if it's yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return `Yesterday at ${timeFormatter.format(date)}`
    }

    // Check if it's within the last week
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    if (date >= oneWeekAgo) {
      return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${timeFormatter.format(date)}`
    }

    // Otherwise, return the date
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (error) {
    return ''
  }
} 