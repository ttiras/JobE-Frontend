/**
 * Import Error Formatter
 * Provides detailed, actionable error messages with suggestions for fixes
 */

export type ErrorSeverity = 'error' | 'warning' | 'info'
export type ErrorCategory = 'validation' | 'format' | 'reference' | 'duplicate' | 'required' | 'constraint'

export interface ImportError {
  id: string
  severity: ErrorSeverity
  category: ErrorCategory
  sheet: 'departments' | 'positions' | 'file'
  row?: number
  column?: string
  field?: string
  value?: string | number | null
  message: string
  details?: string
  suggestion?: string
  fixAction?: ErrorFixAction
  relatedErrors?: string[] // IDs of related errors
}

export interface ErrorFixAction {
  type: 'replace' | 'remove' | 'addColumn' | 'downloadTemplate' | 'manual'
  label: string
  description?: string
  value?: string | number
}

export interface ErrorSummary {
  totalErrors: number
  totalWarnings: number
  totalInfo: number
  byCategory: Record<ErrorCategory, number>
  bySheet: Record<string, number>
  criticalErrors: ImportError[]
  canProceed: boolean
}

/**
 * Generate unique error ID
 */
function generateErrorId(
  sheet: string,
  row?: number,
  column?: string,
  category?: string
): string {
  const parts = [sheet]
  if (row !== undefined) parts.push(`r${row}`)
  if (column) parts.push(`c${column}`)
  if (category) parts.push(category)
  parts.push(Date.now().toString(36))
  return parts.join('-')
}

/**
 * Create a detailed error for missing required field
 */
export function createRequiredFieldError(
  sheet: 'departments' | 'positions',
  row: number,
  field: string,
  columnName?: string
): ImportError {
  const fieldLabels: Record<string, string> = {
    code: 'Code',
    name: 'Name',
    title: 'Title',
    department_code: 'Department Code',
  }

  const suggestions: Record<string, string> = {
    code: 'Each record must have a unique code for identification. Use format like "DEPT-001" or "POS-001".',
    name: 'Department name is required. Example: "Engineering", "Sales", "Human Resources".',
    title: 'Position title is required. Example: "Software Engineer", "Sales Manager", "HR Specialist".',
    department_code: 'Every position must belong to a department. Use the department code from the Departments sheet.',
  }

  return {
    id: generateErrorId(sheet, row, columnName, 'required'),
    severity: 'error',
    category: 'required',
    sheet,
    row,
    column: columnName,
    field,
    value: null,
    message: `Missing required field: ${fieldLabels[field] || field}`,
    details: `Row ${row} is missing a value for "${fieldLabels[field] || field}"`,
    suggestion: suggestions[field] || `Please provide a value for ${field}`,
    fixAction: {
      type: 'manual',
      label: 'Edit in Excel',
      description: 'Open the file and add the missing value',
    },
  }
}

/**
 * Create error for invalid format
 */
export function createFormatError(
  sheet: 'departments' | 'positions',
  row: number,
  field: string,
  value: string | number,
  expectedFormat: string,
  example?: string
): ImportError {
  return {
    id: generateErrorId(sheet, row, field, 'format'),
    severity: 'error',
    category: 'format',
    sheet,
    row,
    field,
    value,
    message: `Invalid format for ${field}`,
    details: `Value "${value}" does not match expected format: ${expectedFormat}`,
    suggestion: example ? `Example of valid format: ${example}` : `Please use format: ${expectedFormat}`,
    fixAction: {
      type: 'manual',
      label: 'Fix Format',
      description: 'Correct the value format in your Excel file',
    },
  }
}

/**
 * Create error for invalid reference (e.g., department code doesn't exist)
 */
export function createReferenceError(
  row: number,
  field: string,
  value: string,
  referencedSheet: string,
  availableValues?: string[]
): ImportError {
  let suggestion = `The ${field} "${value}" does not exist in the ${referencedSheet} sheet.`
  
  if (availableValues && availableValues.length > 0) {
    const closest = findClosestMatch(value, availableValues)
    if (closest) {
      suggestion += ` Did you mean "${closest}"?`
    } else {
      suggestion += ` Available values: ${availableValues.slice(0, 5).join(', ')}${availableValues.length > 5 ? '...' : ''}`
    }
  }

  return {
    id: generateErrorId('positions', row, field, 'reference'),
    severity: 'error',
    category: 'reference',
    sheet: 'positions',
    row,
    field,
    value,
    message: `Invalid reference: ${field}`,
    details: `"${value}" not found in ${referencedSheet}`,
    suggestion,
    fixAction: {
      type: 'manual',
      label: 'Correct Reference',
      description: 'Update the value to match an existing entry',
    },
  }
}

/**
 * Create error for duplicate entries
 */
export function createDuplicateError(
  sheet: 'departments' | 'positions',
  row: number,
  field: string,
  value: string,
  firstOccurrenceRow: number
): ImportError {
  return {
    id: generateErrorId(sheet, row, field, 'duplicate'),
    severity: 'error',
    category: 'duplicate',
    sheet,
    row,
    field,
    value,
    message: `Duplicate ${field}`,
    details: `"${value}" already exists at row ${firstOccurrenceRow}`,
    suggestion: `Each ${field} must be unique. Either change this value or remove the duplicate row.`,
    fixAction: {
      type: 'remove',
      label: 'Remove Duplicate',
      description: `Keep row ${firstOccurrenceRow} and remove row ${row}`,
    },
  }
}

/**
 * Create error for constraint violations (e.g., salary min > max)
 */
export function createConstraintError(
  sheet: 'departments' | 'positions',
  row: number,
  constraint: string,
  details: string,
  suggestion: string
): ImportError {
  return {
    id: generateErrorId(sheet, row, undefined, 'constraint'),
    severity: 'error',
    category: 'constraint',
    sheet,
    row,
    message: `Constraint violation: ${constraint}`,
    details,
    suggestion,
    fixAction: {
      type: 'manual',
      label: 'Fix Values',
      description: 'Adjust the values to meet the constraint',
    },
  }
}

/**
 * Create warning for data quality issues
 */
export function createDataQualityWarning(
  sheet: 'departments' | 'positions',
  row: number,
  field: string,
  value: string | number | null,
  issue: string,
  suggestion: string
): ImportError {
  return {
    id: generateErrorId(sheet, row, field, 'quality'),
    severity: 'warning',
    category: 'validation',
    sheet,
    row,
    field,
    value,
    message: `Data quality issue: ${issue}`,
    suggestion,
  }
}

/**
 * Find closest match using simple string similarity
 */
function findClosestMatch(value: string, candidates: string[]): string | null {
  if (!value || candidates.length === 0) return null

  const valueLower = value.toLowerCase()
  let bestMatch: string | null = null
  let bestScore = 0

  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase()
    
    // Exact match
    if (valueLower === candidateLower) return candidate
    
    // Contains match
    if (candidateLower.includes(valueLower) || valueLower.includes(candidateLower)) {
      return candidate
    }

    // Calculate simple similarity score
    const score = calculateSimilarity(valueLower, candidateLower)
    if (score > bestScore && score > 0.6) {
      bestScore = score
      bestMatch = candidate
    }
  }

  return bestMatch
}

/**
 * Calculate string similarity (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0

  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  
  const longerLength = longer.length
  if (longerLength === 0) return 1

  const editDistance = levenshteinDistance(longer, shorter)
  return (longerLength - editDistance) / longerLength
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Generate error summary
 */
export function generateErrorSummary(errors: ImportError[]): ErrorSummary {
  const summary: ErrorSummary = {
    totalErrors: 0,
    totalWarnings: 0,
    totalInfo: 0,
    byCategory: {
      validation: 0,
      format: 0,
      reference: 0,
      duplicate: 0,
      required: 0,
      constraint: 0,
    },
    bySheet: {},
    criticalErrors: [],
    canProceed: true,
  }

  for (const error of errors) {
    // Count by severity
    if (error.severity === 'error') {
      summary.totalErrors++
      summary.canProceed = false
    } else if (error.severity === 'warning') {
      summary.totalWarnings++
    } else {
      summary.totalInfo++
    }

    // Count by category
    summary.byCategory[error.category]++

    // Count by sheet
    summary.bySheet[error.sheet] = (summary.bySheet[error.sheet] || 0) + 1

    // Track critical errors (required fields, references)
    if (
      error.severity === 'error' &&
      (error.category === 'required' || error.category === 'reference')
    ) {
      summary.criticalErrors.push(error)
    }
  }

  return summary
}

/**
 * Group errors by row
 */
export function groupErrorsByRow(
  errors: ImportError[]
): Map<string, ImportError[]> {
  const grouped = new Map<string, ImportError[]>()

  for (const error of errors) {
    const key = `${error.sheet}-${error.row ?? 'file'}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(error)
  }

  return grouped
}

/**
 * Group errors by category
 */
export function groupErrorsByCategory(
  errors: ImportError[]
): Map<ErrorCategory, ImportError[]> {
  const grouped = new Map<ErrorCategory, ImportError[]>()

  for (const error of errors) {
    if (!grouped.has(error.category)) {
      grouped.set(error.category, [])
    }
    grouped.get(error.category)!.push(error)
  }

  return grouped
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: ImportError): string {
  let message = error.message

  if (error.row !== undefined) {
    message = `Row ${error.row}: ${message}`
  }

  if (error.column) {
    message += ` (Column: ${error.column})`
  }

  if (error.value !== null && error.value !== undefined) {
    message += ` - Value: "${error.value}"`
  }

  return message
}

/**
 * Get error icon/color based on severity
 */
export function getErrorStyle(severity: ErrorSeverity): {
  color: string
  bgColor: string
  borderColor: string
  icon: string
} {
  switch (severity) {
    case 'error':
      return {
        color: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: 'alert-circle',
      }
    case 'warning':
      return {
        color: 'text-yellow-700 dark:text-yellow-300',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: 'alert-triangle',
      }
    case 'info':
      return {
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: 'info',
      }
  }
}

/**
 * Get category label
 */
export function getCategoryLabel(category: ErrorCategory): string {
  const labels: Record<ErrorCategory, string> = {
    validation: 'Validation',
    format: 'Format',
    reference: 'Reference',
    duplicate: 'Duplicate',
    required: 'Required Field',
    constraint: 'Constraint',
  }
  return labels[category]
}
