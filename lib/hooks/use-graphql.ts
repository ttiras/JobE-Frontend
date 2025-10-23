'use client'

/**
 * useGraphQL Hook
 * 
 * Custom React hook for GraphQL queries and mutations with state management,
 * error handling, and loading states.
 * 
 * Features:
 * - Query and mutation execution
 * - Loading state tracking
 * - Error handling
 * - Automatic re-fetching
 * - Cache management (basic)
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useGraphQL()
 * 
 * useEffect(() => {
 *   execute(GET_USER_PROFILE)
 * }, [])
 * 
 * if (loading) return <Loading />
 * if (error) return <Error message={error.message} />
 * return <Profile data={data} />
 * ```
 */

import { useState, useCallback } from 'react'
import { executeQuery, executeMutation } from '@/lib/nhost/graphql/client'

export interface UseGraphQLOptions {
  /** Initial data */
  initialData?: any
  /** Callback when query succeeds */
  onSuccess?: (data: any) => void
  /** Callback when query fails */
  onError?: (error: Error) => void
}

export interface UseGraphQLReturn<T = any> {
  /** Query/mutation result data */
  data: T | null
  /** Loading state */
  loading: boolean
  /** Error if any */
  error: Error | null
  /** Execute a query */
  query: (queryString: string, variables?: Record<string, any>) => Promise<T>
  /** Execute a mutation */
  mutate: (mutationString: string, variables?: Record<string, any>) => Promise<T>
  /** Generic execute (same as query) */
  execute: (queryString: string, variables?: Record<string, any>) => Promise<T>
  /** Reset state */
  reset: () => void
  /** Refetch last query */
  refetch: () => Promise<T | null>
}

export function useGraphQL<T = any>(options: UseGraphQLOptions = {}): UseGraphQLReturn<T> {
  const [data, setData] = useState<T | null>((options.initialData as T) || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastQuery, setLastQuery] = useState<{
    query: string
    variables?: Record<string, any>
  } | null>(null)

  const reset = useCallback(() => {
    setData(options.initialData || null)
    setLoading(false)
    setError(null)
    setLastQuery(null)
  }, [options.initialData])

  const query = useCallback(async (
    queryString: string,
    variables?: Record<string, any>
  ): Promise<T> => {
    try {
      setLoading(true)
      setError(null)
      setLastQuery({ query: queryString, variables })

      const result = await executeQuery<T>(queryString, variables)
      
      setData(result)
      setLoading(false)
      
      options.onSuccess?.(result)
      
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      setLoading(false)
      
      options.onError?.(error)
      
      throw error
    }
  }, [options])

  const mutate = useCallback(async (
    mutationString: string,
    variables?: Record<string, any>
  ): Promise<T> => {
    try {
      setLoading(true)
      setError(null)

      const result = await executeMutation<T>(mutationString, variables)
      
      setData(result)
      setLoading(false)
      
      options.onSuccess?.(result)
      
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      setLoading(false)
      
      options.onError?.(error)
      
      throw error
    }
  }, [options])

  const refetch = useCallback(async (): Promise<T | null> => {
    if (!lastQuery) {
      console.warn('No previous query to refetch')
      return null
    }

    return query(lastQuery.query, lastQuery.variables)
  }, [lastQuery, query])

  return {
    data,
    loading,
    error,
    query,
    mutate,
    execute: query, // Alias for query
    reset,
    refetch,
  }
}

/**
 * useQuery Hook
 * 
 * Specialized hook for GraphQL queries with automatic execution.
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useQuery(
 *   GET_USER_PROFILE,
 *   { userId: '123' }
 * )
 * ```
 */
export interface UseQueryOptions extends UseGraphQLOptions {
  /** Skip automatic execution */
  skip?: boolean
}

export function useQuery<T = any>(
  queryString: string,
  variables?: Record<string, any>,
  options: UseQueryOptions = {}
) {
  const graphql = useGraphQL<T>(options)

  // Auto-execute query on mount (unless skip is true)
  useState(() => {
    if (!options.skip) {
      graphql.query(queryString, variables)
    }
  })

  return {
    data: graphql.data,
    loading: graphql.loading,
    error: graphql.error,
    refetch: () => graphql.query(queryString, variables),
  }
}

/**
 * useMutation Hook
 * 
 * Specialized hook for GraphQL mutations.
 * 
 * @example
 * ```tsx
 * const [createOrg, { loading, error }] = useMutation(CREATE_ORGANIZATION)
 * 
 * const handleSubmit = async (data) => {
 *   const result = await createOrg({ input: data })
 *   console.log('Created:', result)
 * }
 * ```
 */
export function useMutation<T = any>(
  mutationString: string,
  options: UseGraphQLOptions = {}
) {
  const graphql = useGraphQL<T>(options)

  const executeMutation = useCallback(
    (variables?: Record<string, any>) => {
      return graphql.mutate(mutationString, variables)
    },
    [graphql, mutationString]
  )

  return [
    executeMutation,
    {
      data: graphql.data,
      loading: graphql.loading,
      error: graphql.error,
      reset: graphql.reset,
    },
  ] as const
}
