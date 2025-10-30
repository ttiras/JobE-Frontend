import * as XLSX from 'xlsx'

// Validation result types
export interface FileValidationResult {
  isValid: boolean
  errors: FileValidationError[]
  warnings: FileValidationWarning[]
  metadata?: FileMetadata
}

export interface FileValidationError {
  type: 'file' | 'sheet' | 'column' | 'data'
  severity: 'error'
  message: string
  details?: string
  suggestion?: string
}

export interface FileValidationWarning {
  type: 'file' | 'sheet' | 'column' | 'data'
  severity: 'warning'
  message: string
  details?: string
  suggestion?: string
}

export interface FileMetadata {
  fileName: string
  fileSize: number
  fileSizeFormatted: string
  sheetCount: number
  sheetNames: string[]
  departmentCount?: number
  positionCount?: number
  estimatedProcessingTime?: number // in seconds
}

// Expected sheet structure
const REQUIRED_SHEETS = {
  departments: {
    name: 'Departments',
    alternateNames: ['departments', 'dept', 'Dept'],
    requiredColumns: ['code', 'name'],
    optionalColumns: ['description', 'parent_code', 'parent_department_code'],
  },
  positions: {
    name: 'Positions',
    alternateNames: ['positions', 'pos', 'Pos'],
    requiredColumns: ['code', 'title', 'department_code'],
    optionalColumns: [
      'description',
      'employment_type',
      'location',
      'salary_min',
      'salary_max',
      'salary_currency',
    ],
  },
}

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MIN_FILE_SIZE = 100 // 100 bytes
const MAX_ROWS_PER_SHEET = 10000
const WARN_ROWS_THRESHOLD = 1000

// Supported file formats
const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.xlsm']
const SUPPORTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
]

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Estimate processing time based on row count
 */
function estimateProcessingTime(rowCount: number): number {
  // Rough estimate: 1000 rows per second
  return Math.ceil(rowCount / 1000)
}

/**
 * Normalize sheet name for comparison (case-insensitive, trim whitespace)
 */
function normalizeSheetName(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Normalize column name for comparison
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Find sheet by name (supports alternate names)
 */
function findSheet(
  workbook: XLSX.WorkBook,
  sheetConfig: typeof REQUIRED_SHEETS.departments
): XLSX.WorkSheet | null {
  const normalizedSheetNames = workbook.SheetNames.map(normalizeSheetName)
  const searchNames = [sheetConfig.name, ...sheetConfig.alternateNames].map(
    normalizeSheetName
  )

  for (const searchName of searchNames) {
    const index = normalizedSheetNames.indexOf(searchName)
    if (index !== -1) {
      return workbook.Sheets[workbook.SheetNames[index]]
    }
  }

  return null
}

/**
 * Get column names from sheet
 */
function getColumnNames(sheet: XLSX.WorkSheet): string[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const columnNames: string[] = []

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col })
    const cell = sheet[cellAddress]
    if (cell && cell.v) {
      columnNames.push(normalizeColumnName(String(cell.v)))
    }
  }

  return columnNames
}

/**
 * Count data rows in sheet (excluding header)
 */
function countDataRows(sheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  return Math.max(0, range.e.r - range.s.r)
}

/**
 * Validate file before parsing
 */
export async function validateExcelFile(
  file: File
): Promise<FileValidationResult> {
  const errors: FileValidationError[] = []
  const warnings: FileValidationWarning[] = []

  // Step 1: Validate file basics
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      type: 'file',
      severity: 'error',
      message: `File size exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`,
      details: `Your file is ${formatFileSize(file.size)}`,
      suggestion: 'Please split your data into smaller files or remove unnecessary data',
    })
  }

  if (file.size < MIN_FILE_SIZE) {
    errors.push({
      type: 'file',
      severity: 'error',
      message: 'File appears to be empty or corrupted',
      details: `File size is only ${formatFileSize(file.size)}`,
      suggestion: 'Please check your file and try again',
    })
  }

  // Check file extension
  const fileName = file.name.toLowerCase()
  const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext)
  )
  if (!hasValidExtension) {
    errors.push({
      type: 'file',
      severity: 'error',
      message: 'Unsupported file format',
      details: `File must be one of: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      suggestion: 'Please save your file as .xlsx or .xls format',
    })
  }

  // Check MIME type
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    warnings.push({
      type: 'file',
      severity: 'warning',
      message: 'File MIME type may not be correct',
      details: `Detected MIME type: ${file.type}`,
      suggestion: 'If you experience issues, try re-saving the file in Excel',
    })
  }

  // If basic validation fails, return early
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileSizeFormatted: formatFileSize(file.size),
        sheetCount: 0,
        sheetNames: [],
      },
    }
  }

  // Step 2: Read and validate Excel structure
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    const metadata: FileMetadata = {
      fileName: file.name,
      fileSize: file.size,
      fileSizeFormatted: formatFileSize(file.size),
      sheetCount: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames,
    }

    // Check if workbook has sheets
    if (workbook.SheetNames.length === 0) {
      errors.push({
        type: 'file',
        severity: 'error',
        message: 'File contains no sheets',
        suggestion: 'Please ensure your Excel file contains at least one sheet',
      })
      return { isValid: false, errors, warnings, metadata }
    }

    // Step 3: Validate required sheets
    const departmentSheet = findSheet(workbook, REQUIRED_SHEETS.departments)
    const positionSheet = findSheet(workbook, REQUIRED_SHEETS.positions)

    if (!departmentSheet && !positionSheet) {
      errors.push({
        type: 'sheet',
        severity: 'error',
        message: 'Missing required sheets',
        details: `Expected sheets: "${REQUIRED_SHEETS.departments.name}" and/or "${REQUIRED_SHEETS.positions.name}"`,
        suggestion:
          'Please use the provided template or ensure your sheets are named correctly',
      })
      return { isValid: false, errors, warnings, metadata }
    }

    // Step 4: Validate department sheet (if present)
    if (departmentSheet) {
      const deptColumns = getColumnNames(departmentSheet)
      const deptRowCount = countDataRows(departmentSheet)

      metadata.departmentCount = deptRowCount

      // Check required columns
      const missingDeptColumns = REQUIRED_SHEETS.departments.requiredColumns.filter(
        (col) => !deptColumns.includes(normalizeColumnName(col))
      )

      if (missingDeptColumns.length > 0) {
        errors.push({
          type: 'column',
          severity: 'error',
          message: 'Missing required columns in Departments sheet',
          details: `Missing: ${missingDeptColumns.join(', ')}`,
          suggestion: 'Please add the missing columns or use the template',
        })
      }

      // Check row count
      if (deptRowCount === 0) {
        warnings.push({
          type: 'data',
          severity: 'warning',
          message: 'Departments sheet is empty',
          suggestion: 'Add at least one department to proceed',
        })
      }

      if (deptRowCount > MAX_ROWS_PER_SHEET) {
        errors.push({
          type: 'data',
          severity: 'error',
          message: `Too many rows in Departments sheet (${deptRowCount})`,
          details: `Maximum allowed: ${MAX_ROWS_PER_SHEET}`,
          suggestion: 'Please split your data into multiple imports',
        })
      } else if (deptRowCount > WARN_ROWS_THRESHOLD) {
        warnings.push({
          type: 'data',
          severity: 'warning',
          message: `Large number of departments (${deptRowCount})`,
          details: `Processing time: approximately ${estimateProcessingTime(deptRowCount)} seconds`,
          suggestion: 'Consider importing in smaller batches for better performance',
        })
      }
    } else {
      warnings.push({
        type: 'sheet',
        severity: 'warning',
        message: 'Departments sheet not found',
        suggestion: 'Only positions will be imported',
      })
    }

    // Step 5: Validate position sheet (if present)
    if (positionSheet) {
      const posColumns = getColumnNames(positionSheet)
      const posRowCount = countDataRows(positionSheet)

      metadata.positionCount = posRowCount

      // Check required columns
      const missingPosColumns = REQUIRED_SHEETS.positions.requiredColumns.filter(
        (col) => !posColumns.includes(normalizeColumnName(col))
      )

      if (missingPosColumns.length > 0) {
        errors.push({
          type: 'column',
          severity: 'error',
          message: 'Missing required columns in Positions sheet',
          details: `Missing: ${missingPosColumns.join(', ')}`,
          suggestion: 'Please add the missing columns or use the template',
        })
      }

      // Check row count
      if (posRowCount === 0) {
        warnings.push({
          type: 'data',
          severity: 'warning',
          message: 'Positions sheet is empty',
          suggestion: 'Add at least one position to proceed',
        })
      }

      if (posRowCount > MAX_ROWS_PER_SHEET) {
        errors.push({
          type: 'data',
          severity: 'error',
          message: `Too many rows in Positions sheet (${posRowCount})`,
          details: `Maximum allowed: ${MAX_ROWS_PER_SHEET}`,
          suggestion: 'Please split your data into multiple imports',
        })
      } else if (posRowCount > WARN_ROWS_THRESHOLD) {
        warnings.push({
          type: 'data',
          severity: 'warning',
          message: `Large number of positions (${posRowCount})`,
          details: `Processing time: approximately ${estimateProcessingTime(posRowCount)} seconds`,
          suggestion: 'Consider importing in smaller batches for better performance',
        })
      }
    } else {
      warnings.push({
        type: 'sheet',
        severity: 'warning',
        message: 'Positions sheet not found',
        suggestion: 'Only departments will be imported',
      })
    }

    // Calculate total estimated processing time
    const totalRows = (metadata.departmentCount || 0) + (metadata.positionCount || 0)
    metadata.estimatedProcessingTime = estimateProcessingTime(totalRows)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    }
  } catch (error) {
    errors.push({
      type: 'file',
      severity: 'error',
      message: 'Failed to read Excel file',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'File may be corrupted. Please try opening it in Excel and re-saving',
    })

    return {
      isValid: false,
      errors,
      warnings,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileSizeFormatted: formatFileSize(file.size),
        sheetCount: 0,
        sheetNames: [],
      },
    }
  }
}

/**
 * Quick validation (checks only file basics without reading content)
 * Use this for immediate feedback before full validation
 */
export function quickValidateFile(file: File): {
  isValid: boolean
  errors: FileValidationError[]
} {
  const errors: FileValidationError[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      type: 'file',
      severity: 'error',
      message: `File too large (${formatFileSize(file.size)})`,
      details: `Maximum: ${formatFileSize(MAX_FILE_SIZE)}`,
      suggestion: 'Please use a smaller file',
    })
  }

  if (file.size < MIN_FILE_SIZE) {
    errors.push({
      type: 'file',
      severity: 'error',
      message: 'File is empty or corrupted',
      suggestion: 'Please check your file',
    })
  }

  // Check extension
  const fileName = file.name.toLowerCase()
  const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext)
  )
  if (!hasValidExtension) {
    errors.push({
      type: 'file',
      severity: 'error',
      message: 'Invalid file format',
      details: `Expected: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      suggestion: 'Please upload an Excel file',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
