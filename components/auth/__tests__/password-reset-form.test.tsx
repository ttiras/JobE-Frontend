/**
 * Password Reset Form Component Unit Tests
 * 
 * Tests for password reset form component including:
 * - Email request form (step 1)
 * - New password form (step 2)
 * - Form validation
 * - Success/error handling
 * - Loading states
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { PasswordResetForm } from '../password-reset-form'
import * as authUtils from '@/lib/nhost/auth'

// Mock the auth utilities
jest.mock('@/lib/nhost/auth')

// Mock messages for internationalization
const messages = {
  auth: {
    resetPassword: {
      title: 'Reset your password',
      emailStep: {
        title: 'Enter your email',
        description: 'We will send you a link to reset your password',
        email: 'Email address',
        submit: 'Send reset link',
        success: 'Reset link sent! Check your email.',
      },
      passwordStep: {
        title: 'Set new password',
        description: 'Enter your new password',
        newPassword: 'New password',
        confirmPassword: 'Confirm password',
        submit: 'Reset password',
        success: 'Password reset successfully! You can now log in.',
      },
      backToLogin: 'Back to login',
    },
    fields: {
      emailPlaceholder: 'you@example.com',
      passwordPlaceholder: '••••••••',
    },
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordMismatch: 'Passwords do not match',
    },
    errors: {
      userNotFound: 'No account found with this email',
      invalidToken: 'Invalid or expired reset link',
      weakPassword: 'Password must be at least 8 characters long',
    },
  },
}

describe('PasswordResetForm', () => {
  const mockSendPasswordResetEmail = jest.fn()
  const mockResetPassword = jest.fn()
  const mockOnSuccess = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(authUtils.sendPasswordResetEmail as jest.Mock) = mockSendPasswordResetEmail
    ;(authUtils.resetPassword as jest.Mock) = mockResetPassword
  })

  const renderPasswordResetForm = (props = {}) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PasswordResetForm
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          {...props}
        />
      </NextIntlClientProvider>
    )
  }

  describe('Email Request Step', () => {
    describe('Rendering', () => {
      it('should render email input form', () => {
        renderPasswordResetForm()

        expect(screen.getByText(/enter your email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
      })

      it('should render back to login link', () => {
        renderPasswordResetForm()

        expect(screen.getByText(/back to login/i)).toBeInTheDocument()
      })

      it('should render description text', () => {
        renderPasswordResetForm()

        expect(screen.getByText(/we will send you a link/i)).toBeInTheDocument()
      })
    })

    describe('Validation', () => {
      it('should show error when email is empty', async () => {
        renderPasswordResetForm()
        const user = userEvent.setup()

        const submitButton = screen.getByRole('button', { name: /send reset link/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        })
      })

      it('should show error for invalid email format', async () => {
        renderPasswordResetForm()
        const user = userEvent.setup()

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, 'invalid-email')

        const submitButton = screen.getByRole('button', { name: /send reset link/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
        })
      })
    })

    describe('Form Submission', () => {
      it('should call sendPasswordResetEmail with correct email', async () => {
        mockSendPasswordResetEmail.mockResolvedValueOnce({ success: true })
        renderPasswordResetForm()
        const user = userEvent.setup()

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, 'test@example.com')

        const submitButton = screen.getByRole('button', { name: /send reset link/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(mockSendPasswordResetEmail).toHaveBeenCalledWith('test@example.com')
        })
      })

      it('should show success message after sending reset link', async () => {
        mockSendPasswordResetEmail.mockResolvedValueOnce({ success: true })
        renderPasswordResetForm()
        const user = userEvent.setup()

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, 'test@example.com')

        const submitButton = screen.getByRole('button', { name: /send reset link/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/reset link sent|check your email/i)).toBeInTheDocument()
        })
      })

      it('should show loading state during submission', async () => {
        mockSendPasswordResetEmail.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        renderPasswordResetForm()
        const user = userEvent.setup()

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, 'test@example.com')

        const submitButton = screen.getByRole('button', { name: /send reset link/i })
        await user.click(submitButton)

        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/sending/i)).toBeInTheDocument()
      })

      it('should disable form during submission', async () => {
        mockSendPasswordResetEmail.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        renderPasswordResetForm()
        const user = userEvent.setup()

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, 'test@example.com')

        const submitButton = screen.getByRole('button', { name: /send reset link/i })
        await user.click(submitButton)

        expect(emailInput).toBeDisabled()
        expect(submitButton).toBeDisabled()
      })
    })

    describe('Error Handling', () => {
      it('should display error when user not found', async () => {
        const error = new Error('User not found')
        ;(error as any).type = 'user-not-found'
        mockSendPasswordResetEmail.mockRejectedValueOnce(error)
        renderPasswordResetForm()
        const user = userEvent.setup()

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, 'nonexistent@example.com')

        const submitButton = screen.getByRole('button', { name: /send reset link/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/no account found/i)).toBeInTheDocument()
        })
      })

      it('should call onError callback on failure', async () => {
        const error = new Error('Network error')
        mockSendPasswordResetEmail.mockRejectedValueOnce(error)
        renderPasswordResetForm()
        const user = userEvent.setup()

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, 'test@example.com')

        const submitButton = screen.getByRole('button', { name: /send reset link/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(mockOnError).toHaveBeenCalledWith(error)
        })
      })
    })
  })

  describe('New Password Step', () => {
    const renderWithResetToken = () => {
      return render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <PasswordResetForm
            resetToken="mock-reset-token"
            onSuccess={mockOnSuccess}
            onError={mockOnError}
          />
        </NextIntlClientProvider>
      )
    }

    describe('Rendering', () => {
      it('should render new password form when token is provided', () => {
        renderWithResetToken()

        expect(screen.getByText(/set new password/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
      })

      it('should render description text', () => {
        renderWithResetToken()

        expect(screen.getByText(/enter your new password/i)).toBeInTheDocument()
      })
    })

    describe('Validation', () => {
      it('should show error when password is empty', async () => {
        renderWithResetToken()
        const user = userEvent.setup()

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/password is required/i)).toBeInTheDocument()
        })
      })

      it('should show error when password is too short', async () => {
        renderWithResetToken()
        const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/new password/i)
        await user.type(passwordInput, 'short')

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
        })
      })

      it('should show error when passwords do not match', async () => {
        renderWithResetToken()
        const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/new password/i)
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, 'password123')
        await user.type(confirmPasswordInput, 'password456')

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
        })
      })
    })

    describe('Form Submission', () => {
      it('should call resetPassword with correct data', async () => {
        mockResetPassword.mockResolvedValueOnce({ success: true })
        renderWithResetToken()
        const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/new password/i)
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, 'newpassword123')
        await user.type(confirmPasswordInput, 'newpassword123')

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(mockResetPassword).toHaveBeenCalledWith('newpassword123')
        })
      })

      it('should call onSuccess callback after successful reset', async () => {
        mockResetPassword.mockResolvedValueOnce({ success: true })
        renderWithResetToken()
        const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/new password/i)
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, 'newpassword123')
        await user.type(confirmPasswordInput, 'newpassword123')

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalled()
        })
      })

      it('should show success message', async () => {
        mockResetPassword.mockResolvedValueOnce({ success: true })
        renderWithResetToken()
        const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/new password/i)
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, 'newpassword123')
        await user.type(confirmPasswordInput, 'newpassword123')

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument()
        })
      })

      it('should show loading state during submission', async () => {
        mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        renderWithResetToken()
        const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/new password/i)
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, 'newpassword123')
        await user.type(confirmPasswordInput, 'newpassword123')

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/resetting/i)).toBeInTheDocument()
      })
    })

    describe('Error Handling', () => {
      it('should display error for invalid token', async () => {
        const error = new Error('Invalid token')
        ;(error as any).type = 'invalid-token'
        mockResetPassword.mockRejectedValueOnce(error)
        renderWithResetToken()
        const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/new password/i)
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, 'newpassword123')
        await user.type(confirmPasswordInput, 'newpassword123')

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText(/invalid.*expired.*reset link/i)).toBeInTheDocument()
        })
      })

      it('should call onError callback on failure', async () => {
        const error = new Error('Reset failed')
        mockResetPassword.mockRejectedValueOnce(error)
        renderWithResetToken()
        const user = userEvent.setup()

        const passwordInput = screen.getByLabelText(/new password/i)
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, 'newpassword123')
        await user.type(confirmPasswordInput, 'newpassword123')

        const submitButton = screen.getByRole('button', { name: /reset password/i })
        await user.click(submitButton)

        await waitFor(() => {
          expect(mockOnError).toHaveBeenCalledWith(error)
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for email input', () => {
      renderPasswordResetForm()

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should have proper labels for password inputs', () => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <PasswordResetForm
            resetToken="mock-token"
            onSuccess={mockOnSuccess}
            onError={mockOnError}
          />
        </NextIntlClientProvider>
      )

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })

    it('should link errors to inputs with aria-describedby', async () => {
      renderPasswordResetForm()
      const user = userEvent.setup()

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email address/i)
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveAttribute('aria-describedby')
      })
    })
  })
})
