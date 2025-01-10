import { Timestamp, isTimestamp, createTimestamp } from '@/types/timestamp'
import { z } from 'zod'

export function validateTimestamp(value: unknown): boolean {
  if (!value) return true
  return typeof value === 'string' && isTimestamp(value)
}

export function validateTimestamps(data: unknown): { success: boolean; errors: Record<string, string> } {
  const timestampSchema = z.string().refine(isTimestamp, {
    message: 'Invalid timestamp format'
  })

  const validateField = (value: unknown): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === 'object') {
      return Object.values(value).every(validateField)
    }
    return typeof value !== 'string' || timestampSchema.safeParse(value).success
  }

  const errors: Record<string, string> = {}
  let success = true

  const traverse = (obj: any, path: string[] = []) => {
    if (!obj || typeof obj !== 'object') return
    
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = [...path, key]
      
      if (typeof value === 'string' && !validateField(value)) {
        success = false
        errors[currentPath.join('.')] = 'Invalid timestamp format'
      } else if (typeof value === 'object') {
        traverse(value, currentPath)
      }
    })
  }

  traverse(data)
  return { success, errors }
}

export function recoverTimestamp(value: unknown): Timestamp | null {
  if (!value) return null
  if (typeof value !== 'string') return null

  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return null
    return createTimestamp(date)
  } catch {
    return null
  }
} 