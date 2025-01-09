/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import type { ReactElement } from 'react'
import React from 'react'

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock

// Mock the next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; [key: string]: any }): ReactElement => {
    const { src, alt, ...rest } = props
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...rest, src, alt })
  },
}))

// Mock ProfileEditModal
jest.mock('@/components/profile/ProfileEditModal', () => {
  return {
    __esModule: true,
    ProfileEditModal: function MockProfileEditModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): ReactElement | null {
      return isOpen ? React.createElement('div', { 'data-testid': 'profile-edit-modal' },
        React.createElement('button', { onClick: onClose }, 'Close')
      ) : null
    }
  }
})

// Mock ProfileModal
jest.mock('@/components/profile/ProfileModal', () => {
  return {
    __esModule: true,
    ProfileModal: function MockProfileModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }): ReactElement | null {
      return isOpen ? React.createElement('div', { 'data-testid': 'profile-modal' },
        React.createElement('button', { onClick: onClose }, 'Close')
      ) : null
    }
  }
})

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
}) 