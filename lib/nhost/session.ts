import type { UserRole } from '@/lib/types/nhost'
import { cookies } from 'next/headers'

export type MinimalSession = {
  accessToken?: string
  refreshToken?: string
}

export async function getSessionFromCookies(): Promise<MinimalSession | null> {
  const store = await cookies()
  const cookie = store.get('nhostSession')
  if (!cookie?.value) return null
  try {
    const decoded = decodeURIComponent(cookie.value)
    const parsed = JSON.parse(decoded)
    const accessToken: string | undefined = parsed?.accessToken || parsed?.session?.accessToken
    const refreshToken: string | undefined = parsed?.refreshToken || parsed?.session?.refreshToken
    return { accessToken, refreshToken }
  } catch {
    return null
  }
}

export function decodeJWT(token: string): unknown | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8')
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function getUserRole(accessToken?: string): UserRole | null {
  if (!accessToken) return null
  const decoded = decodeJWT(accessToken)
  if (!decoded) return null
  const payload = decoded as Record<string, unknown>
  const hasuraClaims = payload['https://hasura.io/jwt/claims'] as Record<string, unknown> | undefined
  if (!hasuraClaims) return null
  return (hasuraClaims['x-hasura-default-role'] as UserRole) || null
}

export function getAllowedRoles(accessToken?: string): UserRole[] {
  if (!accessToken) return []
  const decoded = decodeJWT(accessToken)
  if (!decoded) return []
  const payload = decoded as Record<string, unknown>
  const hasuraClaims = payload['https://hasura.io/jwt/claims'] as Record<string, unknown> | undefined
  const roles = (hasuraClaims?.['x-hasura-allowed-roles'] as unknown) || []
  return Array.isArray(roles) ? (roles.filter(Boolean) as UserRole[]) : []
}

export function isAccessTokenExpired(accessToken?: string): boolean {
  if (!accessToken) return true
  const decoded = decodeJWT(accessToken)
  const payload = (decoded || {}) as Record<string, unknown>
  const exp = payload['exp'] as number | undefined
  if (!exp) return false
  const nowSeconds = Math.floor(Date.now() / 1000)
  return exp <= nowSeconds
}
