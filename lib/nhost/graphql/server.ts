/**
 * Server-side GraphQL helpers with auth validation
 *
 * Use these from Server Actions, Route Handlers, or Server Components
 * to ensure the user is authenticated before performing data access.
 */

import type { UserRole } from '@/lib/types/nhost'
import { requireAuth } from '@/lib/nhost/server-auth'
import { createNhostServerClient } from '@/lib/nhost/server-client'

export interface GraphQLRequestOptions {
  headers?: Record<string, string>
  timeout?: number
}

/**
 * Get a server-side Nhost GraphQL client after validating auth.
 * Returns the per-request client and the validated session.
 */
export async function getServerGraphQLClient(requiredRoles?: UserRole[]) {
  const session = await requireAuth(requiredRoles)
  const client = await createNhostServerClient()
  return { client, session }
}

/**
 * Execute a GraphQL query on the server with auth enforced.
 * Throws on HTTP or GraphQL errors.
 */
export async function serverExecuteQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphQLRequestOptions,
  requiredRoles?: UserRole[]
): Promise<T> {
  const { client } = await getServerGraphQLClient(requiredRoles)
  const response = await client.graphql.request<T>({ query, variables }, options)

  if (response.status !== 200) {
    throw new Error(`GraphQL query failed (${response.status}): ${JSON.stringify(response.body)}`)
  }

  const body = response.body as { data?: T; errors?: Array<{ message: string }> }
  if (body.errors?.length) {
    throw new Error(body.errors[0].message || 'GraphQL query error')
  }
  if (!body.data) {
    throw new Error('GraphQL query returned no data')
  }
  return body.data
}

/**
 * Execute a GraphQL mutation on the server with auth enforced.
 * Throws on HTTP or GraphQL errors.
 */
export async function serverExecuteMutation<T = unknown>(
  mutation: string,
  variables?: Record<string, unknown>,
  options?: GraphQLRequestOptions,
  requiredRoles?: UserRole[]
): Promise<T> {
  const { client } = await getServerGraphQLClient(requiredRoles)
  const response = await client.graphql.request<T>({ query: mutation, variables }, options)

  if (response.status !== 200) {
    throw new Error(`GraphQL mutation failed (${response.status}): ${JSON.stringify(response.body)}`)
  }

  const body = response.body as { data?: T; errors?: Array<{ message: string }> }
  if (body.errors?.length) {
    throw new Error(body.errors[0].message || 'GraphQL mutation error')
  }
  if (!body.data) {
    throw new Error('GraphQL mutation returned no data')
  }
  return body.data
}

/**
 * Pattern samples
 *
 * // In a Route Handler (app/api/profile/route.ts)
 * export async function GET() {
 *   try {
 *     const data = await serverExecuteQuery(ProfileQuery, { userId })
 *     return NextResponse.json(data)
 *   } catch (e) {
 *     return NextResponse.json({ error: String(e) }, { status: 401 })
 *   }
 * }
 *
 * // In a Server Action
 * 'use server'
 * export async function updateProfile(input: UpdateInput) {
 *   return serverExecuteMutation(UpdateProfileMutation, { input }, undefined, ['user'])
 * }
 */
