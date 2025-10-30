/**
 * Animation Utilities
 * Framer Motion-like animations using CSS
 */

export const fadeIn = 'animate-in fade-in duration-300'
export const fadeOut = 'animate-out fade-out duration-200'
export const slideInFromRight = 'animate-in slide-in-from-right duration-300'
export const slideInFromLeft = 'animate-in slide-in-from-left duration-300'
export const slideInFromTop = 'animate-in slide-in-from-top-4 duration-300'
export const slideInFromBottom = 'animate-in slide-in-from-bottom-4 duration-300'
export const scaleIn = 'animate-in zoom-in-95 duration-200'
export const scaleOut = 'animate-out zoom-out-95 duration-200'

/**
 * Stagger animation utilities
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): string {
  return `animation-delay-${index * baseDelay}`
}

/**
 * Combined animation presets
 */
export const animations = {
  // Page transitions
  pageEnter: 'animate-in fade-in slide-in-from-bottom-4 duration-500',
  pageExit: 'animate-out fade-out slide-in-to-top-4 duration-300',
  
  // Modal/Dialog
  modalEnter: 'animate-in fade-in zoom-in-95 duration-200',
  modalExit: 'animate-out fade-out zoom-out-95 duration-150',
  
  // Card/Panel
  cardEnter: 'animate-in fade-in slide-in-from-bottom-2 duration-400',
  cardHover: 'transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
  
  // List items
  listItemEnter: 'animate-in fade-in slide-in-from-left-2 duration-300',
  
  // Success/Error states
  successPulse: 'animate-in zoom-in-95 duration-300',
  errorShake: 'animate-shake',
  
  // Loading states
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
}

/**
 * Custom Tailwind animation classes
 * Add these to tailwind.config.ts if not already present:
 * 
 * theme: {
 *   extend: {
 *     keyframes: {
 *       shake: {
 *         '0%, 100%': { transform: 'translateX(0)' },
 *         '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
 *         '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
 *       },
 *     },
 *     animation: {
 *       shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
 *     },
 *   },
 * }
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
