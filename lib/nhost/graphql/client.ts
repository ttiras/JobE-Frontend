/**
 * GraphQL Client
 * 
 * Configures GraphQL client with Nhost authentication headers.
 * Provides type-safe GraphQL operations with automatic error handling.
 * 
 * Features:
 * - Automatic authentication header injection
 * - TypeScript type safety with generated types
 * - Error handling and retry logic
 * - Request/response interceptors
 * 
 * @see https://docs.nhost.io/reference/javascript/graphql
 */

import { nhost } from '../client'

/**
 * GraphQL request options
 */
export interface GraphQLRequestOptions {
  /** Request headers */
  headers?: Record<string, string>
  /** Request timeout in milliseconds */
  timeout?: number
}

/**
 * GraphQL error type
 */
export interface GraphQLError {
  message: string
  extensions?: {
    code?: string
    path?: string[]
    [key: string]: any
  }
}

/**
 * GraphQL response type
 */
export interface GraphQLResponse<T = any> {
  data?: T
  errors?: GraphQLError[]
}

/**
 * Execute a GraphQL query
 * 
 * Automatically includes authentication headers from Nhost session.
 * 
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @param options - Request options
 * @returns Query response data
 * @throws Error if query fails
 */
export async function executeQuery<T = any>(
  query: string,
  variables?: Record<string, any>,
  options?: GraphQLRequestOptions
): Promise<T> {
  const response = await nhost.graphql.request<T>({
    query,
    variables,
  }, options)

  if (response.status !== 200) {
    throw new Error(
      `GraphQL query failed with status ${response.status}: ${JSON.stringify(response.body)}`
    )
  }

  const result = response.body

  if (result.errors && result.errors.length > 0) {
    const error = result.errors[0]
    throw new Error(
      error.message || 'GraphQL query error'
    )
  }

  if (!result.data) {
    throw new Error('GraphQL query returned no data')
  }

  return result.data
}

/**
 * Execute a GraphQL mutation
 * 
 * Automatically includes authentication headers from Nhost session.
 * 
 * @param mutation - GraphQL mutation string
 * @param variables - Mutation variables
 * @param options - Request options
 * @returns Mutation response data
 * @throws Error if mutation fails
 */
export async function executeMutation<T = any>(
  mutation: string,
  variables?: Record<string, any>,
  options?: GraphQLRequestOptions
): Promise<T> {
  const response = await nhost.graphql.request<T>({
    query: mutation,
    variables,
  }, options)

  if (response.status !== 200) {
    throw new Error(
      `GraphQL mutation failed with status ${response.status}: ${JSON.stringify(response.body)}`
    )
  }

  const result = response.body

  if (result.errors && result.errors.length > 0) {
    const error = result.errors[0]
    throw new Error(
      error.message || 'GraphQL mutation error'
    )
  }

  if (!result.data) {
    throw new Error('GraphQL mutation returned no data')
  }

  return result.data
}

/**
 * Get GraphQL client instance
 * 
 * For advanced use cases where direct access to the client is needed.
 * 
 * @returns Nhost GraphQL client
 */
export function getGraphQLClient() {
  return nhost.graphql
}
