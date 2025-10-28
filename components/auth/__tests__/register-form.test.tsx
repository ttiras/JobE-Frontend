/**
 * Register Form Component Unit Tests
 * 
 * Tests for the registration form component including:
 * - Form rendering and field validation
 * - Password strength indicator
 * - Password confirmation matching
 * - Email validation
 * - Form submission
 * - Error handling
 * - Email verification notice
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { RegisterForm } from '../register-form'
import * as authUtils from '@/lib/nhost/auth'

// Mock the auth utilities
jest.mock('@/lib/nhost/auth')

// Mock messages for internationalization
const messages = {
  auth: {
    register: {
      title: 'Create your account',
      email: 'Email address',
      password: 'Password',
      confirmPassword: 'Confirm password',
      displayName: 'Full name',
      submit: 'Create account',
      hasAccount: 'Already have an account?',
      signIn: 'Sign in',
      success: 'Account created successfully! Please check your email to verify.',
      error: 'Failed to create account. Please try again.',
    },
    fields: {
      emailPlaceholder: 'you@example.com',
      passwordPlaceholder: '••••••••',
      displayNamePlaceholder: 'John Doe',
    },
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordMismatch: 'Passwords do not match',
      displayNameRequired: 'Full name is required',
    },
    errors: {
      emailAlreadyInUse: 'This email is already registered',
      weakPassword: 'Password must be at least 8 characters long',
    },
  },
}

describe('RegisterForm', () => {
  const mockRegister = jest.fn()
  const mockOnSuccess = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(authUtils.register as jest.Mock) = mockRegister
  })

  const renderRegisterForm = (props = {}) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RegisterForm
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          {...props}
        />
      </NextIntlClientProvider>
    )
  }

  describe('Rendering', () => {
    it('should render all form fields', () => {
      renderRegisterForm()

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should render sign in link', () => {
      renderRegisterForm()

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })

    it('should render email verification notice', () => {
      renderRegisterForm()

      expect(screen.getByText(/check your email|verify|verification/i)).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when display name is empty', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when email is empty', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      await user.type(displayNameInput, 'John Doe')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid email format', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      await user.type(displayNameInput, 'John Doe')

      const emailInput = screen.getByLabelText(/^email address/i)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('should show error when password is too short', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)

      await user.type(displayNameInput, 'John Doe')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'short')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should show error when passwords do not match', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(displayNameInput, 'John Doe')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password456')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })
  })

  describe('Password Strength Indicator', () => {
    it('should show weak password indicator for short passwords', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'pass')

      await waitFor(() => {
        expect(screen.getByText(/weak|strength.*weak/i)).toBeInTheDocument()
      })
    })

    it('should show medium password indicator for adequate passwords', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'password123')

      await waitFor(() => {
        expect(screen.getByText(/medium|fair|strength.*medium/i)).toBeInTheDocument()
      })
    })

    it('should show strong password indicator for complex passwords', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'Password123!@#')

      await waitFor(() => {
        expect(screen.getByText(/strong|strength.*strong/i)).toBeInTheDocument()
      })
    })

    it('should update strength indicator in real-time', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const passwordInput = screen.getByLabelText(/^password$/i)
      
      // Start with weak
      await user.type(passwordInput, 'pass')
      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument()
      })

      // Type more to make it medium
      await user.type(passwordInput, 'word123')
      await waitFor(() => {
        expect(screen.getByText(/medium|fair/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call register with correct data', async () => {
      mockRegister.mockResolvedValueOnce({ 
        user: { id: '1', email: 'test@example.com', displayName: 'John Doe' } 
      })
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(displayNameInput, 'John Doe')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'John Doe'
        )
      })
    })

    it('should call onSuccess callback on successful registration', async () => {
      const mockSession = { 
        user: { id: '1', email: 'test@example.com', displayName: 'John Doe' } 
      }
      mockRegister.mockResolvedValueOnce(mockSession)
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(displayNameInput, 'John Doe')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockSession)
      })
    })

    it('should show loading state during submission', async () => {
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(displayNameInput, 'John Doe')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/creating|loading/i)).toBeInTheDocument()
    })

    it('should disable form during submission', async () => {
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(displayNameInput, 'John Doe')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(displayNameInput).toBeDisabled()
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(confirmPasswordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when email is already in use', async () => {
  const error = new Error('Email already in use')
  const typed = error as Error & { type?: string }
  typed.type = 'email-already-in-use'
      mockRegister.mockRejectedValueOnce(error)
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(displayNameInput, 'John Doe')
      await user.type(emailInput, 'existing@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email.*already.*registered/i)).toBeInTheDocument()
      })
    })

    it('should call onError callback on registration failure', async () => {
      const error = new Error('Registration failed')
      mockRegister.mockRejectedValueOnce(error)
      renderRegisterForm()
      const user = userEvent.setup()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(displayNameInput, 'John Doe')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(error)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      renderRegisterForm()

      const displayNameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/^email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(displayNameInput).toHaveAttribute('type', 'text')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })

    it('should link errors to inputs with aria-describedby', async () => {
      renderRegisterForm()
      const user = userEvent.setup()

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        const displayNameInput = screen.getByLabelText(/full name/i)
        expect(displayNameInput).toHaveAttribute('aria-invalid', 'true')
        expect(displayNameInput).toHaveAttribute('aria-describedby')
      })
    })
  })
})
