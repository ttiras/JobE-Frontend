/**
 * Dev-only guard against React/Next debug property redefinition crashes.
 *
 * Context: React 19 + Next 16 dev builds attach non-configurable `_debugInfo`
 * to elements/values during RSC/RSC-hydration. Certain paths attempt to
 * redefine this property (e.g., moving debug info between chunks), which can
 * throw `TypeError: Cannot redefine property: _debugInfo` in development.
 *
 * This patch wraps Object.defineProperty and, only when redefining `_debugInfo`
 * fails, falls back to a direct assignment which is safe because React defines
 * the property as writable.
 *
 * Production builds are unaffected.
 */
// eslint-disable-next-line no-constant-condition
if (typeof window !== 'undefined' ? process.env.NODE_ENV !== 'production' : process.env.NODE_ENV !== 'production') {
  const originalDefineProperty = Object.defineProperty;

  try {
    // Narrow the wrapper typing to preserve the original signature.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Object.defineProperty as any) = function definePropertyPatched(
      target: object,
      property: PropertyKey,
      descriptor: PropertyDescriptor
    ) {
      try {
        // First, try the native path.
        return originalDefineProperty(target, property, descriptor);
      } catch (err) {
        // Only special-case the exact development crash we see:
        if (
          property === '_debugInfo' &&
          descriptor && 'value' in descriptor &&
          // Ensure the target already has the property (so we're truly re-defining)
          Object.prototype.hasOwnProperty.call(target, '_debugInfo')
        ) {
          try {
            // React sets `_debugInfo` as writable: true; assign instead of redefining.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (target as any)._debugInfo = (descriptor as any).value;
            return target;
          } catch {
            // Fall through to rethrow the original error.
          }
        }
        throw err;
      }
    } as typeof Object.defineProperty;
  } catch {
    // If anything goes wrong, silently bail and keep the native behavior.
    // Better to have the original error than break defineProperty globally.
  }
}
