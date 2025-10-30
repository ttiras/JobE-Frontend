/**
 * Demo component for duplicate detection and resolution
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DuplicateDetectionDisplay,
  DuplicateSummaryBadge,
} from '@/components/import/duplicate-detection-display'
import {
  detectDuplicates,
  type DuplicateResolution,
} from '@/lib/utils/duplicate-detector'

export function DuplicateDetectionDemo() {
  // Sample data with duplicates
  const sampleData = {
    departments: [
      { row: 2, code: 'ENG-001', name: 'Engineering', description: 'Product development' },
      { row: 3, code: 'SALES-001', name: 'Sales', description: 'Sales team' },
      { row: 4, code: 'HR-001', name: 'Human Resources', description: null },
      { row: 5, code: 'ENG-001', name: 'Engineering', description: 'Software development department' }, // Duplicate with more info
      { row: 6, code: 'SALES-001', name: 'Sales', description: 'Sales team' }, // Exact duplicate
      { row: 7, code: 'FIN-001', name: 'Finance', description: 'Financial operations' },
      { row: 8, code: 'ENG-001', name: 'Engineering Dept', description: 'Engineering' }, // Duplicate with different name
      { row: 9, code: 'MKT-001', name: 'Marketing', description: 'Marketing and communications' },
    ],
    positions: [
      { row: 2, code: 'POS-001', title: 'Software Engineer', department_code: 'ENG-001', description: 'Junior developer' },
      { row: 3, code: 'POS-002', title: 'Sales Manager', department_code: 'SALES-001', description: null },
      { row: 4, code: 'POS-003', title: 'HR Specialist', department_code: 'HR-001', description: 'Recruitment' },
      { row: 5, code: 'POS-001', title: 'Software Engineer', department_code: 'ENG-001', description: 'Develops software applications' }, // Duplicate with more info
      { row: 6, code: 'POS-004', title: 'Finance Analyst', department_code: 'FIN-001', description: 'Financial analysis' },
      { row: 7, code: 'POS-002', title: 'Sales Manager', department_code: 'SALES-001', description: 'Manages sales team' }, // Duplicate with different info
      { row: 8, code: 'POS-005', title: 'Marketing Specialist', department_code: 'MKT-001', description: 'Digital marketing' },
      { row: 9, code: 'POS-001', title: 'Senior Software Engineer', department_code: 'ENG-001', description: 'Senior developer' }, // Duplicate with different title
    ],
  }

  const [detectionResult, setDetectionResult] = useState(() => detectDuplicates(sampleData))
  const [resolutions, setResolutions] = useState<DuplicateResolution[]>([])
  const [showDisplay, setShowDisplay] = useState(true)

  const handleResolve = (newResolutions: DuplicateResolution[]) => {
    setResolutions(newResolutions)
    console.log('Resolutions:', newResolutions)
  }

  const handleAutoResolve = () => {
    console.log('Auto-resolving all duplicates with recommended strategies')
  }

  const resetDemo = () => {
    setDetectionResult(detectDuplicates(sampleData))
    setResolutions([])
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Detection Demo</CardTitle>
          <CardDescription>
            Demonstration of duplicate detection with intelligent resolution strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Detection Summary:</span>
              <DuplicateSummaryBadge
                detectionResult={detectionResult}
                onClick={() => setShowDisplay(!showDisplay)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={resetDemo}>
              Reset Demo
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold text-yellow-600">
                {detectionResult.totalDuplicates}
              </div>
              <div className="text-sm text-muted-foreground">Total Duplicates</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold">
                {detectionResult.totalAffectedRows}
              </div>
              <div className="text-sm text-muted-foreground">Affected Rows</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold text-green-600">
                {detectionResult.autoResolvable}
              </div>
              <div className="text-sm text-muted-foreground">Auto-Resolvable</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold">
                {resolutions.length}
              </div>
              <div className="text-sm text-muted-foreground">Resolutions Applied</div>
            </div>
          </div>

          {/* Breakdown by sheet */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <div className="font-medium text-sm mb-2">Departments</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Duplicates: {detectionResult.departments.totalDuplicates}</div>
                <div>Affected Rows: {detectionResult.departments.affectedRows}</div>
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="font-medium text-sm mb-2">Positions</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Duplicates: {detectionResult.positions.totalDuplicates}</div>
                <div>Affected Rows: {detectionResult.positions.affectedRows}</div>
              </div>
            </div>
          </div>

          {/* Toggle button */}
          <Button
            variant="outline"
            onClick={() => setShowDisplay(!showDisplay)}
            className="w-full"
          >
            {showDisplay ? 'Hide' : 'Show'} Duplicate Detection Display
          </Button>
        </CardContent>
      </Card>

      {/* Duplicate detection display */}
      {showDisplay && (
        <DuplicateDetectionDisplay
          detectionResult={detectionResult}
          onResolve={handleResolve}
          onAutoResolve={handleAutoResolve}
        />
      )}

      {/* Resolutions preview */}
      {resolutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Applied Resolutions</CardTitle>
            <CardDescription>
              Preview of how duplicates will be resolved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resolutions.map((resolution, index) => (
                <div key={index} className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">
                      {resolution.value}
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      {resolution.strategy}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Keep Rows: {resolution.keepRows.join(', ')}</div>
                    <div>Remove Rows: {resolution.removeRows.join(', ')}</div>
                    {resolution.mergedData && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="font-medium mb-1">Merged Data:</div>
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(resolution.mergedData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Smart detection:</strong> Identifies duplicates by code across all rows</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Completeness analysis:</strong> Ranks duplicates by data completeness</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Difference highlighting:</strong> Shows which fields differ between duplicates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Intelligent recommendations:</strong> Suggests best resolution strategy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>4 resolution strategies:</strong> Keep First, Keep Last, Merge, Keep All</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Data merging:</strong> Intelligently combines data from multiple duplicates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Auto-resolve:</strong> One-click resolution for identical duplicates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Visual comparison:</strong> Side-by-side view of all duplicate entries</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
