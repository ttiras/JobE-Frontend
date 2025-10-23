/**
 * GraphQL Input Validation
 * 
 * Validates GraphQL mutation inputs before sending to the server.
 * Provides client-side validation for common data types and constraints.
 * 
 * Features:
 * - Type validation
 * - Required field validation
 * - Format validation (email, URL, UUID)
 * - Range validation (min/max)
 * - Custom validation rules
 */

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate organization input
 */
export function validateOrganizationInput(input: any): ValidationResult {
  const errors: ValidationError[] = []

  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Organization name is required' })
  }

  if (input.name && input.name.length > 200) {
    errors.push({ field: 'name', message: 'Organization name must be less than 200 characters' })
  }

  if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
    errors.push({ field: 'slug', message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  }

  if (input.website && !isValidUrl(input.website)) {
    errors.push({ field: 'website', message: 'Invalid website URL' })
  }

  if (input.employeeCount && (typeof input.employeeCount !== 'number' || input.employeeCount < 1)) {
    errors.push({ field: 'employeeCount', message: 'Employee count must be a positive number' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate department input
 */
export function validateDepartmentInput(input: any): ValidationResult {
  const errors: ValidationError[] = []

  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Department name is required' })
  }

  if (input.name && input.name.length > 200) {
    errors.push({ field: 'name', message: 'Department name must be less than 200 characters' })
  }

  if (!input.organizationId || !isValidUUID(input.organizationId)) {
    errors.push({ field: 'organizationId', message: 'Valid organization ID is required' })
  }

  if (input.parentDepartmentId && !isValidUUID(input.parentDepartmentId)) {
    errors.push({ field: 'parentDepartmentId', message: 'Invalid parent department ID' })
  }

  if (input.managerId && !isValidUUID(input.managerId)) {
    errors.push({ field: 'managerId', message: 'Invalid manager ID' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate position input
 */
export function validatePositionInput(input: any): ValidationResult {
  const errors: ValidationError[] = []

  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Position title is required' })
  }

  if (input.title && input.title.length > 200) {
    errors.push({ field: 'title', message: 'Position title must be less than 200 characters' })
  }

  if (!input.organizationId || !isValidUUID(input.organizationId)) {
    errors.push({ field: 'organizationId', message: 'Valid organization ID is required' })
  }

  if (input.departmentId && !isValidUUID(input.departmentId)) {
    errors.push({ field: 'departmentId', message: 'Invalid department ID' })
  }

  if (input.salaryMin && (typeof input.salaryMin !== 'number' || input.salaryMin < 0)) {
    errors.push({ field: 'salaryMin', message: 'Minimum salary must be a non-negative number' })
  }

  if (input.salaryMax && (typeof input.salaryMax !== 'number' || input.salaryMax < 0)) {
    errors.push({ field: 'salaryMax', message: 'Maximum salary must be a non-negative number' })
  }

  if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
    errors.push({ field: 'salaryMax', message: 'Maximum salary must be greater than minimum salary' })
  }

  const validEmploymentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY']
  if (input.employmentType && !validEmploymentTypes.includes(input.employmentType)) {
    errors.push({ field: 'employmentType', message: 'Invalid employment type' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate organization member input
 */
export function validateOrganizationMemberInput(input: any): ValidationResult {
  const errors: ValidationError[] = []

  if (!input.organizationId || !isValidUUID(input.organizationId)) {
    errors.push({ field: 'organizationId', message: 'Valid organization ID is required' })
  }

  if (!input.userId || !isValidUUID(input.userId)) {
    errors.push({ field: 'userId', message: 'Valid user ID is required' })
  }

  const validRoles = ['owner', 'admin', 'member', 'viewer']
  if (!input.role || !validRoles.includes(input.role)) {
    errors.push({ field: 'role', message: 'Valid role is required (owner, admin, member, or viewer)' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generic validation helper
 * Throws error if validation fails
 */
export function validateOrThrow(result: ValidationResult): void {
  if (!result.isValid) {
    const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join(', ')
    throw new Error(`Validation failed: ${errorMessages}`)
  }
}
