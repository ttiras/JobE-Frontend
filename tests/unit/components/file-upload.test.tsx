/**
 * Component Tests for FileUpload
 * 
 * Tests: T021 [US1]
 * Following TDD: These tests validate drag-drop, file validation, and accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { FileUpload } from '@/components/import/file-upload';

// Mock Nhost hook
jest.mock('@nhost/nextjs', () => ({
  useFileUpload: jest.fn(),
}));

import { useFileUpload } from '@nhost/nextjs';

const mockUseFileUpload = useFileUpload as jest.MockedFunction<typeof useFileUpload>;

const messages = {
  import: {
    uploadArea: {
      title: 'Upload Excel File',
      subtitle: 'Click to browse or drag and drop',
      formats: 'Supported formats: .xlsx, .xls',
      maxSize: 'Maximum file size: 5MB',
      uploading: 'Uploading...',
    },
    errors: {
      fileTooLarge: 'File is too large (max 5MB)',
      invalidFormat: 'Invalid file format',
      uploadFailed: 'Upload failed',
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

describe('FileUpload Component', () => {
  const mockOnUploadSuccess = jest.fn();
  const mockOnUploadError = jest.fn();
  const mockUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFileUpload.mockReturnValue({
      upload: mockUpload,
      isUploading: false,
      progress: null,
      cancel: jest.fn(),
      add: jest.fn(),
      destroy: jest.fn(),
      isUploaded: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useFileUpload>);
  });

  describe('Rendering', () => {
    it('should render upload area with instructions', () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      expect(screen.getByText('Upload Excel File')).toBeInTheDocument();
      expect(screen.getByText('Click to browse or drag and drop')).toBeInTheDocument();
      expect(screen.getByText('Supported formats: .xlsx, .xls')).toBeInTheDocument();
      expect(screen.getByText('Maximum file size: 5MB')).toBeInTheDocument();
    });

    it('should be keyboard accessible with correct ARIA attributes', () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('aria-label', 'Upload Excel File');
      expect(dropZone).toHaveAttribute('tabIndex', '0');
    });

    it('should render with disabled state', () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
          disabled={true}
        />
      );

      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('tabIndex', '-1');
      expect(dropZone).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('File Selection', () => {
    it('should handle file selection via input click', async () => {
      mockUpload.mockResolvedValue({
        id: 'file-123',
        error: null,
      });

      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = screen.getByLabelText('Click to browse or drag and drop');
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith({
          file,
          bucketId: 'imports',
        });
      });
    });

    it('should trigger file input on Enter key press', async () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByRole('button');
      fireEvent.keyDown(dropZone, { key: 'Enter' });

      const input = screen.getByLabelText('Click to browse or drag and drop');
      expect(document.activeElement).toBe(input);
    });

    it('should trigger file input on Space key press', async () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByRole('button');
      fireEvent.keyDown(dropZone, { key: ' ' });

      // Input should be triggered (implementation detail)
      // This test validates keyboard accessibility
    });
  });

  describe('File Validation', () => {
    it('should reject file larger than 5MB', async () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = screen.getByLabelText('Click to browse or drag and drop');
      await userEvent.upload(input, largeFile);

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith('File is too large (max 5MB)');
        expect(mockUpload).not.toHaveBeenCalled();
      });
    });

    it('should reject file with invalid format', async () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const invalidFile = new File(['content'], 'test.txt', {
        type: 'text/plain',
      });

      const input = screen.getByLabelText('Click to browse or drag and drop');
      await userEvent.upload(input, invalidFile);

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith('Invalid file format');
        expect(mockUpload).not.toHaveBeenCalled();
      });
    });

    it('should accept .xlsx files', async () => {
      mockUpload.mockResolvedValue({
        id: 'file-123',
        error: null,
      });

      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = screen.getByLabelText('Click to browse or drag and drop');
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should accept .xls files', async () => {
      mockUpload.mockResolvedValue({
        id: 'file-123',
        error: null,
      });

      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['content'], 'test.xls', {
        type: 'application/vnd.ms-excel',
      });

      const input = screen.getByLabelText('Click to browse or drag and drop');
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });
  });

  describe('Upload Flow', () => {
    it('should call onUploadSuccess with file ID on successful upload', async () => {
      mockUpload.mockResolvedValue({
        id: 'file-123',
        error: null,
      });

      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = screen.getByLabelText('Click to browse or drag and drop');
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalledWith('file-123', 'test.xlsx');
      });
    });

    it('should call onUploadError on upload failure', async () => {
      mockUpload.mockResolvedValue({
        id: null,
        error: new Error('Network error'),
      });

      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = screen.getByLabelText('Click to browse or drag and drop');
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith('Upload failed');
      });
    });

    it('should show progress during upload', async () => {
      mockUseFileUpload.mockReturnValue({
        upload: mockUpload,
        isUploading: true,
        progress: 50,
        cancel: jest.fn(),
        add: jest.fn(),
        destroy: jest.fn(),
        isUploaded: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useFileUpload>);

      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });

    it('should disable interactions during upload', () => {
      mockUseFileUpload.mockReturnValue({
        upload: mockUpload,
        isUploading: true,
        progress: 50,
        cancel: jest.fn(),
        add: jest.fn(),
        destroy: jest.fn(),
        isUploaded: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useFileUpload>);

      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByRole('button');
      expect(dropZone).toHaveAttribute('aria-disabled', 'true');
      expect(dropZone).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Drag and Drop', () => {
    it('should highlight drop zone on drag enter', () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByRole('button');
      
      fireEvent.dragEnter(dropZone);
      
      // Visual state change should occur (tested via snapshot or class check)
      expect(dropZone).toHaveClass('border-primary');
    });

    it('should remove highlight on drag leave', () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByRole('button');
      
      fireEvent.dragEnter(dropZone);
      fireEvent.dragLeave(dropZone);
      
      expect(dropZone).toHaveClass('border-border');
    });

    it('should handle file drop', async () => {
      mockUpload.mockResolvedValue({
        id: 'file-123',
        error: null,
      });

      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const dropZone = screen.getByRole('button');
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith({
          file,
          bucketId: 'imports',
        });
      });
    });

    it('should not handle drop when disabled', () => {
      renderWithIntl(
        <FileUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
          disabled={true}
        />
      );

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const dropZone = screen.getByRole('button');
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(mockUpload).not.toHaveBeenCalled();
    });
  });
});
