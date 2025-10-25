"use client"

// Ensure dev-time patches execute in the browser as early as possible
// by importing the patch module at client bundle evaluation time.
import "@/lib/dev/patch-react-debug"

export function DevPatches() {
  // No UI, just ensure side-effects are loaded.
  return null
}
