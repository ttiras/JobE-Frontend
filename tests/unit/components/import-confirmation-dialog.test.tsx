/**
 * Component Tests for ImportConfirmationDialog
 * 
 * Tests: T023 [US1]
 * Following TDD: Tests for confirmation modal with summary and actions
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ImportConfirmationDialog } from '@/components/import/import-confirmation-dialog';
import { ImportSummary } from '@/lib/types/import';

const messages = {
  import: {
    confirmation: {
      title: 'Confirm Import',
      summary: 'Review Summary',
      departments: 'Departments',
      positions: 'Positions',
      create: '{count} new',
      update: '{count} updates',
      total: '{count} total',
      warning: 'This operation will modify your organization structure. Please review carefully before proceeding.',
      confirm: 'Confirm Import',
      cancel: 'Cancel',
      loading: 'Importing...',
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('ImportConfirmationDialog Component', () => {
  const mockSummary: ImportSummary = {
    totalRows: 5,
    departments: {
      total: 3,
      creates: 2,
      updates: 1,
    },
    positions: {
      total: 2,
      creates: 1,
      updates: 1,
    },
  };

  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog Visibility', () => {
    it('should render dialog when isOpen is true', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Import')).toBeInTheDocument();
    });

    it('should not render dialog when isOpen is false', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={false}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should toggle visibility when isOpen changes', () => {
      const { rerender } = renderWithIntl(
        <ImportConfirmationDialog
          isOpen={false}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ImportConfirmationDialog
            isOpen={true}
            summary={mockSummary}
            onConfirm={mockOnConfirm}
            onCancel={mockOnCancel}
          />
        </NextIntlClientProvider>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Summary Statistics', () => {
    it('should display department statistics correctly', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Departments')).toBeInTheDocument();
      expect(screen.getByText('3 total')).toBeInTheDocument();
      expect(screen.getByText('2 new')).toBeInTheDocument();
      expect(screen.getByText('1 updates')).toBeInTheDocument();
    });

    it('should display position statistics correctly', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Positions')).toBeInTheDocument();
      expect(screen.getByText('2 total')).toBeInTheDocument();
      expect(screen.getByText('1 new')).toBeInTheDocument();
      expect(screen.getByText('1 updates')).toBeInTheDocument();
    });

    it('should handle zero updates correctly', () => {
      const allCreateSummary: ImportSummary = {
        totalRows: 2,
        departments: {
          total: 2,
          creates: 2,
          updates: 0,
        },
        positions: {
          total: 0,
          creates: 0,
          updates: 0,
        },
      };

      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={allCreateSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('0 updates')).toBeInTheDocument();
    });

    it('should handle zero creates correctly', () => {
      const allUpdateSummary: ImportSummary = {
        totalRows: 1,
        departments: {
          total: 1,
          creates: 0,
          updates: 1,
        },
        positions: {
          total: 0,
          creates: 0,
          updates: 0,
        },
      };

      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={allUpdateSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('0 new')).toBeInTheDocument();
    });

    it('should handle empty departments', () => {
      const emptyDeptSummary: ImportSummary = {
        totalRows: 2,
        departments: {
          total: 0,
          creates: 0,
          updates: 0,
        },
        positions: mockSummary.positions,
      };

      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={emptyDeptSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Departments')).toBeInTheDocument();
      expect(screen.getByText('0 total')).toBeInTheDocument();
    });

    it('should handle empty positions', () => {
      const emptyPosSummary: ImportSummary = {
        totalRows: 3,
        departments: mockSummary.departments,
        positions: {
          total: 0,
          creates: 0,
          updates: 0,
        },
      };

      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={emptyPosSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Positions')).toBeInTheDocument();
      expect(screen.getByText('0 total')).toBeInTheDocument();
    });
  });

  describe('Warning Message', () => {
    it('should display warning message', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/This operation will modify your organization structure/)).toBeInTheDocument();
    });

    it('should style warning message with alert role', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const warningElement = screen.getByText(/This operation will modify your organization structure/).closest('[role="alert"]');
      expect(warningElement).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render confirm and cancel buttons', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: 'Confirm Import' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm Import' });
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable buttons during loading state', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isConfirming={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Importing...' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading text on confirm button during loading', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isConfirming={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Importing...' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Confirm Import' })).not.toBeInTheDocument();
    });

    it('should not call handlers when buttons are disabled', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isConfirming={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Importing...' });
      await user.click(confirmButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close dialog on Escape key', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should handle Enter key on confirm button', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm Import' });
      confirmButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should handle Space key on cancel button', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      cancelButton.focus();
      await user.keyboard(' ');

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should allow Tab navigation between buttons', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const confirmButton = screen.getByRole('button', { name: 'Confirm Import' });

      // Start at cancel button
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);

      // Tab to confirm button
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(confirmButton);
    });
  });

  describe('Focus Management', () => {
    it('should auto-focus confirm button on open', async () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm Import' });
        expect(document.activeElement).toBe(confirmButton);
      });
    });

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const confirmButton = screen.getByRole('button', { name: 'Confirm Import' });

      // Tab forward from confirm to cancel
      confirmButton.focus();
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(cancelButton);

      // Tab forward from cancel should wrap to confirm
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(confirmButton);
    });

    it('should restore focus to trigger element after closing', () => {
      // This test requires a trigger element in the DOM
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Dialog';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Close dialog
      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ImportConfirmationDialog
            isOpen={false}
            summary={mockSummary}
            onConfirm={mockOnConfirm}
            onCancel={mockOnCancel}
          />
        </NextIntlClientProvider>
      );

      expect(document.activeElement).toBe(triggerButton);

      document.body.removeChild(triggerButton);
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      const ariaLabelledBy = dialog.getAttribute('aria-labelledby');
      
      expect(ariaLabelledBy).toBeTruthy();
      
      const titleElement = document.getElementById(ariaLabelledBy!);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('Confirm Import');
    });

    it('should have aria-describedby for warning message', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      const ariaDescribedBy = dialog.getAttribute('aria-describedby');
      
      expect(ariaDescribedBy).toBeTruthy();
      
      const descElement = document.getElementById(ariaDescribedBy!);
      expect(descElement?.textContent).toContain('This operation will modify');
    });

    it('should render backdrop with proper opacity', () => {
      const { container } = renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const backdrop = container.querySelector('[data-testid="dialog-backdrop"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('should close dialog when clicking backdrop', async () => {
      const user = userEvent.setup();
      const { container } = renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const backdrop = container.querySelector('[data-testid="dialog-backdrop"]');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', () => {
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isConfirming={true}
        />
      );

      // Check for loading indicator (spinner or aria-busy)
      const confirmButton = screen.getByRole('button', { name: 'Importing...' });
      expect(confirmButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should prevent dialog close during loading', async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isConfirming={true}
        />
      );

      await user.keyboard('{Escape}');
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should prevent backdrop click during loading', async () => {
      const user = userEvent.setup();
      const { container } = renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={mockSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isConfirming={true}
        />
      );

      const backdrop = container.querySelector('[data-testid="dialog-backdrop"]');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnCancel).not.toHaveBeenCalled();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle summary with only departments', () => {
      const deptOnlySummary: ImportSummary = {
        totalRows: 3,
        departments: mockSummary.departments,
        positions: {
          total: 0,
          creates: 0,
          updates: 0,
        },
      };

      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={deptOnlySummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Departments')).toBeInTheDocument();
      expect(screen.getByText('Positions')).toBeInTheDocument();
      expect(screen.getByText('0 total')).toBeInTheDocument(); // Positions total
    });

    it('should handle summary with only positions', () => {
      const posOnlySummary: ImportSummary = {
        totalRows: 2,
        departments: {
          total: 0,
          creates: 0,
          updates: 0,
        },
        positions: mockSummary.positions,
      };

      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={posOnlySummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Departments')).toBeInTheDocument();
      expect(screen.getByText('Positions')).toBeInTheDocument();
      expect(screen.getByText('0 total')).toBeInTheDocument(); // Departments total
    });

    it('should handle completely empty summary', () => {
      const emptySummary: ImportSummary = {
        totalRows: 0,
        departments: {
          total: 0,
          creates: 0,
          updates: 0,
        },
        positions: {
          total: 0,
          creates: 0,
          updates: 0,
        },
      };

      renderWithIntl(
        <ImportConfirmationDialog
          isOpen={true}
          summary={emptySummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const totalTexts = screen.getAllByText('0 total');
      expect(totalTexts.length).toBe(2); // One for departments, one for positions
    });
  });
});
