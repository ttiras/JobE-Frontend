'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { executeQuery } from '@/lib/nhost/graphql/client'

type TestResult = { success: boolean; data?: unknown; error?: string }
type TestResults = Record<string, TestResult>

export default function GraphQLTestPage() {
  const { user, isAuthenticated } = useAuth()
  const [testResults, setTestResults] = useState<TestResults>({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results: TestResults = {}

    // Test 1: Get org sizes (should work for any authenticated user)
    try {
      const orgSizes = await executeQuery<{ org_size: Array<{ value: string; comment?: string }> }>(
        `query { org_size { value comment } }`
      )
      results.orgSizes = { success: true, data: orgSizes }
    } catch (error) {
      results.orgSizes = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test 2: Get industries
    try {
      const industries = await executeQuery<{ industries_enum: Array<{ value: string; comment?: string }> }>(
        `query { industries_enum { value comment } }`
      )
      results.industries = { success: true, data: industries }
    } catch (error) {
      results.industries = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test 3: Get user's organizations
    if (user?.id) {
      try {
        const orgs = await executeQuery<{ organizations: Array<{ id: string; name: string; size?: string; industry?: string }> }>(
          `query GetUserOrgs($userId: uuid!) {
            organizations(where: { created_by: { _eq: $userId }, deleted_at: { _is_null: true } }) {
              id
              name
              size
              industry
            }
          }`,
          { userId: user.id }
        )
        results.organizations = { success: true, data: orgs }
      } catch (error) {
        results.organizations = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    setTestResults(results)
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">GraphQL Tests</h1>
      
      <div className="mb-6 p-4 bg-muted rounded">
        <h2 className="font-bold mb-2">Authentication Status:</h2>
        <p>Authenticated: {isAuthenticated ? '✅' : '❌'}</p>
        <p>User ID: {user?.id || 'None'}</p>
        <p>User Email: {user?.email || 'None'}</p>
        <p>Roles: {user?.roles.join(', ') || 'None'}</p>
      </div>

      <button
        onClick={runTests}
        disabled={loading || !isAuthenticated}
        className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50 mb-4"
      >
        {loading ? 'Running Tests...' : 'Run GraphQL Tests'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Results:</h2>
          
          {/* Org Sizes Test */}
          <div className="p-4 bg-muted rounded">
            <h3 className="font-bold mb-2">
              Test 1: Get Org Sizes {testResults.orgSizes?.success ? '✅' : '❌'}
            </h3>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(testResults.orgSizes, null, 2)}
            </pre>
          </div>

          {/* Industries Test */}
          <div className="p-4 bg-muted rounded">
            <h3 className="font-bold mb-2">
              Test 2: Get Industries {testResults.industries?.success ? '✅' : '❌'}
            </h3>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(testResults.industries, null, 2)}
            </pre>
          </div>

          {/* Organizations Test */}
          {testResults.organizations && (
            <div className="p-4 bg-muted rounded">
              <h3 className="font-bold mb-2">
                Test 3: Get User Organizations {testResults.organizations?.success ? '✅' : '❌'}
              </h3>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(testResults.organizations, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
