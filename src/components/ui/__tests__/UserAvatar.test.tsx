import { render, screen, fireEvent } from '@testing-library/react'
import { UserAvatar } from '../UserAvatar'
import { User } from '@/types/user'
import { useAuth } from '@clerk/nextjs'
import { useUser } from '@/contexts/UserContext'

// Mock Clerk's useAuth hook
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn()
}))

// Mock UserContext
jest.mock('@/contexts/UserContext', () => ({
  useUser: jest.fn()
}))

const mockUser: User = {
  id: '1',
  clerkId: 'clerk_123',
  name: 'John Doe',
  email: 'john@example.com',
  profileImage: 'https://example.com/avatar.jpg',
  displayName: 'Johnny',
  title: 'Developer',
  timeZone: 'UTC',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

describe('UserAvatar', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Default mock implementations
    ;(useAuth as jest.Mock).mockReturnValue({ userId: 'different_clerk_id' })
    ;(useUser as jest.Mock).mockReturnValue({ user: mockUser, isLoading: false })
  })

  it('renders with profile image', () => {
    render(<UserAvatar user={mockUser} />)
    const img = screen.getByAltText("Johnny's profile")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('renders initials when no profile image', () => {
    const userWithoutImage = { ...mockUser, profileImage: null }
    render(<UserAvatar user={userWithoutImage} />)
    const initials = screen.getByText('J')
    expect(initials).toBeInTheDocument()
  })

  it('renders initials when image fails to load', () => {
    render(<UserAvatar user={mockUser} />)
    const img = screen.getByAltText("Johnny's profile")
    fireEvent.error(img)
    const initials = screen.getByText('J')
    expect(initials).toBeInTheDocument()
  })

  it('applies different size classes', () => {
    const { rerender } = render(<UserAvatar user={mockUser} size="sm" />)
    const container = screen.getByTestId('avatar-container')
    expect(container).toHaveClass('w-8', 'h-8')

    rerender(<UserAvatar user={mockUser} size="lg" />)
    expect(container).toHaveClass('w-12', 'h-12')
  })

  it('shows loading state', () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: mockUser, isLoading: true })
    render(<UserAvatar user={mockUser} />)
    const loadingElement = screen.getByTestId('avatar-loading')
    expect(loadingElement).toBeInTheDocument()
    expect(loadingElement).toHaveClass('animate-pulse')
  })

  it('calls onClick handler when provided', () => {
    const handleClick = jest.fn()
    render(<UserAvatar user={mockUser} onClick={handleClick} />)
    fireEvent.click(screen.getByRole('img'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('opens ProfileEditModal for current user', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ userId: 'clerk_123' })
    render(<UserAvatar user={mockUser} />)
    fireEvent.click(screen.getByRole('img'))
    expect(screen.getByTestId('profile-edit-modal')).toBeInTheDocument()
  })

  it('opens ProfileModal for other users', () => {
    render(<UserAvatar user={mockUser} />)
    fireEvent.click(screen.getByRole('img'))
    expect(screen.getByTestId('profile-modal')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<UserAvatar user={mockUser} className="custom-class" />)
    const container = screen.getByTestId('avatar-container')
    expect(container).toHaveClass('custom-class')
  })
}) 