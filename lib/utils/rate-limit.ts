/**
 * Rate Limiting Utilities
 * 
 * Client-side rate limiting for authentication attempts
 * - Track failed login attempts
 * - Implement lockout after 5 failed attempts
 * - 15-minute lockout duration
 */

interface RateLimitData {
  attempts: number
  lastAttempt: number
  lockedUntil: number | null
}

const STORAGE_KEY = 'auth_rate_limit'
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
const RESET_DURATION = 60 * 60 * 1000 // 1 hour - reset counter after this time

/**
 * Get current rate limit data from localStorage
 */
function getRateLimitData(): RateLimitData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to read rate limit data:', error)
  }
  
  return {
    attempts: 0,
    lastAttempt: 0,
    lockedUntil: null,
  }
}

/**
 * Save rate limit data to localStorage
 */
function saveRateLimitData(data: RateLimitData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save rate limit data:', error)
  }
}

/**
 * Check if user is currently locked out
 */
export function isRateLimited(): { limited: boolean; remainingTime?: number } {
  const data = getRateLimitData()
  const now = Date.now()

  // Check if locked
  if (data.lockedUntil && now < data.lockedUntil) {
    return {
      limited: true,
      remainingTime: data.lockedUntil - now,
    }
  }

  // Reset lock if duration passed
  if (data.lockedUntil && now >= data.lockedUntil) {
    saveRateLimitData({
      attempts: 0,
      lastAttempt: 0,
      lockedUntil: null,
    })
  }

  return { limited: false }
}

/**
 * Record a failed login attempt
 * Returns whether CAPTCHA should be shown (after 3 attempts)
 * and whether user is now locked out (after 5 attempts)
 */
export function recordFailedAttempt(): {
  showCaptcha: boolean
  isLocked: boolean
  attempts: number
  remainingAttempts: number
  lockedUntil?: number
} {
  const data = getRateLimitData()
  const now = Date.now()

  // Reset attempts if last attempt was over an hour ago
  if (data.lastAttempt && now - data.lastAttempt > RESET_DURATION) {
    data.attempts = 0
  }

  // Increment attempts
  data.attempts += 1
  data.lastAttempt = now

  // Lock out after 5 attempts
  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockedUntil = now + LOCKOUT_DURATION
    saveRateLimitData(data)
    
    return {
      showCaptcha: true,
      isLocked: true,
      attempts: data.attempts,
      remainingAttempts: 0,
      lockedUntil: data.lockedUntil,
    }
  }

  saveRateLimitData(data)

  return {
    showCaptcha: data.attempts >= 3, // Show CAPTCHA after 3 attempts
    isLocked: false,
    attempts: data.attempts,
    remainingAttempts: MAX_ATTEMPTS - data.attempts,
  }
}

/**
 * Record a successful login attempt
 * Resets the rate limit counter
 */
export function recordSuccessfulAttempt(): void {
  saveRateLimitData({
    attempts: 0,
    lastAttempt: 0,
    lockedUntil: null,
  })
}

/**
 * Get current attempt count
 */
export function getAttemptCount(): number {
  const data = getRateLimitData()
  const now = Date.now()

  // Reset if last attempt was over an hour ago
  if (data.lastAttempt && now - data.lastAttempt > RESET_DURATION) {
    return 0
  }

  return data.attempts
}

/**
 * Reset rate limiting (for testing or manual reset)
 */
export function resetRateLimit(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Format remaining lockout time for display
 */
export function formatRemainingTime(milliseconds: number): string {
  const minutes = Math.ceil(milliseconds / 60000)
  if (minutes === 1) {
    return '1 minute'
  }
  return `${minutes} minutes`
}
