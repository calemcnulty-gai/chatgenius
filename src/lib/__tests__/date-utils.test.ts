import { formatMessageDate, formatMessageTimestamp, formatRelativeTime } from '../utils'
import { Timestamp, createTimestamp } from '@/types/timestamp'

describe('date formatting utilities', () => {
  // Mock current date to 2024-01-15 15:30:00
  const mockDate = new Date('2024-01-15T15:30:00Z')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('formatRelativeTime', () => {
    it('formats future dates', () => {
      const future = createTimestamp(new Date('2024-01-15T16:30:00Z'))
      expect(formatRelativeTime(future)).toBe('in about 1 hour')
    })

    it('formats past dates', () => {
      const past = createTimestamp(new Date('2024-01-15T14:30:00Z'))
      expect(formatRelativeTime(past)).toBe('about 1 hour ago')
    })
  })

  describe('formatMessageDate', () => {
    it('handles null or undefined input', () => {
      expect(formatMessageDate(null)).toBe('')
      expect(formatMessageDate(undefined)).toBe('')
    })

    it('formats time for same day', () => {
      const sameDay = createTimestamp(new Date('2024-01-15T14:30:00Z'))
      expect(formatMessageDate(sameDay)).toMatch(/\d{1,2}:\d{2}/)
    })

    it('formats weekday for this week', () => {
      const thisWeek = createTimestamp(new Date('2024-01-14T14:30:00Z'))
      expect(formatMessageDate(thisWeek)).toBe('Sunday')
    })

    it('formats month and day for this year', () => {
      const thisYear = createTimestamp(new Date('2024-01-01T14:30:00Z'))
      expect(formatMessageDate(thisYear)).toBe('Jan 1')
    })

    it('formats full date for different year', () => {
      const differentYear = createTimestamp(new Date('2023-12-31T14:30:00Z'))
      expect(formatMessageDate(differentYear)).toBe('Dec 31, 2023')
    })
  })

  describe('formatMessageTimestamp', () => {
    it('handles null or undefined input', () => {
      expect(formatMessageTimestamp(null)).toBe('')
      expect(formatMessageTimestamp(undefined)).toBe('')
    })

    it('formats time for today', () => {
      const today = createTimestamp(new Date('2024-01-15T14:30:00Z'))
      expect(formatMessageTimestamp(today)).toMatch(/\d{1,2}:\d{2}/)
    })

    it('formats time for yesterday', () => {
      const yesterday = createTimestamp(new Date('2024-01-14T14:30:00Z'))
      expect(formatMessageTimestamp(yesterday)).toMatch(/Yesterday at \d{1,2}:\d{2}/)
    })

    it('formats weekday for this week', () => {
      const thisWeek = createTimestamp(new Date('2024-01-10T14:30:00Z'))
      expect(formatMessageTimestamp(thisWeek)).toMatch(/Wednesday at \d{1,2}:\d{2}/)
    })

    it('formats full date for older messages', () => {
      const older = createTimestamp(new Date('2023-12-31T14:30:00Z'))
      expect(formatMessageTimestamp(older)).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })
  })
}) 