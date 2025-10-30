/**
 * Demo component showing error display with sample errors
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ImportErrorDisplay,
  ImportErrorSummaryBadge,
} from '@/components/import/import-error-display'
import {
  type ImportError,
  createRequiredFieldError,
  createFormatError,
  createReferenceError,
  createDuplicateError,
  createConstraintError,
  createDataQualityWarning,
  generateErrorSummary,
} from '@/lib/utils/import-error-formatter'

export function ImportErrorDisplayDemo() {
  // Sample errors for demonstration
  const sampleErrors: ImportError[] = [
    // Required field errors
    createRequiredFieldError('departments', 5, 'code', 'Department Code'),
    createRequiredFieldError('positions', 12, 'title', 'Position Title'),
    createRequiredFieldError('positions', 15, 'department_code', 'Department Code'),
    
    // Format errors
    createFormatError(
      'positions',
      8,
      'salary_min',
      'abc123',
      'numeric',
      '50000'
    ),
    createFormatError(
      'departments',
      3,
      'code',
      'DEPT 001',
      'no spaces, alphanumeric with hyphens',
      'DEPT-001'
    ),
    
    // Reference errors
    createReferenceError(
      20,
      'department_code',
      'IT-DEPT',
      'Departments',
      ['ENG-001', 'SALES-001', 'HR-001', 'FIN-001']
    ),
    createReferenceError(
      25,
      'department_code',
      'MARKETING',
      'Departments',
      ['ENG-001', 'SALES-001', 'MKTG-001']
    ),
    
    // Duplicate errors
    createDuplicateError('departments', 10, 'code', 'ENG-001', 2),
    createDuplicateError('positions', 18, 'code', 'POS-123', 14),
    
    // Constraint errors
    createConstraintError(
      'positions',
      22,
      'Salary range',
      'Minimum salary (80000) is greater than maximum salary (70000)',
      'Ensure minimum salary is less than or equal to maximum salary'
    ),
    
    // Warnings
    createDataQualityWarning(
      'departments',
      7,
      'description',
      null,
      'Missing description',
      'Adding a description helps users understand the department purpose'
    ),
    createDataQualityWarning(
      'positions',
      30,
      'location',
      null,
      'Missing location',
      'Consider adding location information for better position details'
    ),
    createDataQualityWarning(
      'positions',
      35,
      'salary_min',
      25000,
      'Unusually low salary',
      'This salary seems low for the position. Please verify the amount is correct.'
    ),
  ]

  const [errors, setErrors] = useState<ImportError[]>(sampleErrors)
  const [showErrorDisplay, setShowErrorDisplay] = useState(true)
  const summary = generateErrorSummary(errors)

  const handleDismiss = (errorId: string) => {
    setErrors(errors.filter(e => e.id !== errorId))
  }

  const handleFixAction = (error: ImportError) => {
    console.log('Fix action for error:', error)
    alert(`Fix action: ${error.fixAction?.label}\n${error.fixAction?.description || ''}`)
  }

  const resetErrors = () => {
    setErrors(sampleErrors)
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Display Demo</CardTitle>
          <CardDescription>
            Demonstration of comprehensive error messaging with row/field level details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quick Summary:</span>
              <ImportErrorSummaryBadge
                summary={summary}
                onClick={() => setShowErrorDisplay(!showErrorDisplay)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={resetErrors}>
              Reset Errors
            </Button>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold text-red-600">
                {summary.totalErrors}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold text-yellow-600">
                {summary.totalWarnings}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold">
                {summary.criticalErrors.length}
              </div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold">
                {summary.canProceed ? '✓' : '✗'}
              </div>
              <div className="text-sm text-muted-foreground">Can Proceed</div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-sm font-medium mb-2">By Category:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(summary.byCategory).map(([category, count]) => (
                count > 0 && (
                  <div key={category} className="p-2 rounded border text-sm">
                    <span className="font-medium">{category}:</span> {count}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Sheet Breakdown */}
          <div>
            <h4 className="text-sm font-medium mb-2">By Sheet:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(summary.bySheet).map(([sheet, count]) => (
                <div key={sheet} className="p-2 rounded border text-sm">
                  <span className="font-medium">{sheet}:</span> {count}
                </div>
              ))}
            </div>
          </div>

          {/* Toggle button */}
          <Button
            variant="outline"
            onClick={() => setShowErrorDisplay(!showErrorDisplay)}
            className="w-full"
          >
            {showErrorDisplay ? 'Hide' : 'Show'} Detailed Error Display
          </Button>
        </CardContent>
      </Card>

      {/* Full Error Display */}
      {showErrorDisplay && (
        <ImportErrorDisplay
          errors={errors}
          summary={summary}
          onDismiss={handleDismiss}
          onFixAction={handleFixAction}
          maxHeight="600px"
        />
      )}

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Row-level precision:</strong> Each error shows exact row, column, and field</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Actionable suggestions:</strong> Specific recommendations for fixing each error</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Smart matching:</strong> Reference errors suggest similar valid values</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Multiple views:</strong> Group errors by row or by category</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Severity levels:</strong> Distinguish between errors, warnings, and info</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Fix actions:</strong> Contextual actions for common error types</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Dismissible warnings:</strong> Non-critical issues can be dismissed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Visual hierarchy:</strong> Color-coded by severity with clear icons</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
