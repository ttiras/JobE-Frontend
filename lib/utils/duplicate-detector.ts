/**
 * Duplicate Detection and Resolution
 * Detects duplicates in import data and provides resolution strategies
 */

export type DuplicateResolutionStrategy =
  | 'keep-first'
  | 'keep-last'
  | 'keep-all'
  | 'merge'
  | 'manual'

export type DuplicateField = 'code' | 'name' | 'title' | 'composite'

export interface DuplicateEntry {
  field: DuplicateField
  value: string
  rows: DuplicateRowInfo[]
  recommendedStrategy: DuplicateResolutionStrategy
  reason?: string
}

export interface DuplicateRowInfo {
  rowNumber: number
  data: Record<string, any>
  isComplete: boolean // Has all required fields
  completeness: number // 0-100 percentage of filled fields
  hasDescription: boolean
  differences?: string[] // Fields that differ from other duplicates
}

export interface DuplicateGroup {
  sheet: 'departments' | 'positions'
  duplicates: DuplicateEntry[]
  totalDuplicates: number
  affectedRows: number
}

export interface DuplicateResolution {
  field: DuplicateField
  value: string
  strategy: DuplicateResolutionStrategy
  keepRows: number[]
  removeRows: number[]
  mergedData?: Record<string, any>
}

export interface DuplicateDetectionResult {
  hasDuplicates: boolean
  departments: DuplicateGroup
  positions: DuplicateGroup
  totalDuplicates: number
  totalAffectedRows: number
  autoResolvable: number // Number of duplicates that can be auto-resolved
}

/**
 * Calculate row completeness (percentage of non-empty fields)
 */
function calculateCompleteness(data: Record<string, any>): number {
  const fields = Object.keys(data)
  if (fields.length === 0) return 0

  const filledFields = fields.filter(
    (key) => data[key] !== null && data[key] !== undefined && data[key] !== ''
  ).length

  return Math.round((filledFields / fields.length) * 100)
}

/**
 * Check if row has all required fields
 */
function isRowComplete(
  data: Record<string, any>,
  requiredFields: string[]
): boolean {
  return requiredFields.every(
    (field) => data[field] !== null && data[field] !== undefined && data[field] !== ''
  )
}

/**
 * Find differences between two data objects
 */
function findDifferences(
  data1: Record<string, any>,
  data2: Record<string, any>
): string[] {
  const differences: string[] = []
  const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)])

  for (const key of allKeys) {
    if (data1[key] !== data2[key]) {
      differences.push(key)
    }
  }

  return differences
}

/**
 * Detect duplicate departments by code
 */
export function detectDuplicateDepartments(
  departments: Array<{ row: number; code: string; name: string; [key: string]: any }>
): DuplicateEntry[] {
  const duplicates: DuplicateEntry[] = []
  const seen = new Map<string, DuplicateRowInfo[]>()
  const requiredFields = ['code', 'name']

  // Group by code
  for (const dept of departments) {
    const code = dept.code?.toString().trim().toLowerCase()
    if (!code) continue

    const rowInfo: DuplicateRowInfo = {
      rowNumber: dept.row,
      data: dept,
      isComplete: isRowComplete(dept, requiredFields),
      completeness: calculateCompleteness(dept),
      hasDescription: !!dept.description,
      differences: [],
    }

    if (!seen.has(code)) {
      seen.set(code, [])
    }
    seen.get(code)!.push(rowInfo)
  }

  // Identify duplicates
  for (const [code, rows] of seen.entries()) {
    if (rows.length > 1) {
      // Calculate differences
      for (let i = 0; i < rows.length; i++) {
        const differences: string[] = []
        for (let j = 0; j < rows.length; j++) {
          if (i !== j) {
            const diffs = findDifferences(rows[i].data, rows[j].data)
            diffs.forEach((diff) => {
              if (!differences.includes(diff)) {
                differences.push(diff)
              }
            })
          }
        }
        rows[i].differences = differences.filter((d) => d !== 'row')
      }

      // Determine recommended strategy
      const allIdentical = rows.every(
        (row) => !row.differences || row.differences.length === 0
      )
      const hasComplete = rows.some((row) => row.isComplete)

      let strategy: DuplicateResolutionStrategy
      let reason: string | undefined

      if (allIdentical) {
        strategy = 'keep-first'
        reason = 'All entries are identical'
      } else if (hasComplete) {
        const completeRows = rows.filter((row) => row.isComplete)
        if (completeRows.length === 1) {
          strategy = 'keep-first' // Keep the most complete one
          reason = 'One entry is more complete than others'
        } else {
          strategy = 'merge'
          reason = 'Multiple complete entries with different data'
        }
      } else {
        strategy = 'merge'
        reason = 'Entries have different information that should be combined'
      }

      duplicates.push({
        field: 'code',
        value: rows[0].data.code,
        rows: rows.sort((a, b) => b.completeness - a.completeness),
        recommendedStrategy: strategy,
        reason,
      })
    }
  }

  return duplicates
}

/**
 * Detect duplicate positions by code
 */
export function detectDuplicatePositions(
  positions: Array<{ row: number; code: string; title: string; [key: string]: any }>
): DuplicateEntry[] {
  const duplicates: DuplicateEntry[] = []
  const seen = new Map<string, DuplicateRowInfo[]>()
  const requiredFields = ['code', 'title', 'department_code']

  // Group by code
  for (const pos of positions) {
    const code = pos.code?.toString().trim().toLowerCase()
    if (!code) continue

    const rowInfo: DuplicateRowInfo = {
      rowNumber: pos.row,
      data: pos,
      isComplete: isRowComplete(pos, requiredFields),
      completeness: calculateCompleteness(pos),
      hasDescription: !!pos.description,
      differences: [],
    }

    if (!seen.has(code)) {
      seen.set(code, [])
    }
    seen.get(code)!.push(rowInfo)
  }

  // Identify duplicates
  for (const [code, rows] of seen.entries()) {
    if (rows.length > 1) {
      // Calculate differences
      for (let i = 0; i < rows.length; i++) {
        const differences: string[] = []
        for (let j = 0; j < rows.length; j++) {
          if (i !== j) {
            const diffs = findDifferences(rows[i].data, rows[j].data)
            diffs.forEach((diff) => {
              if (!differences.includes(diff)) {
                differences.push(diff)
              }
            })
          }
        }
        rows[i].differences = differences.filter((d) => d !== 'row')
      }

      // Determine recommended strategy
      const allIdentical = rows.every(
        (row) => !row.differences || row.differences.length === 0
      )
      const hasComplete = rows.some((row) => row.isComplete)

      let strategy: DuplicateResolutionStrategy
      let reason: string | undefined

      if (allIdentical) {
        strategy = 'keep-first'
        reason = 'All entries are identical'
      } else if (hasComplete) {
        const completeRows = rows.filter((row) => row.isComplete)
        if (completeRows.length === 1) {
          strategy = 'keep-first'
          reason = 'One entry is more complete than others'
        } else {
          strategy = 'merge'
          reason = 'Multiple complete entries with different data'
        }
      } else {
        strategy = 'merge'
        reason = 'Entries have different information that should be combined'
      }

      duplicates.push({
        field: 'code',
        value: rows[0].data.code,
        rows: rows.sort((a, b) => b.completeness - a.completeness),
        recommendedStrategy: strategy,
        reason,
      })
    }
  }

  return duplicates
}

/**
 * Detect all duplicates in import data
 */
export function detectDuplicates(data: {
  departments: Array<{ row: number; code: string; name: string; [key: string]: any }>
  positions: Array<{ row: number; code: string; title: string; [key: string]: any }>
}): DuplicateDetectionResult {
  const deptDuplicates = detectDuplicateDepartments(data.departments)
  const posDuplicates = detectDuplicatePositions(data.positions)

  const deptAffectedRows = deptDuplicates.reduce(
    (sum, dup) => sum + dup.rows.length,
    0
  )
  const posAffectedRows = posDuplicates.reduce(
    (sum, dup) => sum + dup.rows.length,
    0
  )

  const autoResolvable =
    deptDuplicates.filter(
      (d) => d.recommendedStrategy === 'keep-first' || d.recommendedStrategy === 'keep-last'
    ).length +
    posDuplicates.filter(
      (d) => d.recommendedStrategy === 'keep-first' || d.recommendedStrategy === 'keep-last'
    ).length

  return {
    hasDuplicates: deptDuplicates.length > 0 || posDuplicates.length > 0,
    departments: {
      sheet: 'departments',
      duplicates: deptDuplicates,
      totalDuplicates: deptDuplicates.length,
      affectedRows: deptAffectedRows,
    },
    positions: {
      sheet: 'positions',
      duplicates: posDuplicates,
      totalDuplicates: posDuplicates.length,
      affectedRows: posAffectedRows,
    },
    totalDuplicates: deptDuplicates.length + posDuplicates.length,
    totalAffectedRows: deptAffectedRows + posAffectedRows,
    autoResolvable,
  }
}

/**
 * Apply resolution strategy to duplicate entry
 */
export function resolveDuplicate(
  duplicate: DuplicateEntry,
  strategy: DuplicateResolutionStrategy
): DuplicateResolution {
  const resolution: DuplicateResolution = {
    field: duplicate.field,
    value: duplicate.value,
    strategy,
    keepRows: [],
    removeRows: [],
  }

  switch (strategy) {
    case 'keep-first':
      resolution.keepRows = [duplicate.rows[0].rowNumber]
      resolution.removeRows = duplicate.rows.slice(1).map((r) => r.rowNumber)
      break

    case 'keep-last':
      resolution.keepRows = [duplicate.rows[duplicate.rows.length - 1].rowNumber]
      resolution.removeRows = duplicate.rows
        .slice(0, -1)
        .map((r) => r.rowNumber)
      break

    case 'keep-all':
      resolution.keepRows = duplicate.rows.map((r) => r.rowNumber)
      resolution.removeRows = []
      break

    case 'merge':
      // Keep the most complete row and merge data
      const mostComplete = duplicate.rows.reduce((best, current) =>
        current.completeness > best.completeness ? current : best
      )
      resolution.keepRows = [mostComplete.rowNumber]
      resolution.removeRows = duplicate.rows
        .filter((r) => r.rowNumber !== mostComplete.rowNumber)
        .map((r) => r.rowNumber)

      // Merge data from all rows
      const merged: Record<string, any> = { ...mostComplete.data }
      for (const row of duplicate.rows) {
        for (const [key, value] of Object.entries(row.data)) {
          // Fill in missing fields from other rows
          if (
            (merged[key] === null || merged[key] === undefined || merged[key] === '') &&
            value !== null &&
            value !== undefined &&
            value !== ''
          ) {
            merged[key] = value
          }
        }
      }
      resolution.mergedData = merged
      break

    case 'manual':
      // User will decide manually
      resolution.keepRows = duplicate.rows.map((r) => r.rowNumber)
      resolution.removeRows = []
      break
  }

  return resolution
}

/**
 * Auto-resolve all duplicates with recommended strategies
 */
export function autoResolveAll(
  detectionResult: DuplicateDetectionResult
): DuplicateResolution[] {
  const resolutions: DuplicateResolution[] = []

  // Resolve department duplicates
  for (const duplicate of detectionResult.departments.duplicates) {
    resolutions.push(resolveDuplicate(duplicate, duplicate.recommendedStrategy))
  }

  // Resolve position duplicates
  for (const duplicate of detectionResult.positions.duplicates) {
    resolutions.push(resolveDuplicate(duplicate, duplicate.recommendedStrategy))
  }

  return resolutions
}

/**
 * Get strategy label for display
 */
export function getStrategyLabel(strategy: DuplicateResolutionStrategy): string {
  const labels: Record<DuplicateResolutionStrategy, string> = {
    'keep-first': 'Keep First',
    'keep-last': 'Keep Last',
    'keep-all': 'Keep All',
    merge: 'Merge Data',
    manual: 'Manual Review',
  }
  return labels[strategy]
}

/**
 * Get strategy description
 */
export function getStrategyDescription(strategy: DuplicateResolutionStrategy): string {
  const descriptions: Record<DuplicateResolutionStrategy, string> = {
    'keep-first': 'Keep the first occurrence and remove all others',
    'keep-last': 'Keep the last occurrence and remove all others',
    'keep-all': 'Import all duplicates (will create multiple records)',
    merge: 'Combine data from all duplicates into one complete record',
    manual: 'Review and decide manually for each duplicate',
  }
  return descriptions[strategy]
}
