/**
 * Login Form Component Unit Tests
 * 
 * Tests for the login form component including:
 * - Form rendering and field validation
 * - User input handling
 * - Form submission
 * - Error handling
 * - Password visibility toggle
 * - Remember me functionality
 * - CAPTCHA integration after failed attempts
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { LoginForm } from '../login-form'
import * as authUtils from '@/lib/nhost/auth'

type ErrorWithType = Error & { type?: string }

// Mock the auth utilities
jest.mock('@/lib/nhost/auth')

// Mock messages for internationalization
const messages = {
  auth: {
    login: {
      title: 'Sign in to your account',
      email: 'Email address',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      submit: 'Sign in',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      success: 'Successfully signed in',
      error: 'Failed to sign in. Please check your credentials.',
    },
    fields: {
      emailPlaceholder: 'you@example.com',
      passwordPlaceholder: '••••••••',
    },
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
    },
    errors: {
      invalidCredentials: 'Invalid email or password',
      emailNotVerified: 'Please verify your email before signing in',
      rateLimitExceeded: 'Too many attempts. Please try again later.',
    },
  },
}

describe('LoginForm', () => {
  const mockLogin = jest.fn()
  const mockOnSuccess = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(authUtils.login as jest.Mock) = mockLogin
  })

  const renderLoginForm = (props = {}) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LoginForm
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          {...props}
        />
      </NextIntlClientProvider>
    )
  }

  describe('Rendering', () => {
    it('should render all form fields', () => {
      renderLoginForm()

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render remember me checkbox', () => {
      renderLoginForm()

      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument()
    })

    it('should render forgot password link', () => {
      renderLoginForm()

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    })

    it('should render sign up link', () => {
      renderLoginForm()

      expect(screen.getByText(/sign up/i)).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when email is empty', async () => {
      renderLoginForm()
      const user = userEvent.setup()

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid email format', async () => {
      renderLoginForm()
      const user = userEvent.setup()

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('should show error when password is empty', async () => {
      renderLoginForm()
      const user = userEvent.setup()

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call login with correct credentials', async () => {
      mockLogin.mockResolvedValueOnce({ user: { id: '1', email: 'test@example.com' } })
      renderLoginForm()
      const user = userEvent.setup()

      const emailInput = screen.getByLabelText(/email address/i)
        const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('should call onSuccess callback on successful login', async () => {
      const mockSession = { user: { id: '1', email: 'test@example.com' } }
      mockLogin.mockResolvedValueOnce(mockSession)
      renderLoginForm()
      const user = userEvent.setup()

  const emailInput = screen.getByLabelText(/email address/i)
  const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockSession)
      })
    })

    it('should show loading state during submission', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      renderLoginForm()
      const user = userEvent.setup()

  const emailInput = screen.getByLabelText(/email address/i)
  const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/signing in|loading/i)).toBeInTheDocument()
    })

    it('should disable form during submission', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      renderLoginForm()
      const user = userEvent.setup()

  const emailInput = screen.getByLabelText(/email address/i)
  const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
  const error = new Error('Invalid credentials')
  ;(error as ErrorWithType).type = 'invalid-credentials'
      mockLogin.mockRejectedValueOnce(error)
      renderLoginForm()
      const user = userEvent.setup()

      const emailInput = screen.getByLabelText(/email address/i)
        const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })

    it('should call onError callback on login failure', async () => {
      const error = new Error('Invalid credentials')
      mockLogin.mockRejectedValueOnce(error)
      renderLoginForm()
      const user = userEvent.setup()

  const emailInput = screen.getByLabelText(/email address/i)
  const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(error)
      })
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      renderLoginForm()
      const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement

      // Initially password should be hidden
      expect(passwordInput.type).toBe('password')

      // Click toggle button
      const toggleButton = screen.getByRole('button', { name: /show password|toggle password visibility/i })
      await user.click(toggleButton)

      // Password should now be visible
      expect(passwordInput.type).toBe('text')

      // Click again to hide
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })
  })

  describe('Remember Me', () => {
    it('should handle remember me checkbox', async () => {
      renderLoginForm()
      const user = userEvent.setup()

      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i })

      // Initially unchecked
      expect(rememberMeCheckbox).not.toBeChecked()

      // Check the box
      await user.click(rememberMeCheckbox)
      expect(rememberMeCheckbox).toBeChecked()

      // Uncheck
      await user.click(rememberMeCheckbox)
      expect(rememberMeCheckbox).not.toBeChecked()
    })
  })

  describe('CAPTCHA Integration', () => {
    it('should show CAPTCHA after 3 failed login attempts', async () => {
  const error = new Error('Invalid credentials')
  ;(error as ErrorWithType).type = 'invalid-credentials'
      mockLogin.mockRejectedValue(error)
      
      renderLoginForm()
      const user = userEvent.setup()

  const emailInput = screen.getByLabelText(/email address/i)
  const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' })
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Attempt 1
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrong1')
      await user.click(submitButton)
      await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1))

      // Clear and attempt 2
      await user.clear(passwordInput)
      await user.type(passwordInput, 'wrong2')
      await user.click(submitButton)
      await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(2))

      // Clear and attempt 3
      await user.clear(passwordInput)
      await user.type(passwordInput, 'wrong3')
      await user.click(submitButton)
      await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(3))

      // CAPTCHA should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('recaptcha-container')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      renderLoginForm()

  const emailInput = screen.getByLabelText(/email address/i)
  const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' })

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should link errors to inputs with aria-describedby', async () => {
      renderLoginForm()
      const user = userEvent.setup()

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email address/i)
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveAttribute('aria-describedby')
      })
    })
  })
})
