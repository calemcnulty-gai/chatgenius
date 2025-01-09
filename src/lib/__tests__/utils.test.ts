import { cn, generateSlug } from '../utils'

describe('generateSlug', () => {
  it('converts string to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(generateSlug('Hello! @World#')).toBe('hello-world')
  })

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug('!Hello World!')).toBe('hello-world')
  })

  it('handles multiple spaces and special characters', () => {
    expect(generateSlug('Hello   World!!!   Test')).toBe('hello-world-test')
  })

  it('returns empty string for invalid input', () => {
    expect(generateSlug('!@#$%')).toBe('')
  })
})

describe('cn (className utility)', () => {
  it('merges class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('handles conditional classes', () => {
    const condition = true
    expect(cn('class1', condition && 'class2')).toBe('class1 class2')
  })

  it('handles falsy values', () => {
    expect(cn('class1', false && 'class2', null, undefined)).toBe('class1')
  })

  it('handles Tailwind conflicts correctly', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4')
    expect(cn('text-gray-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles array of classes', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })
}) 