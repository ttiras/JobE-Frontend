'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useTranslations } from 'next-intl'

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

interface CaptchaProps {
  action: string
  onVerify: (token: string) => void
  onError?: (error: Error) => void
  onExpired?: () => void
  expirationTime?: number // in milliseconds, default 2 minutes
  badge?: 'bottomright' | 'bottomleft' | 'inline'
}

export interface CaptchaHandle {
  refresh: () => void
}

export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(
  ({ action, onVerify, onError, onExpired, expirationTime = 120000, badge = 'bottomright' }, ref) => {
  const tAuth = useTranslations('auth')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const scriptLoadedRef = useRef(false)

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

    const executeCaptcha = async () => {
      if (!siteKey) {
        const error = new Error('reCAPTCHA site key not configured')
        setError(error.message)
        onError?.(error)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('reCAPTCHA loading timeout'))
          }, 10000)

          if (window.grecaptcha) {
            clearTimeout(timeout)
            resolve(true)
          } else {
            // Wait for script to load
            const interval = setInterval(() => {
              if (window.grecaptcha) {
                clearInterval(interval)
                clearTimeout(timeout)
                resolve(true)
              }
            }, 100)
          }
        })

        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(siteKey, { action })
            onVerify(token)
            setIsLoading(false)

            // Set up token expiration
            if (timerRef.current) {
              clearTimeout(timerRef.current)
            }
            timerRef.current = setTimeout(() => {
              onExpired?.()
              executeCaptcha() // Auto-refresh
            }, expirationTime)
          } catch (err) {
            const error = err instanceof Error ? err : new Error('reCAPTCHA execution failed')
            setError(error.message)
            setIsLoading(false)
            onError?.(error)
          }
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error('reCAPTCHA loading failed')
        setError(error.message)
        setIsLoading(false)
        onError?.(error)
      }
    }

    useEffect(() => {
      if (!scriptLoadedRef.current && !document.querySelector('script[src*="recaptcha"]')) {
        const script = document.createElement('script')
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
        // Set boolean attributes explicitly for better JSDOM/test detection
        script.setAttribute('async', '')
        script.setAttribute('defer', '')
        script.onerror = () => {
          const error = new Error('Failed to load reCAPTCHA script')
          setError(error.message)
          onError?.(error)
        }
        document.head.appendChild(script)
        scriptLoadedRef.current = true
      }

      executeCaptcha()

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    }, [action])

    useImperativeHandle(ref, () => ({
      refresh: executeCaptcha,
    }))

    return (
      <div className="space-y-2">
        {isLoading && (
          <div 
            className="text-sm text-muted-foreground text-center"
            aria-busy="true"
            aria-live="polite"
          >
            {tAuth('captcha.loading')}
          </div>
        )}
        
        {error && (
          <div 
            className="text-sm text-destructive text-center"
            role="alert"
          >
            {tAuth('captcha.error')}
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Terms of Service
          </a>{' '}
          apply.
        </div>
      </div>
    )
  }
)

Captcha.displayName = 'Captcha'
