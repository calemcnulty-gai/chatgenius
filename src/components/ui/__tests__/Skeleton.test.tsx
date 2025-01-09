import { render, screen } from '@testing-library/react'
import { Skeleton } from '../Skeleton'

describe('Skeleton', () => {
  it('renders with default className', () => {
    render(<Skeleton />)
    const element = screen.getByTestId('skeleton')
    expect(element).toHaveClass('animate-pulse', 'rounded-md', 'bg-gray-200', 'dark:bg-gray-800')
  })

  it('renders with additional className', () => {
    render(<Skeleton className="w-20 h-20" />)
    const element = screen.getByTestId('skeleton')
    expect(element).toHaveClass('w-20', 'h-20')
    expect(element).toHaveClass('animate-pulse', 'rounded-md', 'bg-gray-200', 'dark:bg-gray-800')
  })
}) 