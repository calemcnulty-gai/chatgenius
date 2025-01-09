import { formatMessageDate, formatMessageTimestamp, formatRelativeTime } from '../utils'

describe('date formatting utilities', () => {
  // Mock current date to 2024-01-15 15:30:00
  const mockDate = new Date('2024-01-15T15:30:00')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('formatRelativeTime', () => {
    it('formats future dates', () => {
      const future = new Date('2024-01-15T16:30:00') // 1 hour in future
      expect(formatRelativeTime(future)).toBe('in about 1 hour')
    })

    it('formats past dates', () => {
      const past = new Date('2024-01-15T14:30:00') // 1 hour ago
      expect(formatRelativeTime(past)).toBe('about 1 hour ago')
    })
  })

  describe('formatMessageDate', () => {
    it('handles null or undefined input', () => {
      expect(formatMessageDate(null)).toBe('')
      expect(formatMessageDate(undefined)).toBe('')
    })

    it('formats time for same day', () => {
      const sameDay = '2024-01-15T14:30:00'
      expect(formatMessageDate(sameDay)).toMatch(/\d{1,2}:\d{2}/)
    })

    it('formats weekday for this week', () => {
      const thisWeek = '2024-01-14T14:30:00' // Sunday
      expect(formatMessageDate(thisWeek)).toBe('Sunday')
    })

    it('formats month and day for this year', () => {
      const thisYear = '2024-01-01T14:30:00'
      expect(formatMessageDate(thisYear)).toBe('Jan 1')
    })

    it('formats full date for different year', () => {
      const differentYear = '2023-12-31T14:30:00'
      expect(formatMessageDate(differentYear)).toBe('Dec 31, 2023')
    })

    it('handles invalid date strings', () => {
      expect(formatMessageDate('invalid-date')).toBe('')
    })
  })

  describe('formatMessageTimestamp', () => {
    it('handles null or undefined input', () => {
      expect(formatMessageTimestamp(null)).toBe('')
      expect(formatMessageTimestamp(undefined)).toBe('')
    })

    it('formats time for today', () => {
      const today = '2024-01-15T14:30:00'
      expect(formatMessageTimestamp(today)).toMatch(/\d{1,2}:\d{2}/)
    })

    it('formats time for yesterday', () => {
      const yesterday = '2024-01-14T14:30:00'
      expect(formatMessageTimestamp(yesterday)).toMatch(/Yesterday at \d{1,2}:\d{2}/)
    })

    it('formats weekday for this week', () => {
      const thisWeek = '2024-01-10T14:30:00' // Wednesday
      expect(formatMessageTimestamp(thisWeek)).toMatch(/Wednesday at \d{1,2}:\d{2}/)
    })

    it('formats full date for older messages', () => {
      const older = '2023-12-31T14:30:00'
      expect(formatMessageTimestamp(older)).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })

    it('handles invalid date strings', () => {
      expect(formatMessageTimestamp('invalid-date')).toBe('')
    })
  })
}) 