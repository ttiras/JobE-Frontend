/**
 * CAPTCHA Component Unit Tests
 * 
 * Tests for reCAPTCHA v3 integration component including:
 * - Token generation
 * - Error handling
 * - Loading states
 * - Script loading
 * - Token expiration
 */

import { render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Captcha } from '../captcha'

// Mock reCAPTCHA
const mockExecute = jest.fn()
const mockReady = jest.fn()

// Mock global grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

const messages = {
  auth: {
    captcha: {
      loading: 'Loading security check...',
      error: 'Security check failed. Please try again.',
      expired: 'Security check expired. Please try again.',
    },
  },
}

describe('Captcha', () => {
  const originalEnv = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  beforeAll(() => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-site-key'
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset grecaptcha
    delete (window as any).grecaptcha
    
    // Remove any existing reCAPTCHA scripts
    document.querySelectorAll('script[src*="recaptcha"]').forEach(script => script.remove())
  })

  const renderCaptcha = (props = {}) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Captcha action="login" onVerify={jest.fn()} {...props} />
      </NextIntlClientProvider>
    )
  }

  describe('Initialization', () => {
    it('should load reCAPTCHA script', () => {
      renderCaptcha()

      const script = document.querySelector('script[src*="recaptcha"]')
      expect(script).toBeInTheDocument()
      expect(script).toHaveAttribute('src', expect.stringContaining('google.com/recaptcha'))
    })

    it('should include site key in script URL', () => {
      renderCaptcha()

      const script = document.querySelector('script[src*="recaptcha"]')
      expect(script).toHaveAttribute('src', expect.stringContaining('test-site-key'))
    })

    it('should set script async and defer attributes', () => {
      renderCaptcha()

      const script = document.querySelector('script[src*="recaptcha"]')
      expect(script).toHaveAttribute('async')
      expect(script).toHaveAttribute('defer')
    })

    it('should show loading state initially', () => {
      renderCaptcha()

      expect(screen.getByText(/loading security check/i)).toBeInTheDocument()
    })
  })

  describe('Token Generation', () => {
    beforeEach(() => {
      // Mock grecaptcha.ready and execute
      window.grecaptcha = {
        ready: (callback) => callback(),
        execute: mockExecute,
      }
    })

    it('should call grecaptcha.execute with correct parameters', async () => {
      const mockToken = 'mock-captcha-token'
      mockExecute.mockResolvedValueOnce(mockToken)
      
      const onVerify = jest.fn()
      renderCaptcha({ action: 'login', onVerify })

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith('test-site-key', { action: 'login' })
      })
    })

    it('should call onVerify with token on success', async () => {
      const mockToken = 'mock-captcha-token'
      mockExecute.mockResolvedValueOnce(mockToken)
      
      const onVerify = jest.fn()
      renderCaptcha({ action: 'login', onVerify })

      await waitFor(() => {
        expect(onVerify).toHaveBeenCalledWith(mockToken)
      })
    })

    it('should use correct action for different forms', async () => {
      mockExecute.mockResolvedValueOnce('token')
      
      const { rerender } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <Captcha action="register" onVerify={jest.fn()} />
        </NextIntlClientProvider>
      )

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith('test-site-key', { action: 'register' })
      })
    })

    it('should hide loading state after successful token generation', async () => {
      mockExecute.mockResolvedValueOnce('mock-token')
      renderCaptcha()

      await waitFor(() => {
        expect(screen.queryByText(/loading security check/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      window.grecaptcha = {
        ready: (callback) => callback(),
        execute: mockExecute,
      }
    })

    it('should display error message when token generation fails', async () => {
      mockExecute.mockRejectedValueOnce(new Error('reCAPTCHA error'))
      
      const onError = jest.fn()
      renderCaptcha({ onError })

      await waitFor(() => {
        expect(screen.getByText(/security check failed/i)).toBeInTheDocument()
      })
    })

    it('should call onError callback when token generation fails', async () => {
      const error = new Error('reCAPTCHA error')
      mockExecute.mockRejectedValueOnce(error)
      
      const onError = jest.fn()
      renderCaptcha({ onError })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error)
      })
    })

    it('should handle missing grecaptcha object', async () => {
      delete (window as any).grecaptcha
      
      const onError = jest.fn()
      renderCaptcha({ onError })

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should handle script load failure', async () => {
      const onError = jest.fn()
      renderCaptcha({ onError })

      // Simulate script error
      const script = document.querySelector('script[src*="recaptcha"]')
      if (script) {
        const errorEvent = new Event('error')
        script.dispatchEvent(errorEvent)
      }

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe('Token Expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      window.grecaptcha = {
        ready: (callback) => callback(),
        execute: mockExecute,
      }
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should regenerate token after expiration time', async () => {
      mockExecute.mockResolvedValue('mock-token')
      
      const onVerify = jest.fn()
      renderCaptcha({ 
        action: 'login', 
        onVerify,
        expirationTime: 60000, // 1 minute
      })

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(1)
      })

      // Fast-forward time
      jest.advanceTimersByTime(60000)

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(2)
      })
    })

    it('should use default expiration time of 2 minutes', async () => {
      mockExecute.mockResolvedValue('mock-token')
      renderCaptcha()

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(1)
      })

      // Fast-forward 1 minute (should not regenerate)
      jest.advanceTimersByTime(60000)
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(1)
      })

      // Fast-forward another minute (should regenerate at 2 min mark)
      jest.advanceTimersByTime(60000)
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(2)
      })
    })

    it('should call onExpired callback when token expires', async () => {
      mockExecute.mockResolvedValue('mock-token')
      
      const onExpired = jest.fn()
      renderCaptcha({ 
        onExpired,
        expirationTime: 60000,
      })

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(1)
      })

      jest.advanceTimersByTime(60000)

      await waitFor(() => {
        expect(onExpired).toHaveBeenCalled()
      })
    })

    it('should clean up timer on unmount', async () => {
      mockExecute.mockResolvedValue('mock-token')
      
      const { unmount } = renderCaptcha({ expirationTime: 60000 })

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(1)
      })

      unmount()

      // Fast-forward time - should not call execute again
      jest.advanceTimersByTime(60000)
      
      // Wait a bit to ensure no additional calls
      jest.advanceTimersByTime(1000)
      
      expect(mockExecute).toHaveBeenCalledTimes(1)
    })
  })

  describe('Manual Refresh', () => {
    beforeEach(() => {
      window.grecaptcha = {
        ready: (callback) => callback(),
        execute: mockExecute,
      }
    })

    it('should provide refresh method via ref', async () => {
      mockExecute.mockResolvedValue('mock-token')
      
      const ref = { current: null as any }
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <Captcha 
            ref={ref}
            action="login" 
            onVerify={jest.fn()} 
          />
        </NextIntlClientProvider>
      )

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(1)
      })

      // Call refresh manually
      if (ref.current?.refresh) {
        ref.current.refresh()
      }

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Configuration', () => {
    it('should throw error if site key is not configured', () => {
      delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      
      // Should throw during render or show error
      const onError = jest.fn()
      renderCaptcha({ onError })

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/site key|not configured/i)
        })
      )
    })

    it('should accept custom badge position', () => {
      renderCaptcha({ badge: 'inline' })

      // Badge should be visible inline
      const badge = screen.queryByTestId('recaptcha-badge')
      if (badge) {
        expect(badge).toBeVisible()
      }
    })

    it('should hide badge by default', () => {
      renderCaptcha()

      // Badge should not be visible (or set to bottomright)
      const badge = screen.queryByTestId('recaptcha-badge')
      expect(badge).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should include reCAPTCHA branding notice', () => {
      renderCaptcha()

      expect(screen.getByText(/protected by recaptcha|google/i)).toBeInTheDocument()
      expect(screen.getByText(/privacy policy/i)).toBeInTheDocument()
      expect(screen.getByText(/terms of service/i)).toBeInTheDocument()
    })

    it('should have proper aria-label for loading state', () => {
      renderCaptcha()

      const loadingElement = screen.getByText(/loading security check/i)
      expect(loadingElement.closest('[aria-busy="true"]')).toBeInTheDocument()
    })

    it('should announce errors to screen readers', async () => {
      window.grecaptcha = {
        ready: (callback) => callback(),
        execute: mockExecute,
      }
      mockExecute.mockRejectedValueOnce(new Error('reCAPTCHA error'))
      
      renderCaptcha()

      await waitFor(() => {
        const errorElement = screen.getByText(/security check failed/i)
        expect(errorElement.closest('[role="alert"]')).toBeInTheDocument()
      })
    })
  })
})
