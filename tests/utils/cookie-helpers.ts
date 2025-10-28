/**
 * Cookie Test Helpers
 * 
 * Utilities for testing HTTP cookie attributes and behavior.
 * Verifies security attributes (Secure, HttpOnly, SameSite, Path, etc.)
 */

/**
 * Cookie attributes interface matching Nhost configuration
 */
export interface CookieAttributes {
  secure: boolean
  httpOnly: boolean
  sameSite: 'Strict' | 'Lax' | 'None'
  path: string
  maxAge?: number
  domain?: string
  expires?: Date
}

/**
 * Parse cookie string into name, value, and attributes
 */
export function parseCookie(cookieString: string): {
  name: string
  value: string
  attributes: Partial<CookieAttributes>
} {
  const parts = cookieString.split(';').map(p => p.trim())
  const [nameValue, ...attrs] = parts
  const [name, value] = nameValue.split('=')
  
  const attributes: Partial<CookieAttributes> = {}
  
  for (const attr of attrs) {
    const [key, val] = attr.split('=')
    const lowerKey = key.toLowerCase()
    
    if (lowerKey === 'secure') {
      attributes.secure = true
    } else if (lowerKey === 'httponly') {
      attributes.httpOnly = true
    } else if (lowerKey === 'samesite') {
      attributes.sameSite = val as CookieAttributes['sameSite']
    } else if (lowerKey === 'path') {
      attributes.path = val
    } else if (lowerKey === 'max-age') {
      attributes.maxAge = parseInt(val, 10)
    } else if (lowerKey === 'domain') {
      attributes.domain = val
    } else if (lowerKey === 'expires') {
      attributes.expires = new Date(val)
    }
  }
  
  return { name, value, attributes }
}

/**
 * Verify cookie has required security attributes
 */
export function verifyCookieSecurity(
  cookieString: string,
  expectedAttributes?: Partial<CookieAttributes>
): { valid: boolean; errors: string[] } {
  const { attributes } = parseCookie(cookieString)
  const errors: string[] = []
  
  // Required security attributes
  if (!attributes.secure) {
    errors.push('Cookie must have Secure attribute')
  }
  
  if (!attributes.httpOnly) {
    errors.push('Cookie must have HttpOnly attribute')
  }
  
  if (!attributes.sameSite || attributes.sameSite === 'None') {
    errors.push('Cookie must have SameSite=Lax or SameSite=Strict')
  }
  
  if (!attributes.path || attributes.path !== '/') {
    errors.push('Cookie must have Path=/')
  }
  
  // Check expected attributes if provided
  if (expectedAttributes) {
    if (expectedAttributes.secure !== undefined && attributes.secure !== expectedAttributes.secure) {
      errors.push(`Expected secure=${expectedAttributes.secure}, got ${attributes.secure}`)
    }
    
    if (expectedAttributes.httpOnly !== undefined && attributes.httpOnly !== expectedAttributes.httpOnly) {
      errors.push(`Expected httpOnly=${expectedAttributes.httpOnly}, got ${attributes.httpOnly}`)
    }
    
    if (expectedAttributes.sameSite && attributes.sameSite !== expectedAttributes.sameSite) {
      errors.push(`Expected sameSite=${expectedAttributes.sameSite}, got ${attributes.sameSite}`)
    }
    
    if (expectedAttributes.path && attributes.path !== expectedAttributes.path) {
      errors.push(`Expected path=${expectedAttributes.path}, got ${attributes.path}`)
    }
    
    if (expectedAttributes.maxAge && attributes.maxAge !== expectedAttributes.maxAge) {
      errors.push(`Expected maxAge=${expectedAttributes.maxAge}, got ${attributes.maxAge}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create mock Request/Response cookies for Next.js testing
 */
export function createMockCookies() {
  const cookieStore: Map<string, string> = new Map()
  
  return {
    // Request cookies (ReadonlyRequestCookies)
    request: {
      get(name: string) {
        const value = cookieStore.get(name)
        return value ? { name, value } : undefined
      },
      getAll(name?: string) {
        if (name) {
          const value = cookieStore.get(name)
          return value ? [{ name, value }] : []
        }
        return Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }))
      },
      has(name: string) {
        return cookieStore.has(name)
      },
    },
    
    // Response cookies (ResponseCookies)
    response: {
      set(name: string, value: string) {
        cookieStore.set(name, value)
        return this
      },
      get(name: string) {
        const value = cookieStore.get(name)
        return value ? { name, value } : undefined
      },
      delete(name: string) {
        cookieStore.delete(name)
        return this
      },
      has(name: string) {
        return cookieStore.has(name)
      },
      clear() {
        cookieStore.clear()
        return this
      },
    },
    
    // Test helpers
    _internal: {
      store: cookieStore,
      setCookie(name: string, value: string) {
        cookieStore.set(name, value)
      },
      getCookie(name: string) {
        return cookieStore.get(name)
      },
      getAllCookies() {
        return Object.fromEntries(cookieStore.entries())
      },
      clearAll() {
        cookieStore.clear()
      },
    },
  }
}

/**
 * Verify Nhost session cookies are set correctly
 */
export function verifyNhostSessionCookies(cookies: Record<string, string>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Nhost typically stores tokens in these cookies
  const requiredCookies = ['nhostRefreshToken']
  
  for (const cookieName of requiredCookies) {
    if (!cookies[cookieName]) {
      errors.push(`Missing required cookie: ${cookieName}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Simulate cookie expiration for testing
 */
export function createExpiredCookie(name: string, value: string): string {
  const pastDate = new Date(Date.now() - 86400000) // 1 day ago
  return `${name}=${value}; Expires=${pastDate.toUTCString()}; Secure; HttpOnly; SameSite=Lax; Path=/`
}

/**
 * Create valid session cookie string for testing
 */
export function createSessionCookie(name: string, value: string, maxAge: number = 2592000): string {
  return `${name}=${value}; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax; Path=/`
}
