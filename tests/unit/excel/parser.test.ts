/**
 * Unit Tests for Excel Parser
 * 
 * Tests: T018 [US1]
 * Following TDD: These tests should FAIL initially until full implementation
 */

import * as XLSX from 'xlsx';
import {
  readExcelFile,
  validateSheets,
  parseSheetData,
  parseExcelImport,
} from '@/lib/utils/excel/parser';
import { SheetType } from '@/lib/types/import';

describe('Excel Parser', () => {
  describe('readExcelFile', () => {
    it('should successfully read a valid XLSX file', async () => {
      // Create a simple workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Header1', 'Header2'],
        ['Value1', 'Value2'],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
      // Convert to buffer
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await readExcelFile(buffer);
      
      expect(result).toBeDefined();
      expect(result.SheetNames).toContain('Sheet1');
    });

    it('should throw error for invalid file format', async () => {
      const invalidBuffer = new ArrayBuffer(10);
      
      await expect(readExcelFile(invalidBuffer)).rejects.toThrow();
    });

    it('should throw error for empty buffer', async () => {
      const emptyBuffer = new ArrayBuffer(0);
      
      await expect(readExcelFile(emptyBuffer)).rejects.toThrow();
    });
  });

  describe('validateSheets', () => {
    it('should validate workbook with required sheets', () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Positions');
      
      const result = validateSheets(wb);
      
      expect(result.isValid).toBe(true);
      expect(result.missingSheets).toHaveLength(0);
    });

    it('should detect missing Departments sheet', () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Positions');
      
      const result = validateSheets(wb);
      
      expect(result.isValid).toBe(false);
      expect(result.missingSheets).toContain(SheetType.DEPARTMENTS);
    });

    it('should detect missing Positions sheet', () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Departments');
      
      const result = validateSheets(wb);
      
      expect(result.isValid).toBe(false);
      expect(result.missingSheets).toContain(SheetType.POSITIONS);
    });

    it('should be case-insensitive for sheet names', () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'departments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'POSITIONS');
      
      const result = validateSheets(wb);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('parseSheetData', () => {
    it('should parse departments sheet correctly', () => {
      const wb = XLSX.utils.book_new();
      
      // Departments sheet (only one sheet, as departments and positions are imported separately)
      const deptData = [
        ['dept_code', 'name', 'parent_dept_code', 'metadata'],
        ['ENG', 'Engineering', null, null],
        ['ENG-FE', 'Frontend Team', 'ENG', '{"team_size": 10}'],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptData), 'Departments');
      
      const result = parseSheetData(wb, 'departments');
      
      expect(result.departments).toHaveLength(2);
      expect(result.departments[0]).toMatchObject({
        dept_code: 'ENG',
        name: 'Engineering',
        parent_dept_code: null,
        excelRow: 2,
      });
      expect(result.departments[1]).toMatchObject({
        dept_code: 'ENG-FE',
        name: 'Frontend Team',
        parent_dept_code: 'ENG',
        excelRow: 3,
      });
      expect(result.departments[1].metadata).toEqual({ team_size: 10 });
      expect(result.positions).toHaveLength(0);
    });

    it('should parse positions sheet correctly', () => {
      const wb = XLSX.utils.book_new();
      
      // Positions sheet (only one sheet, as departments and positions are imported separately)
      const posData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['CTO', 'Chief Technology Officer', 'ENG', null, true, 1],
        ['FE-LEAD', 'Frontend Lead', 'ENG-FE', 'CTO', true, 1],
        ['FE-DEV', 'Frontend Developer', 'ENG-FE', 'FE-LEAD', false, 5],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(posData), 'Positions');
      
      const result = parseSheetData(wb, 'positions');
      
      expect(result.positions).toHaveLength(3);
      expect(result.positions[0]).toMatchObject({
        pos_code: 'CTO',
        title: 'Chief Technology Officer',
        dept_code: 'ENG',
        reports_to_pos_code: null,
        is_manager: true,
        incumbents_count: 1,
        excelRow: 2,
      });
      expect(result.positions[2]).toMatchObject({
        pos_code: 'FE-DEV',
        is_manager: false,
        incumbents_count: 5,
      });
      expect(result.departments).toHaveLength(0);
    });

    it('should handle boolean string values (true/false, yes/no)', () => {
      const wb = XLSX.utils.book_new();
      
      const posData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['P1', 'Position 1', 'D1', null, 'true', 1],
        ['P2', 'Position 2', 'D1', null, 'false', 0],
        ['P3', 'Position 3', 'D1', null, '1', 1],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(posData), 'Positions');
      
      const result = parseSheetData(wb, 'positions');
      
      expect(result.positions[0].is_manager).toBe(true);
      expect(result.positions[1].is_manager).toBe(false);
      expect(result.positions[2].is_manager).toBe(true);
    });

    it('should throw error for missing required columns in Departments', () => {
      const wb = XLSX.utils.book_new();
      
      // Missing 'name' column
      const deptData = [['dept_code', 'parent_dept_code']];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptData), 'Departments');
      
      expect(() => parseSheetData(wb, 'departments')).toThrow('Missing required columns');
    });

    it('should throw error for missing required columns in Positions', () => {
      const wb = XLSX.utils.book_new();
      
      // Missing 'title' column
      const posData = [['pos_code', 'dept_code']];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(posData), 'Positions');
      
      expect(() => parseSheetData(wb, 'positions')).toThrow('Missing required columns');
    });

    it('should trim whitespace from string values', () => {
      const wb = XLSX.utils.book_new();
      
      const deptData = [
        ['dept_code', 'name', 'parent_dept_code', 'metadata'],
        ['  ENG  ', '  Engineering  ', '  PARENT  ', null],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptData), 'Departments');
      
      const result = parseSheetData(wb, 'departments');
      
      expect(result.departments[0].dept_code).toBe('ENG');
      expect(result.departments[0].name).toBe('Engineering');
      expect(result.departments[0].parent_dept_code).toBe('PARENT');
    });
  });

  describe('parseExcelImport', () => {
    it('should complete full parsing workflow successfully for departments', async () => {
      const wb = XLSX.utils.book_new();
      
      const deptData = [
        ['dept_code', 'name', 'parent_dept_code', 'metadata'],
        ['D1', 'Department 1', null, null],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptData), 'Departments');
      
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseExcelImport(buffer, 'departments');
      
      expect(result.departments).toHaveLength(1);
      expect(result.positions).toHaveLength(0);
    });

    it('should complete full parsing workflow successfully for positions', async () => {
      const wb = XLSX.utils.book_new();
      
      const posData = [
        ['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count'],
        ['P1', 'Position 1', 'D1', null, true, 1],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(posData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseExcelImport(buffer, 'positions');
      
      expect(result.positions).toHaveLength(1);
      expect(result.departments).toHaveLength(0);
    });

    it('should throw error for missing required columns when sheet name does not match', async () => {
      const wb = XLSX.utils.book_new();
      // Sheet with wrong name and missing required columns
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['wrong']]), 'OnlyOneSheet');
      
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      // Should throw error about missing required columns (parser only looks at first sheet)
      await expect(parseExcelImport(buffer, 'departments')).rejects.toThrow('Missing required columns');
    });

    it('should throw error for empty departments file', async () => {
      const wb = XLSX.utils.book_new();
      
      const deptData = [['dept_code', 'name', 'parent_dept_code', 'metadata']];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptData), 'Departments');
      
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      await expect(parseExcelImport(buffer, 'departments')).rejects.toThrow('Excel file contains no department data');
    });

    it('should throw error for empty positions file', async () => {
      const wb = XLSX.utils.book_new();
      
      const posData = [['pos_code', 'title', 'dept_code', 'reports_to_pos_code', 'is_manager', 'incumbents_count']];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(posData), 'Positions');
      
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      await expect(parseExcelImport(buffer, 'positions')).rejects.toThrow('Excel file contains no position data');
    });
  });
});
