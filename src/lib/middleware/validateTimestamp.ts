import { NextResponse } from 'next/server'
import { isTimestamp } from '@/types/timestamp'

/**
 * Validates that all fields ending in _at in the request body are valid timestamps
 */
export async function validateTimestamps(req: Request) {
  try {
    const body = req.body ? JSON.parse(await req.text()) : null
    if (!body) return null

    // Recursively check all fields ending in _at
    const invalidFields = findInvalidTimestamps(body)
    
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid timestamp format', 
          fields: invalidFields 
        },
        { status: 400 }
      )
    }

    // Reconstruct the request with the validated body
    const newRequest = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(body)
    })

    return newRequest
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

function findInvalidTimestamps(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return []

  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key

    if (key.endsWith('_at')) {
      return typeof value === 'string' && isTimestamp(value) ? [] : [path]
    }

    if (Array.isArray(value)) {
      return value.flatMap((item, index) => 
        findInvalidTimestamps(item, `${path}[${index}]`)
      )
    }

    if (typeof value === 'object' && value !== null) {
      return findInvalidTimestamps(value, path)
    }

    return []
  })
} 