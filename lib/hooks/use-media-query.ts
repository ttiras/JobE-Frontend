import { useEffect, useState } from 'react'

/**
 * Custom hook for responsive media queries
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize state with the initial media query match value
  // Use function initializer to avoid calling matchMedia during SSR
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Create event listener (this is the proper way - setState in callback)
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Update state if query changed (defer to avoid synchronous setState)
    let timeoutId: NodeJS.Timeout | null = null
    if (media.matches !== matches) {
      // Defer the state update to avoid synchronous setState in effect
      timeoutId = setTimeout(() => {
        setMatches(media.matches)
      }, 0)
    }

    // Add listener (modern browsers)
    if (media.addEventListener) {
      media.addEventListener('change', listener)
    } else {
      // Fallback for older browsers
      media.addListener(listener)
    }

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (media.removeEventListener) {
        media.removeEventListener('change', listener)
      } else {
        media.removeListener(listener)
      }
    }
  }, [query, matches])

  return matches
}
