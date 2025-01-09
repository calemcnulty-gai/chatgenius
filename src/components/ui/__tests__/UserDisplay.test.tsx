import { render, screen, fireEvent } from '@testing-library/react'
import { UserDisplay } from '../UserDisplay'
import { User } from '@/types/user'
import { useUser } from '@/contexts/UserContext'

// Mock the useUser hook
jest.mock('@/contexts/UserContext', () => ({
  useUser: jest.fn()
}))

const mockUserComplete: User = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  clerkId: "clerk-id",
  name: "Test User",
  email: "test@example.com",
  profileImage: "https://example.com/image.jpg",
  displayName: "Display Name",
  title: "Software Engineer",
  timeZone: "UTC",
  status: "active" as const,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01"
};

const mockUserMinimal: User = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  clerkId: "clerk-id-2",
  name: "Test User",
  email: "test2@example.com",
  profileImage: null,
  displayName: null,
  title: null,
  timeZone: null,
  status: "offline" as const,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01"
};

const renderUserDisplay = (ui: React.ReactElement, { isLoading = false } = {}) => {
  (useUser as jest.Mock).mockReturnValue({
    isLoading,
    user: mockUserComplete,
    error: null,
    updateUser: jest.fn(),
    refreshUser: jest.fn(),
    clearError: jest.fn()
  })
  
  return render(ui)
}

describe('UserDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading States', () => {
    it('shows text variant loading skeleton', () => {
      const { container } = renderUserDisplay(
        <UserDisplay user={mockUserComplete} variant="text" />,
        { isLoading: true }
      )
      
      const skeleton = container.querySelector('span.bg-gray-200')
      expect(skeleton).toHaveClass('animate-pulse', 'rounded', 'h-5', 'w-24')
    })

    it('shows text-with-status variant loading skeleton', () => {
      const { container } = renderUserDisplay(
        <UserDisplay user={mockUserComplete} variant="text-with-status" />,
        { isLoading: true }
      )
      
      const wrapper = container.querySelector('.flex.items-center.gap-2')
      expect(wrapper).toBeInTheDocument()
      
      const nameSkeleton = wrapper?.querySelector('.bg-gray-200.h-5')
      expect(nameSkeleton).toHaveClass('animate-pulse', 'rounded', 'w-24')
      
      const statusDot = wrapper?.querySelector('.rounded-full')
      expect(statusDot).toHaveClass('bg-gray-200', 'animate-pulse', 'h-2', 'w-2')
    })

    it('shows full variant loading skeleton', () => {
      const { container } = renderUserDisplay(
        <UserDisplay user={mockUserComplete} variant="full" />,
        { isLoading: true }
      )
      
      const wrapper = container.querySelector('.flex.items-center.gap-3')
      expect(wrapper).toBeInTheDocument()
      
      const avatarSkeleton = wrapper?.querySelector('.h-8.w-8')
      expect(avatarSkeleton).toHaveClass('bg-gray-200', 'animate-pulse', 'rounded-full')
      
      const nameAndTitleContainer = wrapper?.querySelector('.space-y-2')
      const [nameSkeleton, titleSkeleton] = Array.from(nameAndTitleContainer?.children || [])
      
      expect(nameSkeleton).toHaveClass('bg-gray-200', 'animate-pulse', 'rounded', 'h-5', 'w-24')
      expect(titleSkeleton).toHaveClass('bg-gray-200', 'animate-pulse', 'rounded', 'h-4', 'w-20')
      
      const statusDot = wrapper?.querySelector('.h-2.w-2.rounded-full')
      expect(statusDot).toHaveClass('bg-gray-200', 'animate-pulse')
    })

    it('respects showLoadingState prop when false', () => {
      renderUserDisplay(
        <UserDisplay user={mockUserComplete} variant="text" showLoadingState={false} />,
        { isLoading: true }
      )
      
      const content = screen.getByText(mockUserComplete.displayName!)
      expect(content).toBeInTheDocument()
    })
  })

  describe('Text Variant', () => {
    it('displays user displayName when available', () => {
      renderUserDisplay(
        <UserDisplay user={mockUserComplete} variant="text" />
      )
      
      const nameElement = screen.getByText('Display Name')
      expect(nameElement).toBeInTheDocument()
    })

    it('falls back to name when displayName is null', () => {
      renderUserDisplay(
        <UserDisplay user={mockUserMinimal} variant="text" />
      )
      
      const nameElement = screen.getByText('Test User')
      expect(nameElement).toBeInTheDocument()
    })

    it('applies custom className correctly', () => {
      renderUserDisplay(
        <UserDisplay 
          user={mockUserComplete} 
          variant="text" 
          className="custom-class"
        />
      )
      
      const nameElement = screen.getByText('Display Name')
      expect(nameElement).toHaveClass('custom-class')
    })

    it('combines multiple custom classNames correctly', () => {
      renderUserDisplay(
        <UserDisplay 
          user={mockUserComplete} 
          variant="text" 
          className="custom-class-1 custom-class-2"
        />
      )
      
      const nameElement = screen.getByText('Display Name')
      expect(nameElement).toHaveClass('custom-class-1', 'custom-class-2')
    })
  })

  describe('Text-with-Status Variant', () => {
    it('displays name with active status indicator', () => {
      const { container } = renderUserDisplay(
        <UserDisplay user={mockUserComplete} variant="text-with-status" />
      )
      
      const wrapper = container.querySelector('.flex.items-center.gap-2')
      expect(wrapper).toBeInTheDocument()
      
      const nameElement = screen.getByText('Display Name')
      expect(nameElement).toBeInTheDocument()
      
      const statusDot = wrapper?.querySelector('span:last-child')
      expect(statusDot).toHaveClass('bg-green-500')
    })

    it('displays name with offline status indicator', () => {
      const { container } = renderUserDisplay(
        <UserDisplay user={mockUserMinimal} variant="text-with-status" />
      )
      
      const wrapper = container.querySelector('.flex.items-center.gap-2')
      const nameElement = screen.getByText('Test User')
      expect(nameElement).toBeInTheDocument()
      
      const statusDot = wrapper?.querySelector('span:last-child')
      expect(statusDot).toHaveClass('bg-gray-500')
    })

    it('displays name with away status indicator', () => {
      const awayUser: User = {
        ...mockUserComplete,
        status: 'away' as const
      }
      
      const { container } = renderUserDisplay(
        <UserDisplay user={awayUser} variant="text-with-status" />
      )
      
      const wrapper = container.querySelector('.flex.items-center.gap-2')
      const statusDot = wrapper?.querySelector('span:last-child')
      expect(statusDot).toHaveClass('bg-gray-500')
    })

    it('applies custom className to container', () => {
      const { container } = renderUserDisplay(
        <UserDisplay 
          user={mockUserComplete} 
          variant="text-with-status" 
          className="custom-container"
        />
      )
      
      const wrapper = container.querySelector('.flex.items-center.gap-2')
      expect(wrapper).toHaveClass('custom-container')
    })
  })

  describe('Full Variant', () => {
    it('displays complete user info with profile image', () => {
      const { container } = renderUserDisplay(
        <UserDisplay user={mockUserComplete} variant="full" />
      )
      
      const wrapper = container.querySelector('.flex.items-center.gap-3')
      expect(wrapper).toBeInTheDocument()
      
      // Check profile image
      const image = screen.getByAltText('Display Name')
      expect(image).toHaveAttribute('src', mockUserComplete.profileImage!)
      expect(image).toHaveClass('h-8', 'w-8', 'rounded-full', 'object-cover')
      
      // Check name and title
      const name = screen.getByText('Display Name')
      expect(name).toHaveClass('font-medium', 'text-white')
      
      const title = screen.getByText('Software Engineer')
      expect(title).toHaveClass('text-sm', 'text-gray-400')
      
      // Check status indicator
      const statusDot = wrapper?.querySelector('.rounded-full:last-child')
      expect(statusDot).toHaveClass('bg-green-500')
    })

    it('displays fallback avatar when no profile image', () => {
      renderUserDisplay(
        <UserDisplay user={mockUserMinimal} variant="full" />
      )
      
      const fallbackAvatar = screen.getByText('T')
      expect(fallbackAvatar).toHaveClass(
        'flex',
        'h-8',
        'w-8',
        'items-center',
        'justify-center',
        'rounded-full',
        'bg-gray-700',
        'text-sm',
        'font-medium',
        'text-white'
      )
    })

    it('switches to fallback avatar on image error', () => {
      renderUserDisplay(
        <UserDisplay user={mockUserComplete} variant="full" />
      )
      
      const image = screen.getByAltText('Display Name')
      fireEvent.error(image)
      
      const fallbackAvatar = screen.getByText('D')
      expect(fallbackAvatar).toBeInTheDocument()
    })

    it('hides title when not available', () => {
      renderUserDisplay(
        <UserDisplay user={mockUserMinimal} variant="full" />
      )
      
      const name = screen.getByText('Test User')
      expect(name).toBeInTheDocument()
      
      const titleElements = screen.queryAllByText(/./i).filter(
        el => el.classList.contains('text-gray-400')
      )
      expect(titleElements).toHaveLength(0)
    })

    it('applies custom className to container', () => {
      const { container } = renderUserDisplay(
        <UserDisplay 
          user={mockUserComplete} 
          variant="full" 
          className="custom-container"
        />
      )
      
      const wrapper = container.querySelector('.flex.items-center.gap-3')
      expect(wrapper).toHaveClass('custom-container')
    })
  })
}) 