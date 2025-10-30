/**
 * Component Tests for DataPreviewTable
 * 
 * Tests: T022 [US1]
 * Following TDD: Tests for rendering departments/positions with operation indicators
 */

import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { DataPreviewTable } from '@/components/import/data-preview-table';
import { DepartmentPreview, PositionPreview, OperationType } from '@/lib/types/import';

const messages = {
  import: {
    preview: {
      departments: 'Departments',
      positions: 'Positions',
      code: 'Code',
      nameEn: 'Name (EN)',
      nameTr: 'Name (TR)',
      parentCode: 'Parent Code',
      departmentCode: 'Department',
      reportingToCode: 'Reports To',
      active: 'Status',
      operation: 'Operation',
      create: 'Create',
      update: 'Update',
      noData: 'No data to preview',
      showingRows: 'Showing {shown} of {total} rows',
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

describe('DataPreviewTable Component', () => {
  const mockDepartments: DepartmentPreview[] = [
    {
      operation: OperationType.CREATE,
      dept_code: 'ENG',
      name: 'Engineering',
      parent_dept_code: null,
      excelRow: 2,
    },
    {
      operation: OperationType.UPDATE,
      dept_code: 'ENG-FE',
      name: 'Frontend Team',
      parent_dept_code: 'ENG',
      excelRow: 3,
    },
    {
      operation: OperationType.CREATE,
      dept_code: 'HR',
      name: 'Human Resources',
      parent_dept_code: null,
      excelRow: 4,
    },
  ];

  const mockPositions: PositionPreview[] = [
    {
      operation: OperationType.CREATE,
      pos_code: 'CTO',
      title: 'Chief Technology Officer',
      dept_code: 'ENG',
      reports_to_pos_code: null,
      is_manager: true,
      is_active: true,
      incumbents_count: 1,
      excelRow: 2,
    },
    {
      operation: OperationType.UPDATE,
      pos_code: 'FE-LEAD',
      title: 'Frontend Lead',
      dept_code: 'ENG-FE',
      reports_to_pos_code: 'CTO',
      is_manager: true,
      is_active: true,
      incumbents_count: 1,
      excelRow: 3,
    },
    {
      operation: OperationType.CREATE,
      pos_code: 'FE-DEV',
      title: 'Frontend Developer',
      dept_code: 'ENG-FE',
      reports_to_pos_code: 'FE-LEAD',
      is_manager: false,
      is_active: false,
      incumbents_count: 5,
      excelRow: 4,
    },
  ];

  describe('Empty State', () => {
    it('should show no data message when both lists are empty', () => {
      renderWithIntl(
        <DataPreviewTable departments={[]} positions={[]} />
      );

      expect(screen.getByText('No data to preview')).toBeInTheDocument();
    });

    it('should not show no data message when departments exist', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      expect(screen.queryByText('No data to preview')).not.toBeInTheDocument();
    });

    it('should not show no data message when positions exist', () => {
      renderWithIntl(
        <DataPreviewTable departments={[]} positions={mockPositions} />
      );

      expect(screen.queryByText('No data to preview')).not.toBeInTheDocument();
    });
  });

  describe('Summary Statistics', () => {
    it('should display department statistics correctly', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={[]} 
          showOperations={true}
        />
      );

      expect(screen.getByText('3 total')).toBeInTheDocument();
      expect(screen.getByText('2 new')).toBeInTheDocument();
      expect(screen.getByText('1 updates')).toBeInTheDocument();
    });

    it('should display position statistics correctly', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={[]} 
          positions={mockPositions} 
          showOperations={true}
        />
      );

      expect(screen.getByText('3 total')).toBeInTheDocument();
      expect(screen.getByText('2 new')).toBeInTheDocument();
      expect(screen.getByText('1 updates')).toBeInTheDocument();
    });

    it('should hide statistics when showOperations is false', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={mockPositions} 
          showOperations={false}
        />
      );

      expect(screen.queryByText('new')).not.toBeInTheDocument();
      expect(screen.queryByText('updates')).not.toBeInTheDocument();
    });

    it('should calculate statistics for all CREATE operations', () => {
      const allCreate: DepartmentPreview[] = [
        { operation: OperationType.CREATE, dept_code: 'D1', name: 'Dept 1', excelRow: 2 },
        { operation: OperationType.CREATE, dept_code: 'D2', name: 'Dept 2', excelRow: 3 },
      ];

      renderWithIntl(
        <DataPreviewTable 
          departments={allCreate} 
          positions={[]} 
          showOperations={true}
        />
      );

      expect(screen.getByText('2 new')).toBeInTheDocument();
      expect(screen.getByText('0 updates')).toBeInTheDocument();
    });

    it('should calculate statistics for all UPDATE operations', () => {
      const allUpdate: DepartmentPreview[] = [
        { operation: OperationType.UPDATE, dept_code: 'D1', name: 'Dept 1', excelRow: 2 },
        { operation: OperationType.UPDATE, dept_code: 'D2', name: 'Dept 2', excelRow: 3 },
      ];

      renderWithIntl(
        <DataPreviewTable 
          departments={allUpdate} 
          positions={[]} 
          showOperations={true}
        />
      );

      expect(screen.getByText('0 new')).toBeInTheDocument();
      expect(screen.getByText('2 updates')).toBeInTheDocument();
    });
  });

  describe('Department Table Rendering', () => {
    it('should render department table with correct headers', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Name (EN)')).toBeInTheDocument();
      expect(screen.getByText('Name (TR)')).toBeInTheDocument();
      expect(screen.getByText('Parent Code')).toBeInTheDocument();
    });

    it('should render all department rows', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      expect(screen.getByText('ENG')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('ENG-FE')).toBeInTheDocument();
      expect(screen.getByText('Frontend Team')).toBeInTheDocument();
      expect(screen.getByText('HR')).toBeInTheDocument();
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });

    it('should display parent code when present', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      // ENG-FE has parent ENG
      const rows = screen.getAllByRole('row');
      const engFeRow = rows.find(row => row.textContent?.includes('ENG-FE'));
      expect(engFeRow?.textContent).toContain('ENG');
    });

    it('should display dash for null parent code', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      // Check for em-dash character (—) for null values
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('should make rows keyboard navigable', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      const rows = screen.getAllByRole('row');
      // Skip header row, check data rows
      const dataRows = rows.slice(1);
      dataRows.forEach(row => {
        expect(row).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Position Table Rendering', () => {
    it('should render position table with correct headers', () => {
      renderWithIntl(
        <DataPreviewTable departments={[]} positions={mockPositions} />
      );

      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Name (EN)')).toBeInTheDocument();
      expect(screen.getByText('Name (TR)')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Reports To')).toBeInTheDocument();
    });

    it('should render all position rows', () => {
      renderWithIntl(
        <DataPreviewTable departments={[]} positions={mockPositions} />
      );

      expect(screen.getByText('CTO')).toBeInTheDocument();
      expect(screen.getByText('Chief Technology Officer')).toBeInTheDocument();
      expect(screen.getByText('FE-LEAD')).toBeInTheDocument();
      expect(screen.getByText('Frontend Lead')).toBeInTheDocument();
      expect(screen.getByText('FE-DEV')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    it('should display active status badge', () => {
      renderWithIntl(
        <DataPreviewTable departments={[]} positions={mockPositions} />
      );

      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBe(2); // CTO and FE-LEAD are active
    });

    it('should display inactive status badge', () => {
      renderWithIntl(
        <DataPreviewTable departments={[]} positions={mockPositions} />
      );

      const inactiveBadges = screen.getAllByText('Inactive');
      expect(inactiveBadges.length).toBe(1); // FE-DEV is inactive
    });

    it('should display department codes', () => {
      renderWithIntl(
        <DataPreviewTable departments={[]} positions={mockPositions} />
      );

      // Check that department codes appear in the table
      const rows = screen.getAllByRole('row');
      const hasEngCode = rows.some(row => row.textContent?.includes('ENG'));
      const hasEngFeCode = rows.some(row => row.textContent?.includes('ENG-FE'));
      
      expect(hasEngCode).toBe(true);
      expect(hasEngFeCode).toBe(true);
    });

    it('should display reporting relationships', () => {
      renderWithIntl(
        <DataPreviewTable departments={[]} positions={mockPositions} />
      );

      // FE-LEAD reports to CTO
      const rows = screen.getAllByRole('row');
      const feLeadRow = rows.find(row => row.textContent?.includes('FE-LEAD'));
      expect(feLeadRow?.textContent).toContain('CTO');
    });
  });

  describe('Operation Badges', () => {
    it('should display CREATE badge for new departments', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={[]} 
          showOperations={true}
        />
      );

      const createBadges = screen.getAllByText('Create');
      expect(createBadges.length).toBe(2); // ENG and HR are CREATE
    });

    it('should display UPDATE badge for existing departments', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={[]} 
          showOperations={true}
        />
      );

      const updateBadges = screen.getAllByText('Update');
      expect(updateBadges.length).toBe(1); // ENG-FE is UPDATE
    });

    it('should display operation badges for positions', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={[]} 
          positions={mockPositions} 
          showOperations={true}
        />
      );

      const createBadges = screen.getAllByText('Create');
      expect(createBadges.length).toBe(2); // CTO and FE-DEV

      const updateBadges = screen.getAllByText('Update');
      expect(updateBadges.length).toBe(1); // FE-LEAD
    });

    it('should hide operation badges when showOperations is false', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={mockPositions} 
          showOperations={false}
        />
      );

      expect(screen.queryByText('Create')).not.toBeInTheDocument();
      expect(screen.queryByText('Update')).not.toBeInTheDocument();
    });

    it('should hide operation column header when showOperations is false', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={[]} 
          showOperations={false}
        />
      );

      expect(screen.queryByText('Operation')).not.toBeInTheDocument();
    });
  });

  describe('Row Truncation', () => {
    it('should truncate departments when exceeding maxRows', () => {
      const manyDepartments: DepartmentPreview[] = Array.from({ length: 150 }, (_, i) => ({
        operation: OperationType.CREATE,
        dept_code: `D${i}`,
        name: `Department ${i}`,
        excelRow: i + 2,
      }));

      renderWithIntl(
        <DataPreviewTable 
          departments={manyDepartments} 
          positions={[]} 
          maxRows={100}
        />
      );

      expect(screen.getByText('Showing 100 of 150 rows')).toBeInTheDocument();
    });

    it('should truncate positions when exceeding maxRows', () => {
      const manyPositions: PositionPreview[] = Array.from({ length: 200 }, (_, i) => ({
        operation: OperationType.CREATE,
        pos_code: `P${i}`,
        title: `Position ${i}`,
        dept_code: 'D1',
        is_manager: false,
        is_active: true,
        incumbents_count: 1,
        excelRow: i + 2,
      }));

      renderWithIntl(
        <DataPreviewTable 
          departments={[]} 
          positions={manyPositions} 
          maxRows={100}
        />
      );

      expect(screen.getByText('Showing 100 of 200 rows')).toBeInTheDocument();
    });

    it('should not show truncation message when under maxRows', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={mockPositions} 
          maxRows={100}
        />
      );

      expect(screen.queryByText(/Showing.*of.*rows/)).not.toBeInTheDocument();
    });

    it('should use default maxRows of 100', () => {
      const manyDepartments: DepartmentPreview[] = Array.from({ length: 150 }, (_, i) => ({
        operation: OperationType.CREATE,
        dept_code: `D${i}`,
        name: `Department ${i}`,
        excelRow: i + 2,
      }));

      renderWithIntl(
        <DataPreviewTable departments={manyDepartments} positions={[]} />
      );

      // Should default to 100 rows
      expect(screen.getByText('Showing 100 of 150 rows')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic table structure', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should have keyboard navigable rows', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      const rows = screen.getAllByRole('row');
      // Check data rows (skip header)
      expect(rows[1]).toHaveAttribute('tabIndex', '0');
    });

    it('should render proper table headers', () => {
      renderWithIntl(
        <DataPreviewTable departments={mockDepartments} positions={[]} />
      );

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Both Tables Together', () => {
    it('should render both departments and positions tables', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={mockPositions} 
        />
      );

      // Both table titles should be present
      const departmentsTitle = screen.getByText(`Departments (${mockDepartments.length})`);
      const positionsTitle = screen.getByText(`Positions (${mockPositions.length})`);
      
      expect(departmentsTitle).toBeInTheDocument();
      expect(positionsTitle).toBeInTheDocument();
    });

    it('should maintain separate statistics for each table', () => {
      renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={mockPositions} 
          showOperations={true}
        />
      );

      // Should have statistics for both tables
      const totalCounts = screen.getAllByText('3 total');
      expect(totalCounts.length).toBe(2); // One for departments, one for positions
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = renderWithIntl(
        <DataPreviewTable 
          departments={mockDepartments} 
          positions={[]} 
          className="custom-class"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});
