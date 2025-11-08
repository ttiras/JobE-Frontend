/**
 * Integration Tests for Import Upload Flow
 * 
 * Tests: T024 [US1]
 * Following TDD: Tests for upload → parse → validate → preview integration
 * 
 * Flow:
 * 1. User uploads Excel file via FileUpload component
 * 2. File is parsed with xlsx library
 * 3. Data is validated (structure, circular refs, duplicates, references)
 * 4. Preview is generated with CREATE/UPDATE operations
 * 5. Validation errors are displayed if any
 */

import { ImportPreview, ErrorSeverity, ValidationStatus } from '@/lib/types/import';
import * as XLSX from 'xlsx';

// Import actual implementations
import { parseExcelImport } from '@/lib/utils/excel/parser';
import { validateDepartments, validatePositions } from '@/lib/utils/excel/validator';
import { detectDepartmentOperations, detectPositionOperations } from '@/lib/utils/excel/upsert-detector';
import { ExcelData } from '@/lib/types/import';

// Helper function to validate import data
const validateImportData = (data: ExcelData) => {
  // Build valid code sets (file codes + existing DB codes)
  const fileDepartmentCodes = new Set(data.departments.map(d => d.dept_code));
  const filePositionCodes = new Set(data.positions.map(p => p.pos_code));
  const existingDepartmentCodes = new Set<string>();
  const existingPositionCodes = new Set<string>();
  
  const validDepartmentCodes = new Set([...fileDepartmentCodes, ...existingDepartmentCodes]);
  const validPositionCodes = new Set([...filePositionCodes, ...existingPositionCodes]);
  
  const departmentErrors = validateDepartments({
    departments: data.departments,
    positions: data.positions,
    validDepartmentCodes,
    validPositionCodes,
    existingDepartmentCodes,
    existingPositionCodes,
  });
  
  const positionErrors = validatePositions({
    departments: data.departments,
    positions: data.positions,
    validDepartmentCodes,
    validPositionCodes,
    existingDepartmentCodes,
    existingPositionCodes,
  });
  
  const allErrors = [...departmentErrors, ...positionErrors];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: [],
    validationStatus: allErrors.length === 0 ? ValidationStatus.VALID : ValidationStatus.ERRORS,
  };
};

describe('Import Upload Flow Integration', () => {
  // Mock existing codes in database
  const existingDepartmentCodes = new Set(['HR', 'FIN']);
  const existingPositionCodes = new Set(['CEO', 'CFO']);

  describe('Happy Path: Valid File Upload', () => {
    it('should successfully process valid Excel file with departments and positions', async () => {
      // Step 1: Create mock Excel file
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['HR', 'Human Resources', ''],
        ['HR-REC', 'Recruitment', 'HR'],
        ['ENG', 'Engineering', ''],
      ];

      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['CEO', 'Chief Executive Officer', 'HR', '', 'TRUE', 'TRUE', '1'],
        ['CTO', 'Chief Technology Officer', 'ENG', 'CEO', 'TRUE', 'TRUE', '1'],
        ['HR-MGR', 'HR Manager', 'HR-REC', 'CEO', 'TRUE', 'TRUE', '1'],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Step 2: Parse Excel file
      const parseResult = await parseExcelImport(buffer);
      
      expect(parseResult.departments).toHaveLength(3);
      expect(parseResult.positions).toHaveLength(3);
      expect(parseResult.departments[0].dept_code).toBe('HR');
      expect(parseResult.positions[0].pos_code).toBe('CEO');

      // Step 3: Validate parsed data
      const validationResult = validateImportData(parseResult);
      
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      expect(validationResult.warnings).toHaveLength(0);

      // Step 4: Detect CREATE vs UPDATE operations
      const departmentsWithOps = detectDepartmentOperations(
        parseResult.departments,
        existingDepartmentCodes
      );
      const positionsWithOps = detectPositionOperations(
        parseResult.positions,
        existingPositionCodes
      );

      expect(departmentsWithOps[0].operation).toBe('UPDATE'); // HR exists
      expect(departmentsWithOps[1].operation).toBe('CREATE'); // HR-REC is new
      expect(departmentsWithOps[2].operation).toBe('CREATE'); // ENG is new
      
      expect(positionsWithOps[0].operation).toBe('UPDATE'); // CEO exists
      expect(positionsWithOps[1].operation).toBe('CREATE'); // CTO is new
      expect(positionsWithOps[2].operation).toBe('CREATE'); // HR-MGR is new

      // Step 5: Generate preview
      const preview: ImportPreview = {
        summary: {
          totalRows: 6,
          departments: {
            total: 3,
            creates: 2,
            updates: 1,
          },
          positions: {
            total: 3,
            creates: 2,
            updates: 1,
          },
        },
        departments: departmentsWithOps,
        positions: positionsWithOps,
        validationStatus: validationResult.validationStatus,
      };

      expect(preview.summary.departments.total).toBe(3);
      expect(preview.summary.departments.creates).toBe(2);
      expect(preview.summary.departments.updates).toBe(1);
      expect(preview.summary.positions.total).toBe(3);
      expect(preview.summary.positions.creates).toBe(2);
      expect(preview.summary.positions.updates).toBe(1);
    });

    it('should handle file with only departments', async () => {
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['IT', 'Information Technology', ''],
        ['IT-DEV', 'Development', 'IT'],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);
      expect(parseResult.departments).toHaveLength(2);
      expect(parseResult.positions).toHaveLength(0);

      const validationResult = validateImportData(parseResult);
      expect(validationResult.isValid).toBe(true);

      const departmentsWithOps = detectDepartmentOperations(
        parseResult.departments,
        existingDepartmentCodes
      );

      expect(departmentsWithOps).toHaveLength(2);
      expect(departmentsWithOps.every((d: any) => d.operation === 'CREATE')).toBe(true);
    });

    it('should handle file with only positions', async () => {
      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['DEV-1', 'Senior Developer', 'ENG', 'CTO', 'FALSE', 'TRUE', '3'],
        ['DEV-2', 'Junior Developer', 'ENG', 'DEV-1', 'FALSE', 'TRUE', '5'],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['dept_code', 'name', 'parent_dept_code']]), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);
      expect(parseResult.departments).toHaveLength(0);
      expect(parseResult.positions).toHaveLength(2);

      const validationResult = validateImportData(parseResult);
      // Note: This may have warnings about dept_code references if ENG doesn't exist
      expect(validationResult.errors.filter((e: any) => e.severity === ErrorSeverity.ERROR)).toHaveLength(0);

      const positionsWithOps = detectPositionOperations(
        parseResult.positions,
        existingPositionCodes
      );

      expect(positionsWithOps).toHaveLength(2);
      expect(positionsWithOps.every((p: any) => p.operation === 'CREATE')).toBe(true);
    });
  });

  describe('Validation Error Handling', () => {
    it('should detect missing required fields', async () => {
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['', 'No Code Department', ''], // Missing dept_code
        ['VALID', '', ''], // Missing name
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);
      const validationResult = validateImportData(parseResult);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      
      const missingCodeError = validationResult.errors.find(e => 
        e.message.includes('dept_code') && e.row === 2
      );
      const missingNameError = validationResult.errors.find(e => 
        e.message.includes('name') && e.row === 3
      );

      expect(missingCodeError).toBeDefined();
      expect(missingNameError).toBeDefined();
    });

    it('should detect duplicate codes within file', async () => {
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['DUP', 'First', ''],
        ['DUP', 'Second', ''], // Duplicate dept_code
        ['UNIQUE', 'Third', ''],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);
      const validationResult = validateImportData(parseResult);

      expect(validationResult.isValid).toBe(false);
      
      const duplicateError = validationResult.errors.find(e => 
        e.message.includes('duplicate') && e.message.includes('DUP')
      );

      expect(duplicateError).toBeDefined();
      expect(duplicateError?.severity).toBe(ErrorSeverity.ERROR);
    });

    it('should detect circular references in department hierarchy', async () => {
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['A', 'Department A', 'B'],
        ['B', 'Department B', 'C'],
        ['C', 'Department C', 'A'], // Circular: A→B→C→A
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);
      const validationResult = validateImportData(parseResult);

      expect(validationResult.isValid).toBe(false);
      
      const circularError = validationResult.errors.find(e => 
        e.message.includes('circular') || e.message.includes('cycle')
      );

      expect(circularError).toBeDefined();
      expect(circularError?.severity).toBe(ErrorSeverity.ERROR);
    });

    it('should detect invalid references', async () => {
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['CHILD', 'Child Department', 'NONEXISTENT'], // Invalid parent reference
      ];

      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['POS1', 'Position 1', 'INVALID_DEPT', '', 'FALSE', 'TRUE', '1'], // Invalid dept reference
        ['POS2', 'Position 2', 'CHILD', 'INVALID_POS', 'FALSE', 'TRUE', '1'], // Invalid reports_to reference
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);
      const validationResult = validateImportData(parseResult);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThanOrEqual(3);

      const invalidParentError = validationResult.errors.find(e => 
        e.message.includes('NONEXISTENT')
      );
      const invalidDeptError = validationResult.errors.find(e => 
        e.message.includes('INVALID_DEPT')
      );
      const invalidReportsToError = validationResult.errors.find(e => 
        e.message.includes('INVALID_POS')
      );

      expect(invalidParentError).toBeDefined();
      expect(invalidDeptError).toBeDefined();
      expect(invalidReportsToError).toBeDefined();
    });
  });

  describe('Data Type Handling', () => {
    it('should correctly parse boolean fields', async () => {
      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['P1', 'Position 1', 'HR', '', 'TRUE', 'TRUE', '1'],
        ['P2', 'Position 2', 'HR', 'P1', 'FALSE', 'FALSE', '2'],
        ['P3', 'Position 3', 'HR', 'P1', 'true', 'false', '3'], // lowercase
        ['P4', 'Position 4', 'HR', 'P1', '1', '0', '4'], // numeric
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['dept_code', 'name', 'parent_dept_code']]), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);

      expect(parseResult.positions[0].is_manager).toBe(true);
      expect(parseResult.positions[1].is_manager).toBe(false);
      expect(parseResult.positions[2].is_manager).toBe(true);
      expect(parseResult.positions[3].is_manager).toBe(true);
    });

    it('should correctly parse numeric fields', async () => {
      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['P1', 'Position 1', 'HR', '', 'TRUE', 'TRUE', '5'],
        ['P2', 'Position 2', 'HR', 'P1', 'FALSE', 'TRUE', '10'],
        ['P3', 'Position 3', 'HR', 'P1', 'FALSE', 'TRUE', 0], // numeric 0
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['dept_code', 'name', 'parent_dept_code']]), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);

      expect(parseResult.positions[0].incumbents_count).toBe(5);
      expect(parseResult.positions[1].incumbents_count).toBe(10);
      expect(parseResult.positions[2].incumbents_count).toBe(0);
    });

    it('should trim whitespace from string fields', async () => {
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['  TRIM  ', '  Name with spaces  ', '  PARENT  '],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);

      expect(parseResult.departments[0].dept_code).toBe('TRIM');
      expect(parseResult.departments[0].name).toBe('Name with spaces');
      expect(parseResult.departments[0].parent_dept_code).toBe('PARENT');
    });

    it('should handle empty/null optional fields', async () => {
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['ROOT', 'Root Department', ''], // Empty parent
        ['ROOT2', 'Root Department 2', null], // Null parent
      ];

      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['TOP', 'Top Position', 'ROOT', '', 'TRUE', 'TRUE', '1'], // Empty reports_to
        ['TOP2', 'Top Position 2', 'ROOT2', null, 'TRUE', 'TRUE', '1'], // Null reports_to
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);

      expect(parseResult.departments[0].parent_dept_code).toBeNull();
      expect(parseResult.departments[1].parent_dept_code).toBeNull();
      expect(parseResult.positions[0].reports_to_pos_code).toBeNull();
      expect(parseResult.positions[1].reports_to_pos_code).toBeNull();
    });
  });

  describe('Performance and Large Files', () => {
    it('should handle file with 1000 departments efficiently', async () => {
      const departmentsData: string[][] = [['dept_code', 'name', 'parent_dept_code']];
      
      for (let i = 0; i < 1000; i++) {
        departmentsData.push([`DEPT${i}`, `Department ${i}`, '']);
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const startTime = Date.now();
      const parseResult = await parseExcelImport(buffer);
      const parseTime = Date.now() - startTime;

      expect(parseResult.departments).toHaveLength(1000);
      expect(parseTime).toBeLessThan(2000); // Should parse in under 2 seconds

      const validationStartTime = Date.now();
      validateImportData(parseResult);
      const validationTime = Date.now() - validationStartTime;

      expect(validationTime).toBeLessThan(1000); // Should validate in under 1 second
    });

    it('should handle file with 500 positions efficiently', async () => {
      const positionsData: string[][] = [['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']];
      
      for (let i = 0; i < 500; i++) {
        positionsData.push([`POS${i}`, `Position ${i}`, 'DEPT1', i > 0 ? `POS${i-1}` : '', 'FALSE', 'TRUE', '1']);
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['dept_code', 'name', 'parent_dept_code']]), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const startTime = Date.now();
      const parseResult = await parseExcelImport(buffer);
      const totalTime = Date.now() - startTime;

      expect(parseResult.positions).toHaveLength(500);
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Excel file', async () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['dept_code', 'name', 'parent_dept_code']]), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);

      expect(parseResult.departments).toHaveLength(0);
      expect(parseResult.positions).toHaveLength(0);

      const validationResult = validateImportData(parseResult);
      expect(validationResult.isValid).toBe(true);
    });

    it('should reject file with missing required sheets', async () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['dept_code', 'name', 'parent_dept_code']]), 'Departments');
      // Missing Positions sheet
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      await expect(parseExcelImport(buffer)).rejects.toThrow();
    });

    it('should reject file with incorrect column headers', async () => {
      const departmentsData = [
        ['wrong_header', 'name', 'parent_dept_code'], // Incorrect header
        ['DEPT1', 'Department 1', ''],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      await expect(parseExcelImport(buffer)).rejects.toThrow();
    });

    it('should handle special characters in codes and names', async () => {
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['IT-OPS', 'IT & Operations', ''],
        ['R&D', 'Research & Development', ''],
        ['C_SUITE', 'C-Suite / Executive', ''],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'is_active', 'incumbents_count']]), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer);

      expect(parseResult.departments[0].dept_code).toBe('IT-OPS');
      expect(parseResult.departments[0].name).toBe('IT & Operations');
      expect(parseResult.departments[1].dept_code).toBe('R&D');
      expect(parseResult.departments[2].dept_code).toBe('C_SUITE');
      expect(parseResult.departments[2].name).toBe('C-Suite / Executive');
    });
  });
});
