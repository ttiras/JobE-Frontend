/**
 * Excel Parser Utility
 * 
 * Reads and validates Excel files using SheetJS (xlsx)
 * Features:
 * - XLSX/XLS file parsing
 * - Sheet structure validation
 * - Row-by-row data extraction
 * - Type-safe data conversion
 */

import * as XLSX from 'xlsx';
import { ExcelData, DepartmentRow, PositionRow, SheetType } from '@/lib/types/import';

// Expected columns for each sheet type
const DEPARTMENT_REQUIRED_COLUMNS = ['dept_code', 'name'];
const POSITION_COLUMNS = [
  'pos_code',
  'title',
  'dept_code',
  'reports_to_pos_code',
  'is_manager',
  'is_active',
  'incumbents_count',
];

/**
 * Read Excel file from buffer
 */
export async function readExcelFile(buffer: ArrayBuffer): Promise<XLSX.WorkBook> {
  try {
    // Validate buffer
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Empty or invalid file buffer');
    }

    // Basic validation for Excel file format
    if (buffer.byteLength < 100) {
      throw new Error('File is too small to be a valid Excel file');
    }

    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    // Validate workbook structure
    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Invalid Excel file: No sheets found');
    }

    return workbook;
  } catch (error) {
    throw new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that required sheets exist
 */
export function validateSheets(workbook: XLSX.WorkBook): {
  isValid: boolean;
  missingSheets: SheetType[];
} {
  const sheetNames = workbook.SheetNames.map(name => name.toLowerCase());
  const missingSheets: SheetType[] = [];

  if (!sheetNames.includes('departments')) {
    missingSheets.push(SheetType.DEPARTMENTS);
  }

  if (!sheetNames.includes('positions')) {
    missingSheets.push(SheetType.POSITIONS);
  }

  return {
    isValid: missingSheets.length === 0,
    missingSheets,
  };
}

/**
 * Validate sheet columns
 */
function validateColumns(
  sheet: XLSX.WorkSheet,
  expectedColumns: string[]
): {
  isValid: boolean;
  missingColumns: string[];
} {
  // Get first row (header)
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const headers: string[] = [];

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
    const cell = sheet[cellAddress];
    if (cell && cell.v) {
      headers.push(String(cell.v).toLowerCase().trim());
    }
  }

  const missingColumns = expectedColumns.filter(
    col => !headers.includes(col.toLowerCase())
  );

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
  };
}

/**
 * Parse department sheet data
 */
function parseDepartmentSheet(sheet: XLSX.WorkSheet): DepartmentRow[] {
  // Validate only required columns
  const validation = validateColumns(sheet, DEPARTMENT_REQUIRED_COLUMNS);
  if (!validation.isValid) {
    throw new Error(
      `Missing required columns in Departments sheet: ${validation.missingColumns.join(', ')}`
    );
  }

  // Convert sheet to JSON
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: null,
  });

  return jsonData.map((row, index) => {
    const excelRow = index + 2; // +2 because index is 0-based and row 1 is header

    // Parse metadata if it's a JSON string
    let metadata: Record<string, unknown> | null = null;
    if (row.metadata && typeof row.metadata === 'string') {
      try {
        metadata = JSON.parse(row.metadata);
      } catch {
        // Invalid JSON will be caught by validation
        metadata = null;
      }
    }

    return {
      dept_code: String(row.dept_code || '').trim(),
      name: String(row.name || '').trim(),
      parent_dept_code: row.parent_dept_code 
        ? String(row.parent_dept_code).trim() 
        : null,
      metadata,
      excelRow,
    };
  }).map(dept => {
    // Normalize empty parent codes: treat "-" and empty strings as null
    if (!dept.parent_dept_code || dept.parent_dept_code === '-' || dept.parent_dept_code === '') {
      return { ...dept, parent_dept_code: null };
    }
    return dept;
  });
}

/**
 * Parse position sheet data
 */
function parsePositionSheet(sheet: XLSX.WorkSheet): PositionRow[] {
  // Validate columns
  const validation = validateColumns(sheet, POSITION_COLUMNS);
  if (!validation.isValid) {
    throw new Error(
      `Missing required columns in Positions sheet: ${validation.missingColumns.join(', ')}`
    );
  }

  // Convert sheet to JSON
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: null,
  });

  return jsonData.map((row, index) => {
    const excelRow = index + 2; // +2 because index is 0-based and row 1 is header

    // Parse boolean fields
    const parseBoolean = (value: unknown): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === 'true' || lower === 'yes' || lower === '1';
      }
      if (typeof value === 'number') return value === 1;
      return false;
    };

    // Parse integer fields
    const parseInteger = (value: unknown): number => {
      if (typeof value === 'number') return Math.floor(value);
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    return {
      pos_code: String(row.pos_code || '').trim(),
      title: String(row.title || '').trim(),
      dept_code: String(row.dept_code || '').trim(),
      reports_to_pos_code: row.reports_to_pos_code
        ? String(row.reports_to_pos_code).trim()
        : null,
      is_manager: parseBoolean(row.is_manager),
      is_active: parseBoolean(row.is_active),
      incumbents_count: parseInteger(row.incumbents_count),
      excelRow,
    };
  });
}

/**
 * Parse Excel workbook and extract data
 * @param workbook - The Excel workbook to parse
 * @param importType - Type of import: 'departments' or 'positions'
 */
export function parseSheetData(
  workbook: XLSX.WorkBook, 
  importType: 'departments' | 'positions' = 'departments'
): ExcelData {
  // Find the first sheet (users typically upload single-sheet files)
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  // Initialize result with empty arrays
  const result: ExcelData = {
    departments: [],
    positions: [],
  };

  if (importType === 'departments') {
    // Parse as departments sheet
    try {
      result.departments = parseDepartmentSheet(firstSheet);
    } catch (error) {
      throw new Error(`Failed to parse departments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Parse as positions sheet
    try {
      result.positions = parsePositionSheet(firstSheet);
    } catch (error) {
      throw new Error(`Failed to parse positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Complete Excel parsing workflow
 * @param buffer - ArrayBuffer of the Excel file
 * @param importType - Type of import: 'departments' or 'positions'
 */
export async function parseExcelImport(
  buffer: ArrayBuffer, 
  importType: 'departments' | 'positions' = 'departments'
): Promise<ExcelData> {
  // Step 1: Read workbook
  const workbook = await readExcelFile(buffer);

  // Step 2: Parse data based on import type
  const data = parseSheetData(workbook, importType);

  // Step 3: Basic data validation
  if (importType === 'departments' && data.departments.length === 0) {
    throw new Error('Excel file contains no department data');
  }
  
  if (importType === 'positions' && data.positions.length === 0) {
    throw new Error('Excel file contains no position data');
  }

  return data;
}
