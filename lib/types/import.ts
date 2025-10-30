/**
 * Type definitions for Excel Import feature
 * Defines data structures for import preview, validation, and execution
 */

// ============================================================================
// Enums
// ============================================================================

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

export enum ValidationStatus {
  VALID = 'VALID',
  ERRORS = 'ERRORS',
}

export enum ErrorType {
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  MISSING_SHEET = 'MISSING_SHEET',
  MISSING_COLUMN = 'MISSING_COLUMN',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  DUPLICATE_CODE_IN_FILE = 'DUPLICATE_CODE_IN_FILE',
  DUPLICATE_CODE_IN_DATABASE = 'DUPLICATE_CODE_IN_DATABASE',
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  INVALID_JSON = 'INVALID_JSON',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  BUSINESS_RULE = 'BUSINESS_RULE', // Business logic warnings (e.g., multiple root departments)
}

export enum ErrorSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

export enum SheetType {
  DEPARTMENTS = 'DEPARTMENTS',
  POSITIONS = 'POSITIONS',
}

// ============================================================================
// Core Data Structures
// ============================================================================

/**
 * Department preview from Excel file
 */
export interface DepartmentPreview {
  operation: OperationType;
  dept_code: string;
  name: string;
  parent_dept_code?: string | null;
  metadata?: Record<string, unknown> | null;
  excelRow: number;
}

/**
 * Position preview from Excel file
 */
export interface PositionPreview {
  operation: OperationType;
  pos_code: string;
  title: string;
  dept_code: string;
  reports_to_pos_code?: string | null;
  is_manager: boolean;
  incumbents_count: number;
  excelRow: number;
}

/**
 * Summary statistics for a single entity type
 */
export interface EntitySummary {
  total: number;
  creates: number;
  updates: number;
}

/**
 * Overall import summary
 */
export interface ImportSummary {
  totalRows: number;
  departments: EntitySummary;
  positions: EntitySummary;
}

/**
 * Complete import preview with data and validation status
 */
export interface ImportPreview {
  summary: ImportSummary;
  departments: DepartmentPreview[];
  positions: PositionPreview[];
  validationStatus: ValidationStatus;
}

/**
 * Validation error with context
 */
export interface ValidationError {
  type: ErrorType;
  severity: ErrorSeverity;
  row: number;
  sheet: SheetType;
  column?: string;
  message: string;
  suggestion?: string;
  affectedCodes?: string[];
}

/**
 * Result of import execution
 */
export interface ImportResult {
  departmentsCreated: number;
  departmentsUpdated: number;
  positionsCreated: number;
  positionsUpdated: number;
  totalDepartments: number;
  totalPositions: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Input for parseImportFile mutation
 */
export interface ParseImportFileInput {
  fileId: string;
  organizationId: string;
}

/**
 * Output from parseImportFile mutation
 */
export interface ParseImportFileOutput {
  success: boolean;
  preview?: ImportPreview;
  errors: ValidationError[];
}

/**
 * Input for confirmImport mutation
 */
export interface ConfirmImportInput {
  fileId: string;
  organizationId: string;
}

/**
 * Output from confirmImport mutation
 */
export interface ConfirmImportOutput {
  success: boolean;
  result?: ImportResult;
  error?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Import workflow states
 */
export enum ImportWorkflowState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PARSING = 'PARSING',
  PREVIEW = 'PREVIEW',
  CONFIRMING = 'CONFIRMING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

/**
 * Import workflow context
 */
export interface ImportWorkflowContext {
  state: ImportWorkflowState;
  fileId?: string;
  fileName?: string;
  fileBuffer?: ArrayBuffer; // For client-side processing
  parsedData?: ExcelData; // Parsed Excel data
  preview?: ImportPreview;
  errors: ValidationError[];
  result?: ImportResult;
  errorMessage?: string;
}

// ============================================================================
// Excel Parsing Types
// ============================================================================

/**
 * Raw department row from Excel
 */
export interface DepartmentRow {
  dept_code: string;
  name: string;
  parent_dept_code?: string | null;
  metadata?: string | Record<string, unknown> | null; // JSON string or parsed object
  excelRow: number; // For error reporting
}

/**
 * Raw position row from Excel
 */
export interface PositionRow {
  pos_code: string;
  title: string;
  dept_code: string;
  reports_to_pos_code?: string | null; // Position code (will be resolved to UUID during import)
  is_manager: boolean;
  incumbents_count: number;
  excelRow: number; // For error reporting
}

/**
 * Parsed Excel workbook data
 */
export interface ExcelData {
  departments: DepartmentRow[];
  positions: PositionRow[];
}

/**
 * Validation context for Excel data
 */
export interface ValidationContext {
  departments: DepartmentRow[];
  positions: PositionRow[];
  validDepartmentCodes: Set<string>; // All valid dept codes (file + DB)
  validPositionCodes: Set<string>; // All valid pos codes (file + DB)
  existingDepartmentCodes: Set<string>; // Codes already in database
  existingPositionCodes: Set<string>; // Codes already in database
}
