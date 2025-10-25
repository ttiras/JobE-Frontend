"use client"

import React from 'react'

/**
 * CurrentYear
 * Small client component that renders the current year.
 * Useful in Server Components to avoid request-data reads for new Date().
 */
export function CurrentYear({ className }: { className?: string }) {
  return <span className={className}>{new Date().getFullYear()}</span>
}
