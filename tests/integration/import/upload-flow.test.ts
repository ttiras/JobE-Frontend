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
const validateImportData = (
  data: ExcelData,
  existingDeptCodes: Set<string> = new Set(),
  existingPosCodes: Set<string> = new Set()
) => {
  // Build valid code sets (file codes + existing DB codes)
  const fileDepartmentCodes = new Set(data.departments.map(d => d.dept_code));
  const filePositionCodes = new Set(data.positions.map(p => p.pos_code));
  
  const validDepartmentCodes = new Set([...fileDepartmentCodes, ...existingDeptCodes]);
  const validPositionCodes = new Set([...filePositionCodes, ...existingPosCodes]);
  
  const departmentErrors = validateDepartments({
    departments: data.departments,
    positions: data.positions,
    validDepartmentCodes,
    validPositionCodes,
    existingDepartmentCodes: existingDeptCodes,
    existingPositionCodes: existingPosCodes,
  });
  
  const positionErrors = validatePositions({
    departments: data.departments,
    positions: data.positions,
    validDepartmentCodes,
    validPositionCodes,
    existingDepartmentCodes: existingDeptCodes,
    existingPositionCodes: existingPosCodes,
  });
  
  const allErrors = [...departmentErrors, ...positionErrors];
  
  // Separate errors from warnings
  const actualErrors = allErrors.filter(e => e.severity === ErrorSeverity.ERROR);
  const warnings = allErrors.filter(e => e.severity === ErrorSeverity.WARNING);
  
  return {
    isValid: actualErrors.length === 0, // Only errors invalidate, warnings are acceptable
    errors: actualErrors,
    warnings: warnings,
    validationStatus: actualErrors.length === 0 ? ValidationStatus.VALID : ValidationStatus.ERRORS,
  };
};

describe('Import Upload Flow Integration', () => {
  // Mock existing codes in database
  const existingDepartmentCodes = new Set(['HR', 'FIN']);
  const existingPositionCodes = new Set(['CEO', 'CFO']);

  describe('Happy Path: Valid File Upload', () => {
    it('should successfully process valid Excel file with departments and positions', async () => {
      // Step 1: Create mock Excel file with departments and positions in one file
      const departmentsData = [
        ['dept_code', 'name', 'parent_dept_code'],
        ['HR', 'Human Resources', ''],
        ['HR-REC', 'Recruitment', 'HR'],
        ['ENG', 'Engineering', ''],
      ];

      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['CEO', 'Chief Executive Officer', 'HR', '', 'TRUE', '1'],
        ['CTO', 'Chief Technology Officer', 'ENG', 'CEO', 'TRUE', '1'],
        ['HR-MGR', 'HR Manager', 'HR-REC', 'CEO', 'TRUE', '1'],
      ];

      // Create separate workbooks since parser uses first sheet
      const wbDepts = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbDepts, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      const bufferDepts = XLSX.write(wbDepts, { type: 'buffer', bookType: 'xlsx' });
      const parseResultDepts = await parseExcelImport(bufferDepts, 'departments');
      
      const wbPos = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbPos, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      const bufferPos = XLSX.write(wbPos, { type: 'buffer', bookType: 'xlsx' });
      const parseResultPos = await parseExcelImport(bufferPos, 'positions');
      
      // Combine results
      const parseResult = {
        departments: parseResultDepts.departments,
        positions: parseResultPos.positions,
      };
      
      expect(parseResult.departments).toHaveLength(3);
      expect(parseResult.positions).toHaveLength(3);
      expect(parseResult.departments[0].dept_code).toBe('HR');
      expect(parseResult.positions[0].pos_code).toBe('CEO');

      // Step 3: Validate parsed data
      // Update valid codes to include parsed departments and positions
      const fileDeptCodes = new Set(parseResult.departments.map(d => d.dept_code));
      const filePosCodes = new Set(parseResult.positions.map(p => p.pos_code));
      const validDeptCodes = new Set([...fileDeptCodes, ...existingDepartmentCodes]);
      const validPosCodes = new Set([...filePosCodes, ...existingPositionCodes]);
      
      const departmentErrors = validateDepartments({
        departments: parseResult.departments,
        positions: parseResult.positions,
        validDepartmentCodes: validDeptCodes,
        validPositionCodes: validPosCodes,
        existingDepartmentCodes,
        existingPositionCodes,
      });
      
      const positionErrors = validatePositions({
        departments: parseResult.departments,
        positions: parseResult.positions,
        validDepartmentCodes: validDeptCodes,
        validPositionCodes: validPosCodes,
        existingDepartmentCodes,
        existingPositionCodes,
      });
      
      // Separate errors from warnings
      const allValidationErrors = [...departmentErrors, ...positionErrors];
      const actualErrors = allValidationErrors.filter(e => e.severity === ErrorSeverity.ERROR);
      const warnings = allValidationErrors.filter(e => e.severity === ErrorSeverity.WARNING);
      
      const validationResult = {
        isValid: actualErrors.length === 0, // Only errors count, warnings don't invalidate
        errors: actualErrors,
        warnings: warnings,
        validationStatus: actualErrors.length === 0 ? ValidationStatus.VALID : ValidationStatus.ERRORS,
      };
      
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      // May have warnings (e.g., multiple root departments), which is acceptable

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
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'departments');
      expect(parseResult.departments).toHaveLength(2);
      expect(parseResult.positions).toHaveLength(0);

      const validationResult = validateImportData(parseResult, existingDepartmentCodes, existingPositionCodes);
      expect(validationResult.isValid).toBe(true);

      const departmentsWithOps = detectDepartmentOperations(
        parseResult.departments,
        existingDepartmentCodes
      );

      expect(departmentsWithOps).toHaveLength(2);
      expect(departmentsWithOps.every((d: any) => d.operation === 'CREATE')).toBe(true);
    });

    it('should handle file with only positions', async () => {
      // Use positions that reference existing departments/positions OR self-referencing positions
      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['DEV-1', 'Senior Developer', 'HR', 'CEO', 'FALSE', '3'], // HR exists, CEO exists
        ['DEV-2', 'Junior Developer', 'HR', 'DEV-1', 'FALSE', '5'], // HR exists, DEV-1 is in file
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'positions');
      expect(parseResult.departments).toHaveLength(0);
      expect(parseResult.positions).toHaveLength(2);
      
      // Validation: positions reference HR (exists in existingDepartmentCodes) and CEO (exists in existingPositionCodes)
      // DEV-2 references DEV-1 which is in the file, so it should be valid
      const validationResult = validateImportData(parseResult, existingDepartmentCodes, existingPositionCodes);
      
      // Should have no errors since all references are valid
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
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'departments');
      const validationResult = validateImportData(parseResult, existingDepartmentCodes, existingPositionCodes);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      
      // Find errors related to missing dept_code or name
      const missingCodeError = validationResult.errors.find(e => 
        (e.message.toLowerCase().includes('dept_code') || e.message.toLowerCase().includes('code')) && 
        (e.row === 2 || e.message.includes('row 2'))
      );
      const missingNameError = validationResult.errors.find(e => 
        (e.message.toLowerCase().includes('name') || e.message.toLowerCase().includes('required')) && 
        (e.row === 3 || e.message.includes('row 3'))
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
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'departments');
      const validationResult = validateImportData(parseResult, existingDepartmentCodes, existingPositionCodes);

      expect(validationResult.isValid).toBe(false);
      
      // Find duplicate error - check for messages about duplicate codes
      const duplicateError = validationResult.errors.find(e => 
        (e.message.toLowerCase().includes('duplicate') || e.message.toLowerCase().includes('duplicated')) && 
        (e.message.includes('DUP') || e.message.includes('dup'))
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
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'departments');
      const validationResult = validateImportData(parseResult, existingDepartmentCodes, existingPositionCodes);

      expect(validationResult.isValid).toBe(false);
      
      // Find circular reference error
      const circularError = validationResult.errors.find(e => 
        e.message.toLowerCase().includes('circular') || 
        e.message.toLowerCase().includes('cycle') ||
        e.message.toLowerCase().includes('circular reference')
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

      // Parse departments and positions separately (need separate buffers)
      const wbDepts = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbDepts, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      const bufferDepts = XLSX.write(wbDepts, { type: 'buffer', bookType: 'xlsx' });
      const parseResultDepts = await parseExcelImport(bufferDepts, 'departments');
      
      const wbPos = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbPos, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      const bufferPos = XLSX.write(wbPos, { type: 'buffer', bookType: 'xlsx' });
      const parseResultPos = await parseExcelImport(bufferPos, 'positions');
      
      const parseResult = {
        departments: parseResultDepts.departments,
        positions: parseResultPos.positions,
      };
      
      const validationResult = validateImportData(parseResult, existingDepartmentCodes, existingPositionCodes);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThanOrEqual(1); // At least invalid parent

      const invalidParentError = validationResult.errors.find(e => 
        e.message.includes('NONEXISTENT') || e.message.includes('nonexistent')
      );
      const invalidDeptError = validationResult.errors.find(e => 
        e.message.includes('INVALID_DEPT') || e.message.includes('invalid_dept')
      );
      const invalidReportsToError = validationResult.errors.find(e => 
        e.message.includes('INVALID_POS') || e.message.includes('invalid_pos')
      );

      // At least one of these errors should be present
      expect(invalidParentError || invalidDeptError || invalidReportsToError).toBeDefined();
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
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'positions');

      expect(parseResult.positions[0].is_manager).toBe(true);
      expect(parseResult.positions[1].is_manager).toBe(false);
      expect(parseResult.positions[2].is_manager).toBe(true);
      expect(parseResult.positions[3].is_manager).toBe(true);
    });

    it('should correctly parse numeric fields', async () => {
      const positionsData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['P1', 'Position 1', 'HR', '', 'TRUE', '5'],
        ['P2', 'Position 2', 'HR', 'P1', 'FALSE', '10'],
        ['P3', 'Position 3', 'HR', 'P1', 'FALSE', '0'], // string '0'
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'positions');

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
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'departments');

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

      // Parse departments
      const wbDepts = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbDepts, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      const bufferDepts = XLSX.write(wbDepts, { type: 'buffer', bookType: 'xlsx' });
      const parseResultDepts = await parseExcelImport(bufferDepts, 'departments');
      
      // Parse positions
      const wbPos = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbPos, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      const bufferPos = XLSX.write(wbPos, { type: 'buffer', bookType: 'xlsx' });
      const parseResultPos = await parseExcelImport(bufferPos, 'positions');
      
      const parseResult = {
        departments: parseResultDepts.departments,
        positions: parseResultPos.positions,
      };

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
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const startTime = Date.now();
      const parseResult = await parseExcelImport(buffer, 'departments');
      const parseTime = Date.now() - startTime;

      expect(parseResult.departments).toHaveLength(1000);
      expect(parseTime).toBeLessThan(2000); // Should parse in under 2 seconds

      const validationStartTime = Date.now();
      validateImportData(parseResult, existingDepartmentCodes, existingPositionCodes);
      const validationTime = Date.now() - validationStartTime;

      expect(validationTime).toBeLessThan(1000); // Should validate in under 1 second
    });

    it('should handle file with 500 positions efficiently', async () => {
      const positionsData: string[][] = [['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count']];
      
      for (let i = 0; i < 500; i++) {
        positionsData.push([`POS${i}`, `Position ${i}`, 'DEPT1', i > 0 ? `POS${i-1}` : '', 'FALSE', 'TRUE', '1']);
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(positionsData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const startTime = Date.now();
      const parseResult = await parseExcelImport(buffer, 'positions');
      const totalTime = Date.now() - startTime;

      expect(parseResult.positions).toHaveLength(500);
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Excel file', async () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['dept_code', 'name', 'parent_dept_code']]), 'Departments');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Empty file should throw an error (no data found)
      await expect(parseExcelImport(buffer, 'departments')).rejects.toThrow('Excel file contains no department data');
    });

    it('should reject file with missing required sheets', async () => {
      // XLSX.write throws an error on empty workbook, so we need to create a minimal workbook
      // with a sheet that doesn't match what we're looking for
      const wb = XLSX.utils.book_new();
      // Add a sheet with wrong name
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['wrong']]), 'WrongSheet');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Should throw error because 'Departments' sheet is not found
      await expect(parseExcelImport(buffer, 'departments')).rejects.toThrow();
    });

    it('should reject file with incorrect column headers', async () => {
      const departmentsData = [
        ['wrong_header', 'name', 'parent_dept_code'], // Incorrect header
        ['DEPT1', 'Department 1', ''],
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(departmentsData), 'Departments');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      await expect(parseExcelImport(buffer, 'departments')).rejects.toThrow();
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
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const parseResult = await parseExcelImport(buffer, 'departments');

      expect(parseResult.departments[0].dept_code).toBe('IT-OPS');
      expect(parseResult.departments[0].name).toBe('IT & Operations');
      expect(parseResult.departments[1].dept_code).toBe('R&D');
      expect(parseResult.departments[2].dept_code).toBe('C_SUITE');
      expect(parseResult.departments[2].name).toBe('C-Suite / Executive');
    });
  });
});
